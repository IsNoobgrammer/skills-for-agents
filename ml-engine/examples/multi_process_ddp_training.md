# Multi-Process Training — DDP and XLA DDP

## Overview

Multi-device training patterns: `torch_xla.launch()` with `xm.optimizer_step()` (XLA DDP) or `DistributedDataParallel` (PyTorch DDP with XLA backend).

## Pattern 1: XLA DDP (xm.optimizer_step)

Simplest multi-process. `xm.optimizer_step()` handles gradient all-reduce + optimizer step + sync.

```python
import torch
import torch.nn as nn
import torch_xla
import torch_xla.core.xla_model as xm
import torch_xla.runtime as xr

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

def _mp_fn(index):
    # Compilation cache per process
    xr.initialize_cache(f'/tmp/xla_cache_{index}', readonly=False)

    device = torch_xla.device()
    model = SimpleModel().to('xla')
    optimizer = torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.5)
    loss_fn = nn.MSELoss()

    for step in range(100):
        with torch_xla.step():
            x = torch.randn(32, 512, device='xla')
            target = torch.randn(32, 512, device='xla')
            optimizer.zero_grad()
            output = model(x)
            loss = loss_fn(output, target)
            loss.backward()
            # all_reduce + optimizer.step() + sync
            xm.optimizer_step(optimizer)

        if step % 10 == 0 and xm.is_master_ordinal():
            print(f"Step {step}, Loss: {loss.item():.4f}")

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```

## Pattern 2: PyTorch DDP with XLA Backend

Use `DistributedDataParallel` with XLA process group. Rank/world_size inferred from XLA runtime.

```python
import torch
import torch.nn as nn
import torch.distributed as dist
import torch_xla
import torch_xla.distributed.xla_backend
from torch.nn.parallel import DistributedDataParallel as DDP

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

def _mp_fn(rank):
    # Rank and world size inferred from XLA device runtime
    dist.init_process_group("xla", init_method='xla://')

    model = SimpleModel().to('xla')
    # gradient_as_bucket_view=True is required for XLA DDP
    ddp_model = DDP(model, gradient_as_bucket_view=True)
    optimizer = torch.optim.AdamW(ddp_model.parameters(), lr=1e-4)
    loss_fn = nn.MSELoss()

    for step in range(100):
        with torch_xla.step():
            x = torch.randn(32, 512, device='xla')
            target = torch.randn(32, 512, device='xla')
            optimizer.zero_grad()
            output = ddp_model(x)
            loss = loss_fn(output, target)
            loss.backward()
            optimizer.step()

        if step % 10 == 0 and dist.get_rank() == 0:
            print(f"Step {step}, Loss: {loss.item():.4f}")

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```

## Pattern 3: MpDeviceLoader

Wraps DataLoader for multi-device. Preloads data, overlaps dataloading with execution.

```python
import torch_xla
import torch_xla.core.xla_model as xm
import torch_xla.distributed.parallel_loader as pl

def _mp_fn(index):
    device = torch_xla.device()
    model = MyModel().to('xla')

    # Wrap loader — data auto-transferred to device
    mp_loader = pl.MpDeviceLoader(train_loader, device)

    for data, target in mp_loader:
        with torch_xla.step():
            optimizer.zero_grad()
            output = model(data)
            loss = loss_fn(output, target)
            loss.backward()
            xm.optimizer_step(optimizer)

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```

## Running

```bash
# XLA handles process spawning automatically
PJRT_DEVICE=TPU python train_ddp.py

# On TPU v4-8: 4 processes spawned (4 TPU devices)
# On v2-8/v3-8: 8 processes spawned (8 TPU cores)
# Each process sees xla:0 — this is correct (its own device)
```

## Key Points

1. `torch_xla.launch()` auto-selects world_size — no manual `nprocs`
2. Each process sees `xla:0` — this is correct, not a bug
3. `xm.optimizer_step()` = `all_reduce_gradients` + `optimizer.step()` + `torch_xla.sync()`
4. DDP requires `gradient_as_bucket_view=True`
5. No `device_ids=[rank]` for DDP — XLA handles assignment
6. Compilation cache must use unique paths per process
