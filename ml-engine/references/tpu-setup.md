<<<<<<< S:/AntiGravity_Skills/ml-engine/references/tpu-setup.md
# TPU Setup — v2-8 / v3-8 Detection and Mesh Initialization

## Device Detection

```python
import torch_xla.core.xla_model as xm
import os

def detect_tpu():
    """Returns TPU version string and device count."""
    try:
        dev = xm.xla_device()
        # TPU metadata from env
        tpu_type = os.environ.get("TPU_TYPE", "unknown")
        tpu_zone = os.environ.get("TPU_ZONE", "unknown")
        chip_type = os.environ.get("TPU_CHIP_TYPE", "unknown")  # v2, v3, v4, etc.
        num_devices = xm.xrt_world_size()
        return {
            "type": tpu_type,       # e.g. "v2-8", "v3-8"
            "chip": chip_type,      # e.g. "v2", "v3"
            "zone": tpu_zone,
            "num_devices": num_devices,
            "cores_per_chip": 2,    # v2/v3: 2 cores per chip
        }
    except Exception as e:
        return {"type": "none", "error": str(e)}
```

## Mesh Initialization

### 1D Mesh (Data Parallelism)

Default for v2-8 / v3-8 single-host training.

```python
from torch_xla.distributed.spmd import Mesh
import torch_xla.core.xla_model as xm

devices = xm.xla_devices()
mesh = Mesh(devices, (len(devices),), axis_names=("data",))

# Use for: batch dimension sharding, FSDP
```

### 2D Mesh (Data + Model Parallelism)

For larger models where single-core HBM is insufficient.

```python
import math

num_devices = len(xm.xla_devices())
data_parallel = 4      # 4-way data parallel
model_parallel = 2     # 2-way tensor parallel

assert data_parallel * model_parallel == num_devices

mesh = Mesh(
    xm.xla_devices(),
    (data_parallel, model_parallel),
    axis_names=("data", "model"),
)
```

### Single-Host (v2-8 / v3-8)

Single pod has 8 TPU cores visible to ONE process. No `spawn` needed.

```python
import torch_xla.core.xla_model as xm

devices = xm.xla_devices()  # All 8 cores visible
print(f"Visible TPU devices: {len(devices)}")  # 8

# Model and data automatically use all devices via SPMD
# Just run: python train.py
```

### Multi-Host SPMD (Multi-Pod)

For TPU pod slices (v2-32, v3-32, v4-128, etc.) with MULTIPLE hosts.
`xmp.spawn()` launches one process PER core across ALL hosts.

```python
import torch_xla.distributed.xla_multiprocessing as xmp

def _mp_fn(index):
    device = xm.xla_device()
    # index: local process rank (0..7 per host)
    # Each host runs its own 8 processes
    # All processes coordinate via XLA collective ops
    # Training loop here

# Spawn across ALL hosts and ALL cores
# ONLY for multi-pod training
xmp.spawn(_mp_fn, args=(), nprocs=8, start_method="fork")
```

**Key distinction:**
- **v2-8 / v3-8**: Single host, 8 cores, 1 process. No `spawn`.
- **v2-32 / v3-32+**: Multiple hosts, `spawn` per host. Each host launches 8 processes.

## v2-8 vs v3-8 Differences

| Feature | v2-8 | v3-8 |
|--------|------|------|
| Cores | 8 | 8 |
| HBM per core | 8 GB | 16 GB |
| bfloat16 | Yes | Yes |
| Splash Attention | No | Limited |
| Flash Attention | Custom kernel | Custom kernel |
| SDPA | Always available | Always available |

## Device Placement Patterns

```python
# Explicit device placement (usually automatic, but useful for debugging)
x = torch.randn(2, 16).to(xm.xla_device())

# Check if tensor is on TPU
assert x.device.type == "xla"

# Synchronize (rarely needed — XLA is lazy)
xm.mark_step()
```

## Anti-Patterns

- Don't create mesh before confirming TPU is available — check `xm.xla_device()` first
- Don't assume 8 devices; check dynamically for pod slices
- Don't mix `torch.cuda` calls with `torch_xla` — they are mutually exclusive backends
=======
# TPU Setup — v2-8 / v3-8 Detection and Mesh Initialization

## Device Detection

```python
import torch_xla
import torch_xla.core.xla_model as xm
from torch_xla import runtime as xr
import os

def detect_tpu():
    """Returns TPU version string and device count."""
    try:
        dev = torch_xla.device()  # Modern API
        tpu_type = xm.get_tpu_env("TYPE", os.environ.get("TPU_TYPE", "unknown"))
        num_devices = xr.global_runtime_device_count()  # SPMD-aware
        return {
            "type": tpu_type,       # e.g. "v2-8", "v3-8"
            "num_devices": num_devices,
            "cores_per_chip": 2,    # v2/v3: 2 cores per chip
        }
    except Exception as e:
        return {"type": "none", "error": str(e)}
```

## Mesh Initialization

### 1D Mesh (Data Parallelism)

Default for v2-8 / v3-8 single-host training.

```python
import numpy as np
from torch_xla.distributed.spmd import Mesh
from torch_xla import runtime as xr

num_devices = xr.global_runtime_device_count()
mesh = Mesh(np.arange(num_devices), (num_devices,), axis_names=("data",))

# Use for: batch dimension sharding, FSDP
```

### 2D Mesh (Data + Model Parallelism)

For larger models where single-core HBM is insufficient.

```python
import math
import numpy as np
from torch_xla.distributed.spmd import Mesh
from torch_xla import runtime as xr

num_devices = xr.global_runtime_device_count()
data_parallel = 4      # 4-way data parallel
model_parallel = 2     # 2-way tensor parallel

assert data_parallel * model_parallel == num_devices

mesh = Mesh(
    np.arange(num_devices),
    (data_parallel, model_parallel),
    axis_names=("data", "model"),
)
```

### Single-Host (v2-8 / v3-8)

Single pod has 8 TPU cores visible to ONE process. No `spawn` needed.

```python
import torch_xla
from torch_xla import runtime as xr

num_devices = xr.global_runtime_device_count()
print(f"Visible TPU devices: {num_devices}")  # 8

# Model and data automatically use all devices via SPMD
# Just run: python train.py
```

### Multi-Host SPMD (Multi-Pod)

For TPU pod slices (v2-32, v3-32, v4-128, etc.) with MULTIPLE hosts.
Use `torch_xla.launch()` (modern) or `xmp.spawn()` (legacy).

```python
import torch_xla

def _mp_fn(index):
    device = torch_xla.device()
    # index: local process rank (0..7 per host)
    # Each host runs its own 8 processes
    # All processes coordinate via XLA collective ops
    # Training loop here

# Modern: torch_xla.launch (auto world_size)
if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())

# Legacy: xmp.spawn (manual nprocs)
# xmp.spawn(_mp_fn, args=(), nprocs=8, start_method="fork")
```

**Key distinction:**
- **v2-8 / v3-8**: Single host, 8 cores, 1 process. No `spawn`.
- **v2-32 / v3-32+**: Multiple hosts, `torch_xla.launch()` per host. Each host launches 8 processes.

## v2-8 vs v3-8 Differences

| Feature | v2-8 | v3-8 |
|--------|------|------|
| Cores | 8 | 8 |
| HBM per core | 8 GB | 16 GB |
| bfloat16 | Yes | Yes |
| Splash Attention | No | Limited |
| Flash Attention | Custom kernel | Custom kernel |
| SDPA | Always available | Always available |

## Device Placement Patterns

```python
import torch_xla

# Explicit device placement
x = torch.randn(2, 16).to('xla')

# Check if tensor is on TPU
assert x.device.type == "xla"

# Synchronize (modern API)
torch_xla.sync()

# Or use context manager
with torch_xla.step():
    # ... operations ...
    pass
```

## Anti-Patterns

- Don't create mesh before confirming TPU is available — check `torch_xla.device()` first
- Don't assume 8 devices; check dynamically with `xr.global_runtime_device_count()`
- Don't mix `torch.cuda` calls with `torch_xla` — they are mutually exclusive backends
- Don't use `xm.xla_device()` — prefer `torch_xla.device()` (modern top-level API)
- Don't use `xm.mark_step()` — prefer `torch_xla.sync()` or `torch_xla.step()` context manager
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/tpu-setup.md
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/tpu-setup.md
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/tpu-setup.md
=======
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/tpu-setup.md
=======
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/tpu-setup.md
