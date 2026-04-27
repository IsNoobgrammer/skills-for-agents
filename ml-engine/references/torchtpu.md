<<<<<<< S:/AntiGravity_Skills/ml-engine/references/torchtpu.md
# torchtpu (PyTorch XLA TPU Framework)

## Overview

`torchtpu` is the modern PyTorch XLA integration for TPU. Replaces older XRT runtime with PJRT. Simpler API, better performance, direct `torch.compile` support.

## Key Differences (Old vs New)

| Old (XRT) | New (PJRT / torchtpu) |
|-----------|----------------------|
| `xm.xla_device()` returns `xla:0` | `xm.xla_device()` returns `xla:0` (per process) |
| `xmp.spawn` for multi-core | `torchrun` + `dist.init_process_group("xla")` |
| `ParallelLoader` required | Standard `DataLoader` works, or `torch.compile` handles it |
| Manual `xm.mark_step()` | Still needed for lazy execution |
| XRT env vars | PJRT env vars (simpler) |

## Setup

```bash
# Install torch_xla with TPU support
pip install torch_xla[tpu] -f https://storage.googleapis.com/libtpu-releases/index.html

# For Pallas custom kernels
pip install torch_xla[pallas] -f https://storage.googleapis.com/jax-releases/jax_nightly_releases.html
```

## Single-Host Usage

```python
import torch
import torch_xla
import torch_xla.core.xla_model as xm
from torch_xla.distributed.spmd import Mesh, mark_sharding

# Single host: 8 TPU cores visible
device = xm.xla_device()
print(torch_xla.devices())  # 8 devices

# Model goes to TPU automatically
model = MyModel().to(device)

# SPMD sharding across all 8 cores
mesh = Mesh(xm.xla_devices(), (8,), axis_names=("data",))
mark_sharding(model, mesh, PartitionSpec("data", None))

# Standard PyTorch training loop
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
for batch in loader:
    loss = model(batch)
    loss.backward()
    xm.optimizer_step(optimizer, barrier=False)  # no barrier for single host
    xm.mark_step()
```

## torch.compile + XLA

```python
import torch

model = MyModel()
# torch.compile with XLA backend fuses ops into TPU-efficient graphs
compiled_model = torch.compile(model, backend="openxla")

# Now standard PyTorch code runs on TPU via XLA
output = compiled_model(input)
```

## torchtpu Key APIs

```python
import torch_xla

# Device list
devices = torch_xla.devices()  # All TPU devices

# Sync (mark step)
torch_xla.sync()  # Equivalent to xm.mark_step()

# Save
import torch_xla.runtime as xr
xr.save(model.state_dict(), "ckpt.pt")  # XLA-aware save

# Metrics (debug)
import torch_xla.debug.metrics as met
print(met.metrics_report())  # Compilation, execution metrics
```

## Anti-Patterns

- Don't mix XRT and PJRT env vars — pick one runtime
- Don't call `torch.save()` on sharded models — use distributed checkpointing
- For single-host: `barrier=False` in `xm.optimizer_step()` is faster
- For multi-host: `barrier=True` is required for gradient sync
=======
# torchtpu (PyTorch XLA TPU Framework)

## Overview

`torchtpu` is the modern PyTorch XLA integration for TPU. Replaces older XRT runtime with PJRT. Simpler API, better performance, direct `torch.compile` support.

## Key Differences (Old vs New)

| Old (XRT) | New (PJRT / torchtpu) |
|-----------|----------------------|
| `xm.xla_device()` returns `xla:0` | `torch_xla.device()` returns `xla:0` (per process) |
| `xmp.spawn` for multi-core | `torch_xla.launch()` or `torchrun` + `dist.init_process_group("xla")` |
| `ParallelLoader` required | `MpDeviceLoader` or standard `DataLoader` |
| Manual `xm.mark_step()` | `torch_xla.step()` context manager or `torch_xla.sync()` |
| XRT env vars | PJRT env vars (simpler) |
| No compilation caching | `xr.initialize_cache()` for persistent cache |
| Always lazy execution | `torch_xla.experimental.eager_mode()` for debugging |

## Setup

```bash
# Install torch_xla with TPU support (v2.8+)
pip install torch==2.8.0 'torch_xla[tpu]==2.8.0'

# For Pallas custom kernels
pip install --pre torch_xla[pallas] --index-url https://us-python.pkg.dev/ml-oss-artifacts-published/jax/simple/

# Nightly (Python 3.12)
pip install --pre torch torchvision --index-url https://download.pytorch.org/whl/nightly/cpu
pip install 'torch_xla[tpu] @ https://storage.googleapis.com/pytorch-xla-releases/wheels/tpuvm/torch_xla-2.9.0.dev-cp312-cp312-linux_x86_64.whl'
```

## Single-Host Usage

```python
import torch
import torch_xla
import torch_xla.core.xla_model as xm
from torch_xla.distributed.spmd import Mesh, mark_sharding, PartitionSpec

# Single host: 8 TPU cores visible
device = torch_xla.device()
print(torch_xla.devices())  # 8 devices

# Model goes to TPU
model = MyModel().to('xla')

# SPMD sharding across all 8 cores
mesh = Mesh(np.arange(8), (8,), axis_names=("data",))
mark_sharding(model, mesh, PartitionSpec("data", None))

# Modern training loop with torch_xla.step()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
for batch in loader:
    with torch_xla.step():
        inputs, labels = batch['input_ids'].to('xla'), batch['labels'].to('xla')
        optimizer.zero_grad()
        loss = model(inputs)
        loss.backward()
        optimizer.step()
torch_xla.sync()
```

## torch.compile + XLA

```python
import torch

# Inference: significant speedup (2-18x on TPU)
model = MyModel().to('xla')
model.eval()
compiled_model = torch.compile(model, backend="openxla")
output = compiled_model(input)

# Training: experimental, traces fwd/bwd separately
compiled_step = torch.compile(train_step, backend='openxla')
```

### Dynamo Performance (Inference on TPU v4-8)

| Model | Speedup |
|-------|---------|
| resnet18 | 2.59x |
| resnet50 | 2.64x |
| mobilenet_v2 | 18.62x |
| BERT_pytorch | 7.49x |
| timm_vision_transformer | 3.52x |
| **geomean** | **3.04x** |

## torchtpu Key APIs

```python
import torch_xla

# Device
device = torch_xla.device()    # Get XLA device
devices = torch_xla.devices()  # All TPU devices

# Step boundary
with torch_xla.step():          # Context manager — preferred
    ...
torch_xla.sync()                # Standalone sync — replaces xm.mark_step()

# Multi-process launch
torch_xla.launch(_mp_fn, args=())  # Replaces xmp.spawn/mp.spawn

# Compilation
compiled = torch_xla.compile(step_fn, full_graph=True, name="step")

# Save
import torch_xla.runtime as xr
xr.save(model.state_dict(), "ckpt.pt")  # XLA-aware save

# Serialization (memory-efficient for large models)
import torch_xla.utils.serialization as xser
xser.save(model.state_dict(), path)   # Streams tensors to CPU one at a time
state_dict = xser.load(path)          # Matching load API

# Metrics (debug)
import torch_xla.debug.metrics as met
print(met.metrics_report())  # Compilation, execution metrics

# Compilation cache
xr.initialize_cache('/tmp/xla_cache', readonly=False)

# Eager mode (debugging)
torch_xla.experimental.eager_mode(True)
```

## C++11 ABI Builds

Since PyTorch/XLA 2.7, C++11 ABI builds are default. For 2.6, C++11 ABI wheels have better lazy tensor tracing performance (39% MFU vs 33% for Mixtral 8x7B on v5p-256).

## Docker

```bash
# Latest stable
docker run --privileged --net host --shm-size=16G -it \
  us-central1-docker.pkg.dev/tpu-pytorch-releases/docker/xla:r2.7.0_3.10_tpuvm

# Nightly
docker run --privileged --net host --shm-size=16G -it \
  us-central1-docker.pkg.dev/tpu-pytorch-releases/docker/xla:nightly_3.10_tpuvm
```

## Anti-Patterns

- Don't mix XRT and PJRT env vars — pick one runtime
- Don't call `torch.save()` on sharded models — use distributed checkpointing or `xser`
- Don't call `torch.save()` directly on XLA tensors — move to CPU first with `.cpu()`
- For single-host: `barrier=False` in `xm.optimizer_step()` is faster
- For multi-host: `barrier=True` is required for gradient sync
- Don't access XLA devices before `torch_xla.launch()` in multi-process mode
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/torchtpu.md
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/torchtpu.md
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/torchtpu.md
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/torchtpu.md
=======
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/torchtpu.md
=======
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/torchtpu.md
=======
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/torchtpu.md
