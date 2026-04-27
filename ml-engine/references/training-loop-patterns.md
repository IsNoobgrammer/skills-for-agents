# Training Loop Patterns — Modern PyTorch/XLA

## Overview

PyTorch/XLA provides multiple training loop patterns depending on your setup: single device, multi-process, DDP, FSDP, and SPMD. Modern APIs (`torch_xla.step()`, `torch_xla.sync()`, `torch_xla.launch()`) replace older patterns.

## Pattern 1: Single Device (v2-8 / v3-8)

Simplest pattern. No spawn, no multi-process. All 8 cores visible to one process.

```python
import torch_xla

model.to('xla')
for inputs, labels in train_loader:
    with torch_xla.step():
        inputs, labels = inputs.to('xla'), labels.to('xla')
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = loss_fn(outputs, labels)
        loss.backward()
        optimizer.step()
torch_xla.sync()
```

**Key points:**
- `torch_xla.step()` context manager: marks step boundary, triggers XLA execution
- `torch_xla.sync()`: final synchronization after training
- `model.to('xla')`: move model parameters to XLA device once

## Pattern 2: Multi-Process with `torch_xla.launch()`

For multi-device training. Replaces `xmp.spawn()` and `mp.spawn()`.

```python
import torch_xla
import torch_xla.core.xla_model as xm

def _mp_fn(index):
    device = torch_xla.device()
    model.to('xla')

    for inputs, labels in train_loader:
        with torch_xla.step():
            inputs, labels = inputs.to('xla'), labels.to('xla')
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = loss_fn(outputs, labels)
            loss.backward()
            xm.optimizer_step(optimizer)  # all_reduce + step + sync

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```

**Key points:**
- `torch_xla.launch()`: auto-selects world size, spawns processes
- `xm.optimizer_step()`: combines `all_reduce_gradients` + `optimizer.step()` + `torch_xla.sync()`
- Each process sees `xla:0` (its own device) — this is correct, not a bug

## Pattern 3: DDP with XLA Backend

Use PyTorch's `DistributedDataParallel` with XLA process group.

```python
import torch.distributed as dist
import torch_xla
import torch_xla.distributed.xla_backend
from torch.nn.parallel import DistributedDataParallel as DDP

def _mp_fn(rank):
    dist.init_process_group("xla", init_method='xla://')
    model.to('xla')
    ddp_model = DDP(model, gradient_as_bucket_view=True)

    for inputs, labels in train_loader:
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

**Key points:**
- `dist.init_process_group("xla")`: rank/world_size inferred from XLA runtime
- `gradient_as_bucket_view=True`: required for XLA DDP
- No `device_ids=[rank]` needed — XLA handles device assignment

## Pattern 4: Compiled Step Function

Use `torch_xla.compile()` to compile the entire step as one graph for maximum performance.

```python
import torch_xla

device = torch_xla.device()
model = MyModel().to(device)
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)
loss_fn = nn.CrossEntropyLoss()

def step_fn(data, target):
    optimizer.zero_grad()
    output = model(data)
    loss = loss_fn(output, target)
    loss.backward()
    optimizer.step()
    return loss

compiled_step = torch_xla.compile(step_fn, full_graph=True, name="train_step")

for data, target in loader:
    loss = compiled_step(data, target)
```

**Key points:**
- `full_graph=True`: compile entire step as one XLA graph
- `name`: optional label for debugging
- Best performance when step is pure (same shapes each iteration)

## Pattern 5: MpDeviceLoader

Wraps standard DataLoader for multi-device training. Preloads data and overlaps dataloading with execution.

```python
import torch_xla.distributed.parallel_loader as pl

device = torch_xla.device()
mp_loader = pl.MpDeviceLoader(train_loader, device)

for data, target in mp_loader:
    # data and target already on XLA device
    with torch_xla.step():
        optimizer.zero_grad()
        output = model(data)
        loss = loss_fn(output, target)
        loss.backward()
        xm.optimizer_step(optimizer)
```

**With SPMD input sharding:**

```python
mp_loader = pl.MpDeviceLoader(
    train_loader,
    device,
    input_sharding=xs.ShardingSpec(mesh, ('data', None, None, None))
)
```

## Pattern 6: Eager Mode

For debugging. Operations execute immediately instead of being lazily traced.

```python
import torch_xla

torch_xla.experimental.eager_mode(True)

# All XLA ops now execute eagerly — like CPU/CUDA
# Useful for: debugging, inspecting intermediate values, print statements
# Combine with compile for selective compilation:
#   torch_xla.experimental.eager_mode(True)  # global eager
#   compiled_fn = torch_xla.compile(fn)       # selective compile
```

**When to use eager:**
- Debugging: inspect intermediate tensor values
- Development: verify model correctness before switching to lazy
- Mixed: eager globally + `torch_xla.compile()` for hot paths

## API Migration (Old → New)

| Old | New | Notes |
|-----|-----|-------|
| `xm.mark_step()` | `torch_xla.sync()` or `torch_xla.step()` | Context manager preferred |
| `xmp.spawn(_fn, nprocs=8)` | `torch_xla.launch(_fn)` | Auto world_size |
| `mp.spawn(_fn, nprocs=N)` | `torch_xla.launch(_fn)` | Same replacement |
| `ParallelLoader(loader, [device])` | `pl.MpDeviceLoader(loader, device)` | Simpler API |
| Manual `optimizer.step()` + sync | `xm.optimizer_step(optimizer)` | All-reduce + step + sync |
| `xm.xla_device()` | `torch_xla.device()` | Top-level API |

## Anti-Patterns

- Don't call `torch_xla.device()` before `torch_xla.launch()` in multi-process — only inside `_mp_fn`
- Don't mix `xm.mark_step()` and `torch_xla.step()` — pick one pattern
- Don't use `torch.save()` on XLA tensors — move to CPU first with `.cpu()`
- Don't access XLA devices outside the launch function in multi-process mode
