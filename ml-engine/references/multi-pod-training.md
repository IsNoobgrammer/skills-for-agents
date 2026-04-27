<<<<<<< S:/AntiGravity_Skills/ml-engine/references/multi-pod-training.md
# Multi-Pod TPU Training (v3-32, v3-64, v4-128+)

## Single-Host vs Multi-Pod

| Setup | Cores | Hosts | Process Model | Entry Point |
|-------|-------|-------|---------------|-------------|
| v2-8 / v3-8 | 8 | 1 | Single process, 8 devices visible | `python train.py` |
| v3-32 | 32 | 4 | 4 hosts, 8 processes each | `torchrun` or `xmp.spawn` |
| v3-64 | 64 | 8 | 8 hosts, 8 processes each | `torchrun` or `xmp.spawn` |
| v4-128 | 128 | 16 | 16 hosts, 8 processes each | `torchrun` or `xmp.spawn` |

## Single-Host (v2-8 / v3-8)

No spawn. All 8 cores visible to one Python process.

```python
import torch_xla.core.xla_model as xm

devices = xm.xla_devices()  # 8 devices
print(f"Devices: {len(devices)}")  # 8

mesh = Mesh(devices, (8,), axis_names=("data",))
```

## Multi-Pod: `torchrun` (Recommended)

Use `torchrun` with XLA backend. Each host runs 8 processes. Coordinator resolves all hosts.

```bash
# On each host (or via gcloud compute tpus tpu-vm ssh)
export PJRT_DEVICE=TPU
export TPU_MESH_CONTROLLER_ADDRESS=10.128.0.2:8476  # coordinator IP
export TPU_MESH_CONTROLLER_PORT=8476
export TPU_NUM_DEVICES=8

torchrun \
    --nnodes=8 \                          # 8 hosts for v3-64
    --nproc_per_node=8 \                   # 8 TPU cores per host
    --node_rank=$HOST_ID \                 # 0..7
    --master_addr=$COORDINATOR_IP \
    --master_port=8476 \
    train.py
```

```python
# train.py
import torch
import torch.distributed as dist
import torch_xla.distributed.xla_backend
import torch_xla.core.xla_model as xm
from torch_xla.distributed.spmd import Mesh

# torchrun initializes process group automatically
dist.init_process_group("xla")

rank = dist.get_rank()        # 0..63 for v3-64
local_rank = xm.get_ordinal() # 0..7 per host
world_size = dist.get_world_size()  # 64

# 1D mesh across all 64 cores
mesh = Mesh(xm.xla_devices(), (world_size,), axis_names=("data",))
```

## Multi-Pod: `xmp.spawn` (Alternative)

Use `xmp.spawn` when you control the launch (not via torchrun).

```python
import torch_xla.distributed.xla_multiprocessing as xmp

def _mp_fn(index):
    """
    index: local process rank on THIS host (0..7)
    """
    import torch_xla.core.xla_model as xm
    device = xm.xla_device()

    # Get global rank via environment
    local_world_size = xm.xrt_world_size()
    # For multi-host, xrt_world_size() returns TOTAL across all hosts

    # Mesh spans ALL hosts
    mesh = Mesh(xm.xla_devices(), (local_world_size,), axis_names=("data",))

    # Training loop
    model = MyModel().to(device)
    mark_sharding(model, mesh, PartitionSpec("data", None))

    for batch in loader:
        loss = ...
        loss.backward()
        xm.optimizer_step(optimizer, barrier=True)  # barrier for multi-host sync
        xm.mark_step()

# Spawn 8 processes PER host
# This is called on EVERY host in the pod
xmp.spawn(_mp_fn, nprocs=8, start_method="fork")
```

**Important:** `xmp.spawn` is called on EACH host. Each host spawns 8 processes. The processes coordinate via XLA collectives.

## 2D Mesh for Multi-Pod (v3-64)

For large models, use 2D mesh: data + model parallelism across 64 cores.

```python
# v3-64 = 8 hosts x 8 cores = 64 cores
# 2D mesh: (data=8, model=8) or (data=16, model=4)
import math

world_size = 64  # v3-64
# Pick factors based on model size and batch size
data_parallel = 8   # 8-way data parallel
model_parallel = 8  # 8-way model parallel (FSDP or tensor parallel)

mesh = Mesh(
    xm.xla_devices(),
    (data_parallel, model_parallel),
    axis_names=("data", "model"),
)

# Shard parameters: model parallelism
mark_sharding(model.embed.weight, mesh, PartitionSpec("data", "model"))
mark_sharding(model.lm_head.weight, mesh, PartitionSpec("model", "data"))
```

## Checkpointing for Multi-Pod

Use `torch.distributed.checkpoint` with CPU process group (gloo) for SPMD.

```python
from torch.distributed.checkpoint import FileSystemWriter, save_state_dict
import torch.distributed as dist

# Save: only rank 0 writes metadata, all ranks write shards
if step % 1000 == 0:
    state_dict = model.state_dict()
    # FSDP sharding preserves shard info
    save_state_dict(
        state_dict=state_dict,
        storage_writer=FileSystemWriter(f"ckpt/step_{step}"),
        planner=...,
    )

# Load: all ranks read their shard
from torch.distributed.checkpoint import FileSystemReader, load_state_dict
load_state_dict(
    state_dict=state_dict,
    storage_reader=FileSystemReader(checkpoint_dir),
)
```

See: `docs.pytorch.org/xla/master/perf/spmd_distributed_checkpoint.html`

## Environment Variables

```bash
# Required for multi-host TPU
export PJRT_DEVICE=TPU

# Coordinator (one host acts as coordinator)
export TPU_MESH_CONTROLLER_ADDRESS=10.128.0.2
export TPU_MESH_CONTROLLER_PORT=8476

# Process-local device count
export TPU_NUM_DEVICES=8

# For torchrun
export LOCAL_WORLD_SIZE=8
export WORLD_SIZE=64
```

## Anti-Patterns

- Don't use `xmp.spawn` on single-host v2-8 / v3-8 — just run `python train.py`
- Don't forget `barrier=True` in `xm.optimizer_step()` for multi-host — gradients must sync
- Don't save full unsharded checkpoints on every rank — use distributed checkpointing
- Don't use `torch.save()` directly with SPMD sharded models — loses sharding info
- Don't set `TPU_MESH_CONTROLLER_ADDRESS` on single-host — only for multi-pod
=======
# Multi-Pod TPU Training (v3-32, v3-64, v4-128+)

## Single-Host vs Multi-Pod

| Setup | Cores | Hosts | Process Model | Entry Point |
|-------|-------|-------|---------------|-------------|
| v2-8 / v3-8 | 8 | 1 | Single process, 8 devices visible | `python train.py` |
| v3-32 | 32 | 4 | 4 hosts, 8 processes each | `torch_xla.launch` or `torchrun` |
| v3-64 | 64 | 8 | 8 hosts, 8 processes each | `torch_xla.launch` or `torchrun` |
| v4-128 | 128 | 16 | 16 hosts, 8 processes each | `torch_xla.launch` or `torchrun` |

## Single-Host (v2-8 / v3-8)

No spawn. All 8 cores visible to one Python process.

```python
import torch_xla
from torch_xla import runtime as xr
import numpy as np

num_devices = xr.global_runtime_device_count()  # 8
print(f"Devices: {num_devices}")  # 8

mesh = Mesh(np.arange(num_devices), (num_devices,), axis_names=("data",))
```

## Multi-Pod: `torch_xla.launch()` (Recommended)

Use `torch_xla.launch()` for multi-process training. Replaces `xmp.spawn()`. Auto-selects world size.

```bash
# On each host (or via gcloud compute tpus tpu-vm ssh)
export PJRT_DEVICE=TPU
python train.py  # torch_xla.launch handles process spawning
```

```python
# train.py
import torch
import torch_xla
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/multi-pod-training.md
import torch_xla.core.xla_model as xm
import torch_xla.distributed.xla_backend
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/multi-pod-training.md

def _mp_fn(index):
    device = torch_xla.device()
    model = MyModel().to('xla')

    for batch in loader:
        with torch_xla.step():
            inputs, labels = batch['input_ids'].to('xla'), batch['labels'].to('xla')
            optimizer.zero_grad()
            loss = model(inputs)
            loss.backward()
            xm.optimizer_step(optimizer, barrier=True)  # barrier for multi-host

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```

**DDP variant:**

```python
import torch.distributed as dist
import torch_xla
import torch_xla.distributed.xla_backend
from torch.nn.parallel import DistributedDataParallel as DDP

def _mp_fn(rank):
    dist.init_process_group("xla", init_method='xla://')
    model = MyModel().to('xla')
    ddp_model = DDP(model, gradient_as_bucket_view=True)

    for batch in loader:
        with torch_xla.step():
            inputs, labels = inputs.to('xla'), labels.to('xla')
            optimizer.zero_grad()
            outputs = ddp_model(inputs)
            loss = loss_fn(outputs, labels)
            loss.backward()
            optimizer.step()

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```

<<<<<<< S:/AntiGravity_Skills/ml-engine/references/multi-pod-training.md
## Multi-Pod: `torch_xla.launch()` (Recommended)

Use `torch_xla.launch()` for multi-process training. Replaces `xmp.spawn()`. Auto-selects world size.

```bash
# On each host (or via gcloud compute tpus tpu-vm ssh)
export PJRT_DEVICE=TPU
python train.py  # torch_xla.launch handles process spawning
```

```python
# train.py
import torch
import torch_xla
=======
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/multi-pod-training.md
import torch_xla.core.xla_model as xm
import torch_xla.distributed.xla_backend

def _mp_fn(index):
    device = torch_xla.device()
    model = MyModel().to('xla')

    for batch in loader:
        with torch_xla.step():
            inputs, labels = batch['input_ids'].to('xla'), batch['labels'].to('xla')
            optimizer.zero_grad()
            loss = model(inputs)
            loss.backward()
            xm.optimizer_step(optimizer, barrier=True)  # barrier for multi-host

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/multi-pod-training.md

**DDP variant:**

=======

def _mp_fn(index):
    device = torch_xla.device()
    model = MyModel().to('xla')

    for batch in loader:
        with torch_xla.step():
            inputs, labels = batch['input_ids'].to('xla'), batch['labels'].to('xla')
            optimizer.zero_grad()
            loss = model(inputs)
            loss.backward()
            xm.optimizer_step(optimizer, barrier=True)  # barrier for multi-host

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```

**DDP variant:**

>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/multi-pod-training.md
=======

**DDP variant:**

>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/multi-pod-training.md
```python
import torch.distributed as dist
import torch_xla
import torch_xla.distributed.xla_backend
from torch.nn.parallel import DistributedDataParallel as DDP

def _mp_fn(rank):
    dist.init_process_group("xla", init_method='xla://')
    model = MyModel().to('xla')
    ddp_model = DDP(model, gradient_as_bucket_view=True)

    for batch in loader:
        with torch_xla.step():
            inputs, labels = inputs.to('xla'), labels.to('xla')
            optimizer.zero_grad()
            outputs = ddp_model(inputs)
            loss = loss_fn(outputs, labels)
            loss.backward()
            optimizer.step()

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```

<<<<<<< S:/AntiGravity_Skills/ml-engine/references/multi-pod-training.md
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/multi-pod-training.md
=======
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/multi-pod-training.md
=======
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/multi-pod-training.md
=======
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/multi-pod-training.md
## Multi-Pod: `torchrun` (Alternative)

Use `torchrun` with XLA backend. Each host runs 8 processes. Coordinator resolves all hosts.

```bash
# On each host (or via gcloud compute tpus tpu-vm ssh)
export PJRT_DEVICE=TPU
export TPU_MESH_CONTROLLER_ADDRESS=10.128.0.2:8476  # coordinator IP
export TPU_MESH_CONTROLLER_PORT=8476
export TPU_NUM_DEVICES=8

torchrun \
    --nnodes=8 \                          # 8 hosts for v3-64
    --nproc_per_node=8 \                   # 8 TPU cores per host
    --node_rank=$HOST_ID \                 # 0..7
    --master_addr=$COORDINATOR_IP \
    --master_port=8476 \
    train.py
```

```python
# train.py
import torch
import torch.distributed as dist
import torch_xla.distributed.xla_backend
import torch_xla.core.xla_model as xm
from torch_xla import runtime as xr
from torch_xla.distributed.spmd import Mesh

# torchrun initializes process group automatically
dist.init_process_group("xla")

rank = dist.get_rank()        # 0..63 for v3-64
local_rank = xr.global_ordinal() # 0..7 per host
world_size = dist.get_world_size()  # 64

# 1D mesh across all 64 cores
mesh = Mesh(np.arange(world_size), (world_size,), axis_names=("data",))
```

## Multi-Pod: `xmp.spawn` (Alternative)

Use `xmp.spawn` when you control the launch (not via torchrun).

```python
import torch_xla.distributed.xla_multiprocessing as xmp

def _mp_fn(index):
    """
    index: local process rank on THIS host (0..7)
    """
    import torch_xla.core.xla_model as xm
    device = torch_xla.device()

    # Get global rank via environment
    local_world_size = xr.world_size()  # TOTAL across all hosts

    # Mesh spans ALL hosts
    mesh = Mesh(np.arange(local_world_size), (local_world_size,), axis_names=("data",))

    # Training loop
    model = MyModel().to('xla')
    mark_sharding(model, mesh, PartitionSpec("data", None))

    for batch in loader:
        with torch_xla.step():
            loss = ...
            loss.backward()
            xm.optimizer_step(optimizer, barrier=True)  # barrier for multi-host sync

# Spawn 8 processes PER host
# This is called on EVERY host in the pod
xmp.spawn(_mp_fn, nprocs=8, start_method="fork")  # Legacy — prefer torch_xla.launch()
```

**Important:** `xmp.spawn` is called on EACH host. Each host spawns 8 processes. The processes coordinate via XLA collectives.

## 2D Mesh for Multi-Pod (v3-64)

For large models, use 2D mesh: data + model parallelism across 64 cores.

```python
# v3-64 = 8 hosts x 8 cores = 64 cores
# 2D mesh: (data=8, model=8) or (data=16, model=4)
import math

world_size = 64  # v3-64
# Pick factors based on model size and batch size
data_parallel = 8   # 8-way data parallel
model_parallel = 8  # 8-way model parallel (FSDP or tensor parallel)

mesh = Mesh(
    np.arange(world_size),
    (data_parallel, model_parallel),
    axis_names=("data", "model"),
)

# Shard parameters: model parallelism
mark_sharding(model.embed.weight, mesh, PartitionSpec("data", "model"))
mark_sharding(model.lm_head.weight, mesh, PartitionSpec("model", "data"))
```

## Checkpointing for Multi-Pod

Use `torch.distributed.checkpoint` with CPU process group (gloo) for SPMD.

```python
from torch.distributed.checkpoint import FileSystemWriter, save_state_dict
import torch.distributed as dist

# Save: only rank 0 writes metadata, all ranks write shards
if step % 1000 == 0:
    state_dict = model.state_dict()
    # FSDP sharding preserves shard info
    save_state_dict(
        state_dict=state_dict,
        storage_writer=FileSystemWriter(f"ckpt/step_{step}"),
        planner=...,
    )

# Load: all ranks read their shard
from torch.distributed.checkpoint import FileSystemReader, load_state_dict
load_state_dict(
    state_dict=state_dict,
    storage_reader=FileSystemReader(checkpoint_dir),
)
```

See: `docs.pytorch.org/xla/master/perf/spmd_distributed_checkpoint.html`

## Environment Variables

```bash
# Required for multi-host TPU
export PJRT_DEVICE=TPU

# Coordinator (one host acts as coordinator)
export TPU_MESH_CONTROLLER_ADDRESS=10.128.0.2
export TPU_MESH_CONTROLLER_PORT=8476

# Process-local device count
export TPU_NUM_DEVICES=8

# For torchrun
export LOCAL_WORLD_SIZE=8
export WORLD_SIZE=64
```

## Anti-Patterns

- Don't use `xmp.spawn` on single-host v2-8 / v3-8 — just run `python train.py`
- Don't forget `barrier=True` in `xm.optimizer_step()` for multi-host — gradients must sync
- Don't save full unsharded checkpoints on every rank — use distributed checkpointing
- Don't use `torch.save()` directly with SPMD sharded models — loses sharding info
- Don't set `TPU_MESH_CONTROLLER_ADDRESS` on single-host — only for multi-pod
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/multi-pod-training.md
