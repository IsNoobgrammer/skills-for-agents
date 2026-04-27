<<<<<<< S:/AntiGravity_Skills/ml-engine/examples/dual_framework_example.md
# Dual-Framework Example: PT-XLA + JAX Single-Run Training Loop

## Overview

This example demonstrates running PyTorch-XLA as the primary training framework with JAX for auxiliary computations (e.g., custom routing loss, differentiable top-k) in a single process on a v2-8 / v3-8 TPU.

## Setup

```python
import torch
import torch.nn as nn
import torch_xla.core.xla_model as xm
from torch_xla.distributed.spmd import Mesh, PartitionSpec, mark_sharding

import jax
import jax.numpy as jnp
from jax import grad, jit
from torch.utils.dlpack import to_dlpack, from_dlpack

import wandb
from datasets import load_dataset
from transformers import AutoTokenizer
```

## TPU and Mesh Setup

```python
# Single host: v2-8 or v3-8
devices = xm.xla_devices()
print(f"TPU devices: {len(devices)}")  # 8

mesh = Mesh(devices, (8,), axis_names=("data",))
```

## Model with MoE Router

```python
class SimpleMoE(nn.Module):
    def __init__(self, dim=512, num_experts=8, top_k=2):
        super().__init__()
        self.router = nn.Linear(dim, num_experts, bias=False)
        self.experts = nn.ModuleList([
            nn.Sequential(nn.Linear(dim, 4*dim), nn.GELU(), nn.Linear(4*dim, dim))
            for _ in range(num_experts)
        ])
        self.top_k = top_k

        # Shard router output across experts
        mark_sharding(self.router.weight, mesh, PartitionSpec(None, "model"))

    def forward(self, x):
        # x: (batch, seq, dim)
        logits = self.router(x)  # (batch, seq, num_experts)
        gates, indices = torch.topk(torch.softmax(logits, dim=-1), self.top_k, dim=-1)

        # JAX auxiliary: load-balancing loss
        jax_gates = jax.dlpack.from_dlpack(to_dlpack(gates.detach()))
        mean_per_expert = jnp.mean(jax_gates, axis=(0, 1))  # (num_experts,)
        aux_loss_jax = jnp.sum((mean_per_expert - 1.0/len(self.experts)) ** 2)
        aux_loss = from_dlpack(jax.dlpack.to_dlpack(aux_loss_jax))

        # Expert dispatch (simplified — loop for clarity)
        batch, seq, dim = x.shape
        x_flat = x.view(-1, dim)
        indices_flat = indices.view(-1, self.top_k)
        gates_flat = gates.view(-1, self.top_k)

        output = torch.zeros_like(x_flat)
        for i, expert in enumerate(self.experts):
            mask = (indices_flat == i).any(dim=-1)
            if mask.any():
                expert_input = x_flat[mask]
                expert_out = expert(expert_input)
                gate_vals = gates_flat[mask].sum(dim=-1, keepdim=True)
                output[mask] += gate_vals * expert_out

        return output.view(batch, seq, dim), aux_loss
```

## Data Pipeline

```python
def create_dataloader(dataset_name="openwebtext", batch_size=16, max_length=512, seed=42):
    tokenizer = AutoTokenizer.from_pretrained("gpt2")
    tokenizer.pad_token = tokenizer.eos_token

    ds = load_dataset(dataset_name, split="train", streaming=True)
    ds = ds.shuffle(seed=seed, buffer_size=10_000)

    # Shard for SPMD
    world_size = xm.xrt_world_size()
    rank = xm.get_ordinal()
    ds = ds.shard(num_shards=world_size, index=rank)

    def collate(examples):
        texts = [ex["text"] for ex in examples]
        toks = tokenizer(texts, padding="max_length", truncation=True,
                       max_length=max_length, return_tensors="pt")
        return {
            "input_ids": toks["input_ids"],
            "attention_mask": toks["attention_mask"],
            "labels": toks["input_ids"].clone(),
        }

    from torch.utils.data import IterableDataset, DataLoader

    class StreamingDataset(IterableDataset):
        def __init__(self, dataset):
            self.dataset = dataset
        def __iter__(self):
            for item in self.dataset:
                yield item

    loader = DataLoader(StreamingDataset(ds), batch_size=batch_size,
                        collate_fn=collate, drop_last=True)
    return loader
```

## Training Loop

```python
def train():
    # Seed
    torch.manual_seed(42)

    # Model
    model = SimpleMoE(dim=512, num_experts=8, top_k=2).to(xm.xla_device())
    mark_sharding(model, mesh, PartitionSpec("data", None))

    # Optimizer
    from torch_xla.amp.syncfree import AdamW as SyncFreeAdamW
    optimizer = SyncFreeAdamW(model.parameters(), lr=1e-4, weight_decay=0.1)

    # Data
    train_loader = create_dataloader(batch_size=16)

    # wandb
    if xm.is_master_ordinal():
        wandb.init(project="dual-framework-demo", config={
            "framework": "pt-xla-primary",
            "aux_framework": "jax",
            "tpu": "v2-8",
        })

    # Train
    model.train()
    for step, batch in enumerate(train_loader):
        if step >= 1000:
            break

        input_ids = batch["input_ids"].to(xm.xla_device())
        labels = batch["labels"].to(xm.xla_device())

        # Forward
        hidden = torch.randn(input_ids.shape + (512,)).to(xm.xla_device())  # dummy embed
        output, aux_loss = model(hidden)

        # Dummy loss (replace with actual LM loss)
        loss = output.mean() + 0.01 * aux_loss

        # Backward
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        xm.mark_step()

        # Log
        if step % 10 == 0:
            global_loss = xm.all_reduce(xm.REDUCE_SUM, loss) / xm.xrt_world_size()
            if xm.is_master_ordinal():
                wandb.log({"train/loss": global_loss.item(), "step": step})

    if xm.is_master_ordinal():
        wandb.finish()

if __name__ == "__main__":
    train()
```

## Running

```bash
# v2-8 / v3-8: Single process, 8 cores visible
python dual_framework_train.py

# No spawn needed — all 8 TPU cores are visible to one process
```

## Key Points

1. **No `xmp.spawn()`** on single-host v2-8 / v3-8 — just run `python train.py`
2. **JAX interop** via DLPack for auxiliary computations
3. **SyncFree AdamW** for ~20% speedup over standard AdamW on TPU
4. **Splash Attention** (v3+) or Flash Attention (v2) for efficient attention
5. **SPMD sharding** via `mark_sharding` for model parallelism across 8 cores
=======
# Dual-Framework Example: PT-XLA + JAX Single-Run Training Loop

## Overview

This example demonstrates running PyTorch-XLA as the primary training framework with JAX for auxiliary computations (e.g., custom routing loss, differentiable top-k) in a single process on a v2-8 / v3-8 TPU.

## Setup

```python
import torch
import torch.nn as nn
import torch_xla
import torch_xla.core.xla_model as xm
from torch_xla import runtime as xr
from torch_xla.distributed.spmd import Mesh, PartitionSpec, mark_sharding

import jax
import jax.numpy as jnp
from jax import grad, jit
from torch.utils.dlpack import to_dlpack, from_dlpack

import wandb
from datasets import load_dataset
from transformers import AutoTokenizer
```

## TPU and Mesh Setup

```python
# Single host: v2-8 or v3-8
devices = torch_xla.devices()
print(f"TPU devices: {len(devices)}")  # 8

mesh = Mesh(range(8), (8,), axis_names=("data",))
```

## Model with MoE Router

```python
class SimpleMoE(nn.Module):
    def __init__(self, dim=512, num_experts=8, top_k=2):
        super().__init__()
        self.router = nn.Linear(dim, num_experts, bias=False)
        self.experts = nn.ModuleList([
            nn.Sequential(nn.Linear(dim, 4*dim), nn.GELU(), nn.Linear(4*dim, dim))
            for _ in range(num_experts)
        ])
        self.top_k = top_k

        # Shard router output across experts
        mark_sharding(self.router.weight, mesh, PartitionSpec(None, "model"))

    def forward(self, x):
        # x: (batch, seq, dim)
        logits = self.router(x)  # (batch, seq, num_experts)
        gates, indices = torch.topk(torch.softmax(logits, dim=-1), self.top_k, dim=-1)

        # JAX auxiliary: load-balancing loss
        jax_gates = jax.dlpack.from_dlpack(to_dlpack(gates.detach()))
        mean_per_expert = jnp.mean(jax_gates, axis=(0, 1))  # (num_experts,)
        aux_loss_jax = jnp.sum((mean_per_expert - 1.0/len(self.experts)) ** 2)
        aux_loss = from_dlpack(jax.dlpack.to_dlpack(aux_loss_jax))

        # Expert dispatch (simplified — loop for clarity)
        batch, seq, dim = x.shape
        x_flat = x.view(-1, dim)
        indices_flat = indices.view(-1, self.top_k)
        gates_flat = gates.view(-1, self.top_k)

        output = torch.zeros_like(x_flat)
        for i, expert in enumerate(self.experts):
            mask = (indices_flat == i).any(dim=-1)
            if mask.any():
                expert_input = x_flat[mask]
                expert_out = expert(expert_input)
                gate_vals = gates_flat[mask].sum(dim=-1, keepdim=True)
                output[mask] += gate_vals * expert_out

        return output.view(batch, seq, dim), aux_loss
```

## Data Pipeline

```python
def create_dataloader(dataset_name="openwebtext", batch_size=16, max_length=512, seed=42):
    tokenizer = AutoTokenizer.from_pretrained("gpt2")
    tokenizer.pad_token = tokenizer.eos_token

    ds = load_dataset(dataset_name, split="train", streaming=True)
    ds = ds.shuffle(seed=seed, buffer_size=10_000)

    # Shard for SPMD
    world_size = xr.world_size()
    rank = xr.global_ordinal()
    ds = ds.shard(num_shards=world_size, index=rank)

    def collate(examples):
        texts = [ex["text"] for ex in examples]
        toks = tokenizer(texts, padding="max_length", truncation=True,
                       max_length=max_length, return_tensors="pt")
        return {
            "input_ids": toks["input_ids"],
            "attention_mask": toks["attention_mask"],
            "labels": toks["input_ids"].clone(),
        }

    from torch.utils.data import IterableDataset, DataLoader

    class StreamingDataset(IterableDataset):
        def __init__(self, dataset):
            self.dataset = dataset
        def __iter__(self):
            for item in self.dataset:
                yield item

    loader = DataLoader(StreamingDataset(ds), batch_size=batch_size,
                        collate_fn=collate, drop_last=True)
    return loader
```

## Training Loop (Modern API)

```python
def train():
    # Seed
    torch.manual_seed(42)

    # Model
    model = SimpleMoE(dim=512, num_experts=8, top_k=2).to('xla')
    mark_sharding(model, mesh, PartitionSpec("data", None))

    # Optimizer
    from torch_xla.amp.syncfree import AdamW as SyncFreeAdamW
    optimizer = SyncFreeAdamW(model.parameters(), lr=1e-4, weight_decay=0.1)

    # Data
    train_loader = create_dataloader(batch_size=16)

    # wandb
    if xm.is_master_ordinal():
        wandb.init(project="dual-framework-demo", config={
            "framework": "pt-xla-primary",
            "aux_framework": "jax",
            "tpu": "v2-8",
        })

    # Train — modern torch_xla.step() pattern
    model.train()
    for step, batch in enumerate(train_loader):
        if step >= 1000:
            break

        with torch_xla.step():
            input_ids = batch["input_ids"].to('xla')
            labels = batch["labels"].to('xla')

            # Forward
            hidden = torch.randn(input_ids.shape + (512,)).to('xla')  # dummy embed
            output, aux_loss = model(hidden)

            # Dummy loss (replace with actual LM loss)
            loss = output.mean() + 0.01 * aux_loss

            # Backward
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        # Log
        if step % 10 == 0:
            global_loss = xm.all_reduce(xm.REDUCE_SUM, loss) / xr.world_size()
            if xm.is_master_ordinal():
                wandb.log({"train/loss": global_loss.item(), "step": step})

    torch_xla.sync()
    if xm.is_master_ordinal():
        wandb.finish()

if __name__ == "__main__":
    train()
```

## Running

```bash
# v2-8 / v3-8: Single process, 8 cores visible
python dual_framework_train.py

# No spawn needed — all 8 TPU cores are visible to one process
```

## Key Points

1. **No `xmp.spawn()`** on single-host v2-8 / v3-8 — just run `python train.py`
2. **`torch_xla.step()`** context manager replaces manual `xm.mark_step()`
3. **JAX interop** via DLPack for auxiliary computations
4. **SyncFree AdamW** for ~20% speedup over standard AdamW on TPU
5. **SPMD sharding** via `mark_sharding` for model parallelism across 8 cores
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/examples/dual_framework_example.md
