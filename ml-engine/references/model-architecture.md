# Model Architecture Patterns — MoE, Router, FFN, LayerNorm

## Mixture of Experts (MoE)

### Top-K Router

```python
import torch
import torch.nn as nn
from torch_xla.distributed.spmd import mark_sharding, PartitionSpec

class TopKRouter(nn.Module):
    def __init__(self, dim, num_experts, top_k=2, capacity_factor=1.25):
        super().__init__()
        self.top_k = top_k
        self.num_experts = num_experts
        self.capacity = int(top_k * capacity_factor)  # tokens per expert per batch

        self.gate = nn.Linear(dim, num_experts, bias=False)
        # Shard expert dimension across TPU cores (model parallelism)
        mark_sharding(self.gate.weight, mesh, PartitionSpec(None, "model"))

    def forward(self, x):
        # x: (batch, seq, dim)
        logits = self.gate(x)  # (batch, seq, num_experts)
        gates, indices = torch.topk(torch.softmax(logits, dim=-1), self.top_k, dim=-1)
        # gates: (batch, seq, top_k), indices: (batch, seq, top_k)
        return gates, indices
```

### Expert Layer

```python
class Expert(nn.Module):
    """Single FFN expert. Shared across all positions."""
    def __init__(self, dim, hidden_dim, dropout=0.0):
        super().__init__()
        self.w1 = nn.Linear(dim, hidden_dim, bias=False)
        self.w2 = nn.Linear(hidden_dim, dim, bias=False)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        # SwiGLU variant
        return self.w2(self.dropout(torch.nn.functional.silu(self.w1(x))))
```

### MoE Layer with Dispatch

```python
class MoELayer(nn.Module):
    def __init__(self, dim, num_experts, top_k=2, expert_hidden_dim=None):
        super().__init__()
        self.num_experts = num_experts
        self.top_k = top_k
        self.router = TopKRouter(dim, num_experts, top_k)

        expert_dim = expert_hidden_dim or 4 * dim
        self.experts = nn.ModuleList([
            Expert(dim, expert_dim) for _ in range(num_experts)
        ])

        # Shard experts across model-parallel axis
        for i, expert in enumerate(self.experts):
            mark_sharding(expert.w1.weight, mesh, PartitionSpec("model", None))
            mark_sharding(expert.w2.weight, mesh, PartitionSpec(None, "model"))

    def forward(self, x):
        # x: (batch, seq, dim)
        batch, seq, dim = x.shape

        gates, indices = self.router(x)  # (b, s, k), (b, s, k)

        # Flatten batch and sequence for dispatch
        x_flat = x.view(-1, dim)  # (b*s, dim)
        gates_flat = gates.view(-1, self.top_k)  # (b*s, k)
        indices_flat = indices.view(-1, self.top_k)  # (b*s, k)

        # Initialize output buffer
        output = torch.zeros_like(x_flat)

        # Dispatch to experts (simple loop — optimize with scatter/gather for production)
        for i in range(self.num_experts):
            # Find tokens routed to expert i
            mask = (indices_flat == i).any(dim=-1)  # (b*s,)
            if mask.any():
                expert_input = x_flat[mask]  # (tokens_i, dim)
                expert_output = self.experts[i](expert_input)

                # Weight by gate values
                expert_gates = gates_flat[mask]  # (tokens_i, k)
                # Sum gate values for this expert
                gate_sum = expert_gates.sum(dim=-1, keepdim=True)
                output[mask] += gate_sum * expert_output

        return output.view(batch, seq, dim)
```

## Custom FFN Patterns

### SwiGLU FFN

```python
class SwiGLU(nn.Module):
    def __init__(self, dim, hidden_dim, dropout=0.0):
        super().__init__()
        self.w1 = nn.Linear(dim, hidden_dim, bias=False)
        self.w2 = nn.Linear(hidden_dim, dim, bias=False)
        self.w3 = nn.Linear(dim, hidden_dim, bias=False)  # gating
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        return self.w2(self.dropout(torch.nn.functional.silu(self.w1(x)) * self.w3(x)))
```

### Gated Linear Unit (GLU)

```python
class GLU(nn.Module):
    def __init__(self, dim, hidden_dim):
        super().__init__()
        self.w1 = nn.Linear(dim, hidden_dim)
        self.w2 = nn.Linear(dim, hidden_dim)
        self.w3 = nn.Linear(hidden_dim, dim)

    def forward(self, x):
        return self.w3(torch.nn.functional.gelu(self.w1(x)) * self.w2(x))
```

## Custom LayerNorm Patterns

### RMSNorm (no bias, no mean centering)

```python
class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x):
        norm = x.norm(2, dim=-1, keepdim=True) * (x.size(-1) ** -0.5)
        return self.weight * x / (norm + self.eps)
```

### LayerNorm with learned scaling

```python
class ScaledLayerNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))
        self.bias = nn.Parameter(torch.zeros(dim))
        self.scale = nn.Parameter(torch.ones(1))  # learned global scale

    def forward(self, x):
        mean = x.mean(dim=-1, keepdim=True)
        var = x.var(dim=-1, keepdim=True, unbiased=False)
        return self.scale * self.weight * (x - mean) / torch.sqrt(var + self.eps) + self.bias
```

## JAX Equivalents

```python
import jax
import jax.numpy as jnp
from flax import linen as nn

class JAXRMSNorm(nn.Module):
    dim: int
    eps: float = 1e-6

    @nn.compact
    def __call__(self, x):
        scale = self.param('scale', nn.initializers.ones, (self.dim,))
        norm = jnp.linalg.norm(x, axis=-1, keepdims=True) * (x.shape[-1] ** -0.5)
        return scale * x / (norm + self.eps)
```

## Sharding Strategies for Novel Components

| Component | Sharding Strategy | Axis |
|-----------|-------------------|------|
| Router gate weight | PartitionSpec(None, "model") | Shard experts across cores |
| Expert FFN w1 | PartitionSpec("model", None) | Shard input dim |
| Expert FFN w2 | PartitionSpec(None, "model") | Shard output dim |
| LayerNorm weight | PartitionSpec(None) | Replicate (small, all-gather is cheap) |
| Embedding | PartitionSpec("data", None) | Shard vocabulary (if large) |

## Anti-Patterns

- Don't shard LayerNorm — the all-gather overhead exceeds compute savings
- Don't use `nn.ModuleList` for 1000+ experts — use parameter-efficient routing or switch to JAX pmap
- Don't forget `mark_sharding` on expert weights — data parallelism defaults to replicating all parameters
