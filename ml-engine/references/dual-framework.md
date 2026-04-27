<<<<<<< S:/AntiGravity_Skills/ml-engine/references/dual-framework.md
# Dual-Framework Runtime — PT-XLA + JAX

## Philosophy

PT-XLA is primary for training loops because `torch.nn` ecosystem (transformers, datasets) is mature. JAX is secondary for:
- Custom differentiable operations (sorting, routing, top-k with custom grad)
- Auxiliary loss computations (contrastive losses, regularization)
- Fast prototyping of novel algorithms before porting to PT-XLA

## Zero-Copy Interop via DLPack

```python
import torch
import jax
import jax.numpy as jnp
from torch.utils.dlpack import to_dlpack, from_dlpack

# PyTorch tensor -> JAX array
pt_tensor = torch.randn(2, 4, device="xla")
jax_array = jax.dlpack.from_dlpack(to_dlpack(pt_tensor))

# JAX array -> PyTorch tensor
jax_array = jnp.ones((2, 4))
pt_tensor = from_dlpack(jax.dlpack.to_dlpack(jax_array))

# Move to TPU device
pt_tensor = pt_tensor.to(xm.xla_device())
```

## Pattern: JAX Auxiliary Loss in PT-XLA Loop

```python
import torch
import torch.nn as nn
import jax
import jax.numpy as jnp
import optax
import torch_xla.core.xla_model as xm

class ModelWithJaxAuxLoss(nn.Module):
    def __init__(self, dim, num_experts):
        super().__init__()
        self.router = nn.Linear(dim, num_experts)
        self.experts = nn.ModuleList([nn.Linear(dim, dim) for _ in range(num_experts)])

    def forward(self, x):
        # PT-XLA forward
        gates = torch.softmax(self.router(x), dim=-1)  # (b, s, e)

        # JAX: compute auxiliary load-balancing loss
        # Convert gates to JAX
        jax_gates = jax.dlpack.from_dlpack(to_dlpack(gates.detach()))

        # JAX computation: encourage uniform expert usage
        mean_gates = jnp.mean(jax_gates, axis=(0, 1))  # (e,)
        aux_loss = jnp.sum((mean_gates - 1.0 / num_experts) ** 2)

        # Back to PT
        pt_aux_loss = from_dlpack(jax.dlpack.to_dlpack(aux_loss))

        # Expert computation (PT-XLA)
        # ... dispatch and combine experts ...

        return output, pt_aux_loss
```

## When to Use JAX vs PT-XLA

| Task | Use | Why |
|------|-----|-----|
| Training loop | PT-XLA | Ecosystem (datasets, transformers, checkpointing) |
| Custom autodiff | JAX | `jax.custom_vjp`, `jax.custom_jvp` are cleaner |
| Top-k routing | JAX | `jax.lax.top_k` with custom gradient |
| Parallel scan | JAX | `jax.lax.associative_scan` for efficient recurrence |
| PMAP collectives | JAX | `jax.pmap` + `jax.lax.pmean` simpler than XLA collectives |
| Model inference | Either | JAX `pjit` has lower overhead for batched inference |

## Memory Management

DLPack interop does NOT copy data, but it pins the underlying buffer. Be careful:

```python
# BAD: interop inside tight loop without sync
for i in range(1000):
    jax_array = jax.dlpack.from_dlpack(to_dlpack(pt_tensor))  # Pin every iter
    result = jax_fn(jax_array)
    pt_result = from_dlpack(jax.dlpack.to_dlpack(result))

# GOOD: keep JAX computation minimal, sync boundaries
xm.mark_step()  # Finish all pending PT-XLA ops
jax_result = jax_fn(jax.dlpack.from_dlpack(to_dlpack(pt_tensor)))
pt_result = from_dlpack(jax.dlpack.to_dlpack(jax_result))
xm.mark_step()  # Start PT-XLA ops again
```

## Anti-Patterns

- Don't interop on every training step — batch JAX computations
- Don't modify JAX array and expect PT tensor to update (they share memory but have different views)
- Don't use JAX RNG (`jax.random`) without syncing seeds with PT-XLA
=======
# Dual-Framework Runtime — PT-XLA + JAX

## Philosophy

PT-XLA is primary for training loops because `torch.nn` ecosystem (transformers, datasets) is mature. JAX is secondary for:
- Custom differentiable operations (sorting, routing, top-k with custom grad)
- Auxiliary loss computations (contrastive losses, regularization)
- Fast prototyping of novel algorithms before porting to PT-XLA

## Zero-Copy Interop via DLPack

```python
import torch
import jax
import jax.numpy as jnp
from torch.utils.dlpack import to_dlpack, from_dlpack

# PyTorch tensor -> JAX array
pt_tensor = torch.randn(2, 4, device="xla")
jax_array = jax.dlpack.from_dlpack(to_dlpack(pt_tensor))

# JAX array -> PyTorch tensor
jax_array = jnp.ones((2, 4))
pt_tensor = from_dlpack(jax.dlpack.to_dlpack(jax_array))

# Move to TPU device
pt_tensor = pt_tensor.to('xla')
```

## Pattern: JAX Auxiliary Loss in PT-XLA Loop

```python
import torch
import torch.nn as nn
import jax
import jax.numpy as jnp
import optax
import torch_xla.core.xla_model as xm

class ModelWithJaxAuxLoss(nn.Module):
    def __init__(self, dim, num_experts):
        super().__init__()
        self.router = nn.Linear(dim, num_experts)
        self.experts = nn.ModuleList([nn.Linear(dim, dim) for _ in range(num_experts)])

    def forward(self, x):
        # PT-XLA forward
        gates = torch.softmax(self.router(x), dim=-1)  # (b, s, e)

        # JAX: compute auxiliary load-balancing loss
        # Convert gates to JAX
        jax_gates = jax.dlpack.from_dlpack(to_dlpack(gates.detach()))

        # JAX computation: encourage uniform expert usage
        mean_gates = jnp.mean(jax_gates, axis=(0, 1))  # (e,)
        aux_loss = jnp.sum((mean_gates - 1.0 / num_experts) ** 2)

        # Back to PT
        pt_aux_loss = from_dlpack(jax.dlpack.to_dlpack(aux_loss))

        # Expert computation (PT-XLA)
        # ... dispatch and combine experts ...

        return output, pt_aux_loss
```

## When to Use JAX vs PT-XLA

| Task | Use | Why |
|------|-----|-----|
| Training loop | PT-XLA | Ecosystem (datasets, transformers, checkpointing) |
| Custom autodiff | JAX | `jax.custom_vjp`, `jax.custom_jvp` are cleaner |
| Top-k routing | JAX | `jax.lax.top_k` with custom gradient |
| Parallel scan | JAX | `jax.lax.associative_scan` for efficient recurrence |
| PMAP collectives | JAX | `jax.pmap` + `jax.lax.pmean` simpler than XLA collectives |
| Model inference | Either | JAX `pjit` has lower overhead for batched inference |

## Memory Management

DLPack interop does NOT copy data, but it pins the underlying buffer. Be careful:

```python
# BAD: interop inside tight loop without sync
for i in range(1000):
    jax_array = jax.dlpack.from_dlpack(to_dlpack(pt_tensor))  # Pin every iter
    result = jax_fn(jax_array)
    pt_result = from_dlpack(jax.dlpack.to_dlpack(result))

# GOOD: keep JAX computation minimal, sync boundaries
torch_xla.sync()  # Finish all pending PT-XLA ops
jax_result = jax_fn(jax.dlpack.from_dlpack(to_dlpack(pt_tensor)))
pt_result = from_dlpack(jax.dlpack.to_dlpack(jax_result))
torch_xla.sync()  # Start PT-XLA ops again
```

## Anti-Patterns

- Don't interop on every training step — batch JAX computations
- Don't modify JAX array and expect PT tensor to update (they share memory but have different views)
- Don't use JAX RNG (`jax.random`) without syncing seeds with PT-XLA
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/dual-framework.md
