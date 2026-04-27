# FSDPv2 and SPMD Training

## Overview

FSDPv2 uses GSPMD for fully sharded data parallelism. SPMD mode enables single-process multi-device training with compiler-optimized collectives. Better performance than DDP for many workloads.

## Pattern 1: SPMD Data Parallelism

Single process, all devices. Sharding handled by `mark_sharding` and `MpDeviceLoader` with `input_sharding`.

```python
import numpy as np
import torch
import torch_xla
import torch_xla.distributed.spmd as xs
import torch_xla.distributed.parallel_loader as pl
from torch_xla import runtime as xr

# Enable SPMD
xr.use_spmd()

num_devices = xr.global_runtime_device_count()
mesh = xs.Mesh(np.arange(num_devices), (num_devices,), ('data',))

# Scale batch — one process handles all devices
batch_size = 128 * num_devices

# DataLoader with SPMD input sharding
train_loader = pl.MpDeviceLoader(
    train_loader,
    torch_xla.device(),
    input_sharding=xs.ShardingSpec(mesh, ('data', None, None, None))
)

model = MyModel().to('xla')
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for data, target in train_loader:
    with torch_xla.step():
        optimizer.zero_grad()
        output = model(data)
        loss = loss_fn(output, target)
        loss.backward()
        optimizer.step()
```

## Pattern 2: FSDPv2 (Full Example)

GSPMD-based fully sharded data parallelism for large models.

```python
import functools
import numpy as np
import torch
import torch.nn as nn
import torch_xla
import torch_xla.distributed.spmd as xs
import torch_xla.distributed.parallel_loader as pl
from torch_xla import runtime as xr
from torch_xla.experimental.spmd_fully_sharded_data_parallel import SpmdFullyShardedDataParallel as FSDPv2
from torch_xla.distributed.fsdp.wrap import transformer_auto_wrap_policy

# --- Model (Llama-style decoder) ---
class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(dim))
        self.eps = eps
    def forward(self, x):
        variance = x.to(torch.float32).pow(2).mean(-1, keepdim=True)
        return self.weight * x * torch.rsqrt(variance + self.eps)

class DecoderLayer(nn.Module):
    def __init__(self, dim, num_heads, intermediate_size):
        super().__init__()
        self.input_layernorm = RMSNorm(dim)
        self.self_attn = nn.MultiheadAttention(dim, num_heads, batch_first=True)
        self.post_attention_layernorm = RMSNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, intermediate_size, bias=False),
            nn.GELU(),
            nn.Linear(intermediate_size, dim, bias=False),
        )
    def forward(self, x):
        residual = x
        x = self.input_layernorm(x)
        x, _ = self.self_attn(x, x, x)
        x = residual + x
        residual = x
        x = self.post_attention_layernorm(x)
        x = self.mlp(x)
        return residual + x

class DecoderModel(nn.Module):
    def __init__(self, vocab_size, dim, num_layers, num_heads, intermediate_size):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, dim)
        self.layers = nn.ModuleList([
            DecoderLayer(dim, num_heads, intermediate_size)
            for _ in range(num_layers)
        ])
        self.norm = RMSNorm(dim)
        self.lm_head = nn.Linear(dim, vocab_size, bias=False)
    def forward(self, input_ids):
        x = self.embed(input_ids)
        for layer in self.layers:
            x = layer(x)
        x = self.norm(x)
        return self.lm_head(x)

# --- Setup ---
xr.use_spmd()

num_devices = xr.global_runtime_device_count()
mesh_shape = (num_devices, 1)
device_ids = np.arange(num_devices)
# Mesh MUST have 'fsdp' axis
mesh = xs.Mesh(device_ids, mesh_shape, ('fsdp', 'model'))
xs.set_global_mesh(mesh)

# Create model
model = DecoderModel(
    vocab_size=3200, dim=1024, num_layers=8,
    num_heads=8, intermediate_size=4096,
)

# Auto-wrap each DecoderLayer with FSDP
auto_wrap_policy = functools.partial(
    transformer_auto_wrap_policy,
    transformer_layer_cls={DecoderLayer},
)
model = FSDPv2(model, auto_wrap_policy=auto_wrap_policy)
optimizer = torch.optim.Adam(model.parameters(), lr=0.0001)

# DataLoader with FSDP sharding
batch_size = 32 * num_devices
train_loader = pl.MpDeviceLoader(
    train_loader,
    torch_xla.device(),
    input_sharding=xs.ShardingSpec(mesh, ('fsdp', None)),
)

# --- Training ---
loss_fn = nn.CrossEntropyLoss()
for step, (data, target) in enumerate(train_loader):
    with torch_xla.step():
        output = model(data)
        loss = loss_fn(output.view(-1, output.size(-1)), target.view(-1))
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

    if step % 10 == 0:
        print(f"Step {step}, Loss: {loss.item():.4f}")
```

## Pattern 3: FSDPv2 with Gradient Checkpointing

Apply `checkpoint_module` BEFORE FSDPv2 wrapper.

```python
from torch_xla.distributed.fsdp import checkpoint_module

# checkpoint_module goes BEFORE FSDPv2
model = FSDPv2(checkpoint_module(my_module), mesh=mesh)
```

## Pattern 4: FSDPv2 with Custom Output Sharding

For non-standard forward outputs, provide `shard_output`:

```python
def shard_output(output, mesh):
    xs.mark_sharding(output.logits, mesh, ('fsdp', None, None))

model = FSDPv2(my_module, mesh, shard_output)
```

## Running

```bash
# SPMD: single process, all devices
PJRT_DEVICE=TPU python train_fsdp_spmd.py

# No torch_xla.launch needed — SPMD uses single process
```

## Key Points

1. `xr.use_spmd()` must be called before any XLA computation
2. FSDPv2 mesh MUST have `fsdp` axis name
3. `xs.set_global_mesh(mesh)` — FSDPv2 uses global mesh
4. Scale batch size by `num_devices` — one process handles all devices
5. `checkpoint_module` must be applied BEFORE FSDPv2 wrapper
6. SPMD is incompatible with DDP — pick one pattern
