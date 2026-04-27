# FSDPv2 — GSPMD-based Fully Sharded Data Parallelism

## Overview

`SpmdFullyShardedDataParallel` (FSDPv2) uses PyTorch/XLA's GSPMD to shard model parameters across data-parallel workers. Requires SPMD mode. Different from PyTorch native FSDP — uses XLA compiler for sharding.

## Setup

```python
import torch_xla.distributed.spmd as xs
from torch_xla.experimental.spmd_fully_sharded_data_parallel import SpmdFullyShardedDataParallel as FSDPv2
from torch_xla import runtime as xr
import numpy as np

# Enable SPMD first
xr.use_spmd()

# Mesh MUST have 'fsdp' axis
num_devices = xr.global_runtime_device_count()
mesh_shape = (num_devices, 1)
device_ids = np.arange(num_devices)
mesh = xs.Mesh(device_ids, mesh_shape, ('fsdp', 'model'))
xs.set_global_mesh(mesh)
```

## Basic Usage

```python
# Shard input (data parallel)
x = xs.mark_sharding(x, mesh, ('fsdp', None))

# Wrap model
model = FSDPv2(my_module, mesh=mesh)
optimizer = torch.optim.Adam(model.parameters(), lr=0.0001)

# Standard training loop
output = model(x)
loss = output.sum()
loss.backward()
optimizer.step()
```

## Auto-Wrap Policy

Shard individual layers separately, outer wrapper handles leftover parameters.

```python
from torch_xla.distributed.fsdp.wrap import transformer_auto_wrap_policy
import functools

auto_wrap_policy = functools.partial(
    transformer_auto_wrap_policy,
    transformer_layer_cls={DecoderLayer},
)
model = FSDPv2(model, auto_wrap_policy=auto_wrap_policy)
```

## Sharding Output

FSDPv2 shards both weights and activations. For non-standard forward outputs, provide `shard_output`:

```python
def shard_output(output, mesh):
    xs.mark_sharding(output.logits, mesh, ('fsdp', None, None))

model = FSDPv2(my_module, mesh, shard_output)
```

Standard cases (single tensor output, or tuple where 0th element is activation) are handled automatically.

## Gradient Checkpointing

Apply `checkpoint_module` BEFORE FSDPv2 wrapper:

```python
from torch_xla.distributed.fsdp import checkpoint_module

model = FSDPv2(checkpoint_module(my_module), mesh)
```

Applying in reverse order causes infinite loop in recursive module traversal.

## Full Example

```python
import torch
import numpy as np
import torch_xla
import torch_xla.distributed.spmd as xs
from torch_xla.experimental.spmd_fully_sharded_data_parallel import SpmdFullyShardedDataParallel as FSDPv2
from torch_xla import runtime as xr
from torch_xla.distributed.fsdp.wrap import transformer_auto_wrap_policy
import functools

# Enable SPMD
xr.use_spmd()

# Mesh with 'fsdp' axis
num_devices = xr.global_runtime_device_count()
mesh = xs.Mesh(np.arange(num_devices), (num_devices, 1), ('fsdp', 'model'))
xs.set_global_mesh(mesh)

# Model
model = DecoderOnlyModel(config)

# Auto-wrap
auto_wrap_policy = functools.partial(
    transformer_auto_wrap_policy,
    transformer_layer_cls={DecoderLayer},
)
model = FSDPv2(model, auto_wrap_policy=auto_wrap_policy)
optimizer = torch.optim.Adam(model.parameters(), lr=0.0001)

# Training
for data, target in train_loader:
    with torch_xla.step():
        output = model(data)
        loss = loss_fn(output, target)
        loss.backward()
        optimizer.step()
```

## FSDPv2 vs Native FSDP

| Feature | FSDPv2 (XLA) | Native FSDP (PyTorch) |
|---------|-------------|----------------------|
| Sharding | GSPMD compiler-driven | Manual parameter sharding |
| SPMD required | Yes | No |
| Mesh | XLA Mesh with `fsdp` axis | Process groups |
| Performance | Better for TPU (compiler optimizes collectives) | General purpose |
| Gradient checkpointing | `checkpoint_module` before wrapper | `apply_activation_checkpoint` |

## Anti-Patterns

- Don't apply FSDPv2 before enabling SPMD — `xr.use_spmd()` must come first
- Don't forget `fsdp` axis name in mesh — FSDPv2 requires it
- Don't apply `checkpoint_module` after FSDPv2 — causes infinite loop
- Don't use `torch.save()` on FSDPv2-wrapped models — use distributed checkpointing
