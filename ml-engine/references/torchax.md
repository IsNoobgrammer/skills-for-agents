# torchax — PyTorch Frontend for JAX

## Overview

`torchax` is a PyTorch frontend for JAX that allows writing JAX programs using PyTorch syntax. Also provides graph-level interoperability between PyTorch and JAX — reuse PyTorch models in JAX programs.

**Moved to https://github.com/google/torchax (as of 2025-10-06).**

## Installation

```bash
pip install torchax
```

## Basic Usage

```python
import torchax  # must import before torch usage
import torch    # torchax intercepts torch ops

# Standard PyTorch code now runs via JAX/XLA backend
x = torch.randn(2, 2)
y = torch.randn(2, 2)
z = x + y  # executed via JAX
```

## PyTorch Model in JAX Program

```python
import torchax
import torch
import torch.nn as nn
import jax
import jax.numpy as jnp

class MyModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear = nn.Linear(10, 10)

    def forward(self, x):
        return self.linear(x)

# Use PyTorch model within JAX program
model = MyModel()
# torchax handles the translation
```

## Interop Patterns

### torchax + JAX Arrays

```python
import torchax
import torch
import jax.numpy as jnp

# torchax-managed tensors can interop with JAX
x_torch = torch.randn(4, 4)
# Convert to JAX array for JAX-specific ops
# (torchax handles device placement automatically)
```

### When to Use torchax vs torch_xla

| Scenario | Use |
|----------|-----|
| Training on TPU with PyTorch | `torch_xla` (lazy tensor, SPMD) |
| Running PyTorch model in JAX pipeline | `torchax` |
| JAX/Flax model with PyTorch preprocessing | `torchax` |
| Need `torch.compile` on TPU | `torch_xla` with `backend='openxla'` |
| Need SPMD sharding | `torch_xla` (torchax doesn't support SPMD) |
| Need Pallas custom kernels | `torch_xla` |

## Key Differences from torch_xla

- `torchax` translates PyTorch ops to JAX ops at the graph level
- `torch_xla` uses lazy tensor tracing to build XLA graphs
- `torchax` is for JAX ecosystem integration; `torch_xla` is for TPU training
- `torchax` doesn't support SPMD sharding or Pallas kernels
- `torchax` doesn't need `xm.mark_step()` or `torch_xla.sync()`

## Citation

```bibtex
@software{torchax,
  author = {Han Qi, Chun-nien Chan, Will Cromar, Manfei Bai, Kevin Gleanson},
  title = {torchax: PyTorch on TPU and JAX interoperability},
  url = {https://github.com/google/torchax}
  version = {0.0.4},
  date = {2025-02-24},
}
```

## Anti-Patterns

- Don't use `torchax` for training loops that need SPMD — use `torch_xla`
- Don't mix `torchax` and `torch_xla` device management in same process
- Don't import `torchax` after `torch` — must import first
