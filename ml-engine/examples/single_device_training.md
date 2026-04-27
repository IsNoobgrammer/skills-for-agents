# Single Device Training — v2-8 / v3-8

## Overview

Simplest training pattern on TPU. One Python process, 8 TPU cores visible. No spawn, no multi-process.

## Full Example

```python
import torch
import torch.nn as nn
import torch_xla
import torch_xla.core.xla_model as xm
from torch_xla.distributed.spmd import Mesh, mark_sharding, PartitionSpec

# --- Model ---
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

# --- Setup ---
device = torch_xla.device()
print(f"Device: {device}")
print(f"Visible devices: {len(torch_xla.devices())}")  # 8

model = SimpleModel(dim=512).to('xla')
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=0.1)
loss_fn = nn.MSELoss()

# Optional: SPMD sharding across 8 cores
mesh = Mesh(range(8), (8,), axis_names=("data",))
# mark_sharding(model.net[0].weight, mesh, PartitionSpec("data", None))

# --- Training Loop ---
num_steps = 100
for step in range(num_steps):
    with torch_xla.step():
        # Synthetic data
        x = torch.randn(32, 512, device='xla')
        target = torch.randn(32, 512, device='xla')

        optimizer.zero_grad()
        output = model(x)
        loss = loss_fn(output, target)
        loss.backward()
        optimizer.step()

    if step % 10 == 0:
        print(f"Step {step}, Loss: {loss.item():.4f}")

torch_xla.sync()
print("Training complete")
```

## With Compiled Step Function

```python
import torch_xla

def step_fn(data, target):
    optimizer.zero_grad()
    output = model(data)
    loss = loss_fn(output, target)
    loss.backward()
    optimizer.step()
    return loss

compiled_step = torch_xla.compile(step_fn, full_graph=True, name="train_step")

for step in range(num_steps):
    x = torch.randn(32, 512, device='xla')
    target = torch.randn(32, 512, device='xla')
    loss = compiled_step(x, target)
```

## With Compilation Cache

```python
import torch_xla.runtime as xr

xr.initialize_cache('/tmp/xla_cache', readonly=False)
# Now subsequent runs reuse compiled executables
```

## With Eager Mode (Debugging)

```python
import torch_xla

torch_xla.experimental.eager_mode(True)
# All ops execute eagerly — inspect intermediate values with print()
# Combine with compile for selective compilation:
# compiled_fn = torch_xla.compile(fn)  # still compiled
```

## Running

```bash
# v2-8 / v3-8: just run
PJRT_DEVICE=TPU python train_single_device.py

# No spawn needed — all 8 TPU cores visible to one process
```
