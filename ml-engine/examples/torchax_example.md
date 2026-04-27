# torchax Example — PyTorch on JAX

## Overview

`torchax` provides a PyTorch frontend for JAX. Write PyTorch syntax that runs on JAX/XLA. Useful for reusing PyTorch models in JAX programs.

## Installation

```bash
pip install torchax
```

## Example 1: Basic torchax Usage

```python
import torchax  # must import before torch
import torch

# Standard PyTorch code — now runs via JAX backend
x = torch.randn(2, 3)
y = torch.randn(3, 4)
z = x @ y  # executed via JAX

print(f"Result shape: {z.shape}")  # torch.Size([2, 4])
print(f"Result: {z}")
```

## Example 2: PyTorch Model with torchax

```python
import torchax
import torch
import torch.nn as nn

class SimpleModel(nn.Module):
    def __init__(self, dim=512):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim, 4 * dim),
            nn.GELU(),
            nn.Linear(4 * dim, dim),
        )

    def forward(self, x):
        return self.net(x)

model = SimpleModel(dim=512)
x = torch.randn(32, 512)
output = model(x)
print(f"Output shape: {output.shape}")
```

## Example 3: torchax + JAX Interop

```python
import torchax
import torch
import jax
import jax.numpy as jnp

# Define computation in PyTorch
x_torch = torch.randn(4, 4)

# Convert to JAX array for JAX-specific operations
# torchax handles the interop automatically

# Use JAX JIT on torchax-managed computation
@jax.jit
def jax_fn(x_jax):
    return jnp.dot(x_jax, x_jax.T)

# torchax tensors can be passed to JAX functions
```

## When to Use torchax vs torch_xla

| Scenario | Use This |
|----------|----------|
| Training on TPU with PyTorch | `torch_xla` |
| Running PyTorch model in JAX pipeline | `torchax` |
| JAX/Flax model with PyTorch preprocessing | `torchax` |
| Need SPMD sharding | `torch_xla` |
| Need Pallas custom kernels | `torch_xla` |
| Need `torch.compile` on TPU | `torch_xla` with `backend='openxla'` |
| Reusing existing PyTorch code in JAX ecosystem | `torchax` |

## Key Differences

- `torchax` translates PyTorch ops → JAX ops at graph level
- `torch_xla` uses lazy tensor tracing → XLA graphs
- `torchax` doesn't need `torch_xla.sync()` or `torch_xla.step()`
- `torchax` doesn't support SPMD sharding or Pallas kernels
- `torchax` must be imported before `torch`

## Anti-Patterns

- Don't import `torch` before `torchax` — order matters
- Don't use `torchax` for training loops needing SPMD — use `torch_xla`
- Don't mix `torchax` and `torch_xla` device management in same process
