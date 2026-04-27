# SPMD — Single Program Multiple Data

## Overview

SPMD is an automatic parallelization system for ML workloads. The XLA compiler transforms a single-device program into a partitioned one with proper collectives, based on user-provided sharding hints. Write PyTorch programs as if on a single large device — no custom sharded ops or collectives needed.

## Enabling SPMD

```python
from torch_xla import runtime as xr

xr.use_spmd()
```

Must be called before any XLA computation. Cannot mix SPMD with other distributed libraries.

## Mesh

Device mesh is an N-dimensional arrangement of compute devices.

```python
import torch_xla.distributed.spmd as xs
import numpy as np
from torch_xla import runtime as xr

num_devices = xr.global_runtime_device_count()
mesh_shape = (num_devices, 1)
device_ids = np.arange(num_devices)
mesh = xs.Mesh(device_ids, mesh_shape, ('data', 'model'))
```

- `mesh_shape`: tuple whose product equals total physical devices
- `device_ids`: flat numpy array `0..num_devices-1` in row-major order
- Axis names: name each mesh axis for partition spec references

### Mesh Info

```python
mesh.shape()           # OrderedDict([('data', 4), ('model', 1)])
mesh.get_logical_mesh()  # 2D array of device IDs
xr.global_runtime_device_attributes()  # TPU core details
```

## Partition Spec

`partition_spec` has same rank as input tensor. Each dimension describes how the corresponding tensor dimension is sharded.

```python
import torch_xla.distributed.spmd as xs

t = torch.randn(8, 4).to('xla')

# Shard dim 0 over 'data', dim 1 over 'model'
xs.mark_sharding(t, mesh, ('data', 'model'))

# Replicate dim 0, shard dim 1 over 'data'
xs.mark_sharding(t, mesh, (None, 'data'))

# Shard dim 0 over both axes
xs.mark_sharding(t, mesh, (('data', 'model'),))
```

### Rules

- `None` = replicate that dimension
- Omitted mesh axes = replicate over those axes
- Tensor rank can differ from mesh rank
- Each device holds `t[a*M/X:(a+1)*M/X, b*N/Y:(b+1)*N/Y]` for mesh shape `[X, Y]`

## SPMD Data Parallelism

```python
import torch_xla.distributed.spmd as xs
from torch_xla import runtime as xr
import torch_xla.distributed.parallel_loader as pl

xr.use_spmd()

num_devices = xr.global_runtime_device_count()
mesh = xs.Mesh(np.arange(num_devices), (num_devices,), ('data',))

# Scale batch — one process handles all devices
batch_size *= num_devices

train_loader = pl.MpDeviceLoader(
    train_loader,
    device,
    input_sharding=xs.ShardingSpec(mesh, ('data', None, None, None))
)
```

## SPMD with FSDPv2

```python
xr.use_spmd()

num_devices = xr.global_runtime_device_count()
mesh = xs.Mesh(np.arange(num_devices), (num_devices, 1), ('fsdp', 'model'))
xs.set_global_mesh(mesh)

# FSDPv2 uses the global mesh
model = FSDPv2(model, auto_wrap_policy=auto_wrap_policy)
```

## Multi-Slice (Multi-Host) SPMD

Device attributes include `slice_index` for multi-slice setups:

```python
xr.global_runtime_device_attributes()
# Each device dict includes 'slice_index' field
```

## Which Device Holds Which Shard

Given `[M, N]` tensor, mesh `[X, Y]`, partition `('X', 'Y')`:
- Device `device_ids[i]` holds `t[a*M/X:(a+1)*M/X, b*N/Y:(b+1)*N/Y]`
- Where `a = i // Y`, `b = i % Y`
- Last device may hold padding if dimensions not evenly divisible

## SPMD vs Multi-Process

| Feature | SPMD | Multi-Process |
|---------|------|---------------|
| Processes | 1 | N (one per device) |
| Device visibility | All devices | One per process |
| Sharding | `mark_sharding` | `xm.optimizer_step` |
| Best for | Large models, FSDP | Simple data parallelism |
| Performance | Better (compiler-optimized collectives) | Simpler setup |

## Anti-Patterns

- Don't mix SPMD with DDP or other distributed libraries
- Don't create mesh before `xr.use_spmd()` — SPMD must be enabled first
- Don't assume even division — check divisibility or handle padding
- Don't use `xmp.spawn` with SPMD — SPMD uses single process
