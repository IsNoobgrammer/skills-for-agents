---
name: ml-engine
description: >
  TPU-first ML research engine for reproducible distributed training and ablation studies.
  Use for PyTorch-XLA, JAX, TPU, SPMD, GSPMD, MoE, router, Pallas, multi-pod training,
  FSDPv2, and sharded data pipelines.
  Triggers on: TPU, v2-8, v3-8, v3-64, torch_xla, JAX, distributed, sharding, MoE,
  router, flash/splash attention, Pallas, custom kernel, SPMD, GSPMD, FSDPv2, torchax,
  /ml, /ml-train, /ml-mesh, /ml-debug, /ml-benchmark, /ml-migrate, /ml-port,
  /ml-optimize, /ml-plan, /ml-ablate, /ml-checkpoint, /ml-profile.
domain: process
composable: true
yields_to: [craft, voice]
---

# ml-engine

TPU-first ML research engine. Builds reproducible distributed training pipelines for novel architecture ablations. PyTorch-XLA (torchtpu) is primary; JAX/torchax is first-class secondary. Targets v2-8 (primary), v3-8 (quota), v3-64 (multi-pod scaling). Uses modern `torch_xla` APIs: `torch_xla.step()`, `torch_xla.sync()`, `torch_xla.launch()`, `torch_xla.compile()`, FSDPv2, SPMD, `@assume_pure`, `scan_layers`.

---

## When to Use

- Distributed training on TPU with PyTorch-XLA or JAX
- Novel architecture components: MoE, router, custom FFN, custom LayerNorm
- Reproducible ablation studies with deterministic data pipelines
- SPMD / GSPMD sharding setup and debugging
- Attention kernel selection: Splash, Flash, SDPA on TPU
- Raw optimizer integration: `torch.optim`, `optax`, SyncFree AdamW
- `datasets` streaming with sharded loaders
- `wandb` logging on multi-host TPU runs
- Offline/online evaluation loops with checkpoint resumption
- Tensor manipulation with `einops` on TPU
- Multi-pod training: v3-32, v3-64, v4-128
- Pallas custom TPU kernels via `call_jax`
- Modern `torch_xla` APIs: `torch_xla.step()`, `torch_xla.sync()`, `torch_xla.launch()`, `torch_xla.compile()`
- FSDPv2 (GSPMD-based fully sharded data parallelism)
- `@assume_pure` for tracing optimization
- `scan` / `scan_layers` for compile-time reduction on homogeneous layers
- `torchax` — PyTorch frontend for JAX interoperability
- `torch.compile(model, backend='openxla')` — Dynamo integration
- Compilation caching via `xr.initialize_cache()`
- Eager mode via `torch_xla.experimental.eager_mode()`
- Checkpoint saving, resumption, distributed checkpointing
- Profiling training bottlenecks with XLA profiler

---

## Commands

> See `README.md` for full command documentation, parameters, and examples.

| Command | Purpose | Example |
|---------|---------|---------|
| `/ml [idea]` | **Godmode** — full research scaffold end-to-end | `/ml "sparse MoE with dynamic clamping"` |
| `/ml-train [model] [tpu] [strategy]` | Generate training script | `/ml-train moe v3-8 fsdp` |
| `/ml-mesh [tpu] [parallelism]` | Generate mesh setup | `/ml-mesh v3-64 2d-data-model` |
| `/ml-debug [issue]` | Debug XLA issues | `/ml-debug recompilation` |
| `/ml-benchmark [kernel] [seq-len]` | Benchmark attention kernel | `/ml-benchmark auto 2048` |
| `/ml-migrate [code]` | Migrate old API → modern | `/ml-migrate train.py` |
| `/ml-port [code] [mode]` | Port PyTorch → torch_xla native | `/ml-port model.py native` |
| `/ml-optimize [object] [method]` | Optimize XLA bottleneck | `/ml-optimize router pallas` |
| `/ml-plan [idea] [scope]` | Plan & template research | `/ml-plan "sparse MoE" full` |
| `/ml-ablate [var] [values]` | Run ablation matrix | `/ml-ablate top_k "1,2,4"` |
| `/ml-checkpoint [action] [path]` | Save/resume/inspect checkpoint | `/ml-checkpoint resume ./ckpt` |
| `/ml-profile [target] [steps]` | Profile training bottleneck | `/ml-profile step_fn 100` |

---

## Godmode: `/ml`

`/ml [research idea]` — full research scaffold in one command. Runs the full cycle: analyze → plan → implement → verify.

**What it produces:**
1. Research hypothesis + experiment matrix
2. Mesh setup for target TPU (auto-detected or specified)
3. Training script with correct strategy (SPMD/FSDPv2/DDP)
4. Data pipeline (streaming + sharding)
5. Attention kernel selection (Splash/Flash/SDPA)
6. wandb config + logging hooks
7. Eval loop + perplexity/metric setup
8. Reproducibility seed lock + config dict
9. Ablation matrix if research involves multiple variables
10. Pallas optimization plan if bottleneck detected

**When to use `/ml` vs individual commands:**
- `/ml` = new research idea, greenfield. Get full scaffold.
- Individual commands = targeted work on existing code. Get surgical output.

---

## Core Instructions

### 1. TPU Detection and Mesh Initialization

Detect TPU version and initialize mesh before any model or data setup. Use modern `torch_xla` APIs — never legacy `xm.xla_device()`.

```python
import torch_xla
import torch_xla.core.xla_model as xm
import torch_xla.distributed.spmd as xs
from torch_xla import runtime as xr
import numpy as np

# Modern device access
device = torch_xla.device()
tpu_version = xm.get_tpu_env("TYPE", "v2-8")  # v2-8, v3-8, etc.

# 1D mesh for data parallelism on v2-8 / v3-8
num_devices = xr.global_runtime_device_count()  # SPMD-aware
mesh = xs.Mesh(np.arange(num_devices), (num_devices,), axis_names=("data",))
xs.set_global_mesh(mesh)
```

> See `references/tpu-setup.md` for single-host mesh, 2D sharding, and device placement.
> See `references/torchtpu.md` for modern PyTorch XLA runtime (PJRT, torch.compile).
> See `references/multi-pod-training.md` for v3-64, torchrun, and distributed checkpointing.

### 2. Modern Training Loop

Use `torch_xla.step()` context manager. Replaces manual `xm.mark_step()`. Never use `xm.mark_step()` in new code.

**Single device (v2-8 / v3-8):**

```python
import torch_xla

def train(model, train_loader, optimizer, loss_fn):
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

**Multi-process with `torch_xla.launch()`:**

```python
def _mp_fn(index):
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
    torch_xla.launch(_mp_fn, args=())  # auto-selects world_size
```

**DDP with XLA backend:**

```python
import torch.distributed as dist
import torch_xla.distributed.xla_backend

def _mp_fn(rank):
    dist.init_process_group("xla", init_method='xla://')
    model.to('xla')
    ddp_model = DDP(model, gradient_as_bucket_view=True)
    for inputs, labels in train_loader:
        with torch_xla.step():
            inputs, labels = inputs.to('xla'), labels.to('xla')
            optimizer.zero_grad()
            loss = loss_fn(ddp_model(inputs), labels)
            loss.backward()
            optimizer.step()

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```

> See `references/training-loop-patterns.md` for compiled step functions, eager mode, and MpDeviceLoader.

### 3. SPMD Data Parallelism

Single-process multi-device training. Better throughput than DDP for most TPU workloads.

```python
import torch_xla.distributed.spmd as xs
from torch_xla import runtime as xr
import torch_xla.distributed.parallel_loader as pl

xr.use_spmd()

num_devices = xr.global_runtime_device_count()
mesh = xs.Mesh(np.arange(num_devices), (num_devices,), ('data',))
xs.set_global_mesh(mesh)

# Scale batch size — one process handles all devices
batch_size *= num_devices

train_loader = pl.MpDeviceLoader(
    train_loader,
    device,
    input_sharding=xs.ShardingSpec(mesh, ('data', None, None, None))
)
```

> See `references/spmd.md` for mesh setup, partition specs, and advanced sharding.

### 4. FSDPv2

Large model training. Requires SPMD mode and mesh with `fsdp` axis.

```python
import torch_xla.distributed.spmd as xs
from torch_xla.experimental.spmd_fully_sharded_data_parallel import SpmdFullyShardedDataParallel as FSDPv2
from torch_xla import runtime as xr
from torch_xla.distributed.fsdp.wrap import transformer_auto_wrap_policy
import functools

xr.use_spmd()
num_devices = xr.global_runtime_device_count()
mesh = xs.Mesh(np.arange(num_devices), (num_devices, 1), ('fsdp', 'model'))
xs.set_global_mesh(mesh)

auto_wrap_policy = functools.partial(
    transformer_auto_wrap_policy,
    transformer_layer_cls={DecoderLayer},
)
model = FSDPv2(model, auto_wrap_policy=auto_wrap_policy)
```

**Gradient checkpointing** (apply before FSDPv2 wrapper):

```python
from torch_xla.distributed.fsdp import checkpoint_module
model = FSDPv2(checkpoint_module(my_module), mesh)
```

> See `references/fsdp-v2.md` for full FSDPv2 setup, sharding output, and distributed checkpointing.

### 5. Dual-Framework Runtime (PT-XLA + JAX/torchax)

PT-XLA = primary. JAX = auxiliary ops (custom loss, routing, differentiable sort). `torchax` = PyTorch syntax on JAX backend.

```python
# Interop via DLPack (zero-copy)
from torch.utils.dlpack import to_dlpack, from_dlpack
import jax

def pt_to_jax(tensor):
    return jax.dlpack.from_dlpack(to_dlpack(tensor))

def jax_to_pt(array):
    return from_dlpack(jax.dlpack.to_dlpack(array))
```

**torchax** (PyTorch frontend for JAX):

```python
import torchax  # must import before torch
import torch    # torchax intercepts torch ops → runs on JAX/XLA
```

> See `references/dual-framework.md` for interop patterns and memory management.
> See `references/torchax.md` for torchax setup and PyTorch-on-JAX patterns.

### 6. Model Architecture Patterns

MoE routers, custom FFN (SwiGLU), RMSNorm — all with SPMD sharding annotations baked in.

```python
import torch.nn as nn
from torch_xla.distributed.spmd import mark_sharding, PartitionSpec

class ExpertRouter(nn.Module):
    def __init__(self, dim, num_experts, top_k=2):
        super().__init__()
        self.gate = nn.Linear(dim, num_experts, bias=False)
        self.top_k = top_k
        mark_sharding(self.gate.weight, mesh, PartitionSpec(None, "model"))

    def forward(self, x):
        logits = self.gate(x)  # (batch, seq, num_experts)
        gates, indices = torch.topk(torch.softmax(logits, dim=-1), self.top_k, dim=-1)
        return gates, indices
```

> See `references/model-architecture.md` for full MoE, custom FFN, LayerNorm, router patterns.

### 7. Attention Kernel Selection

Auto-detect and select explicitly. Priority: Splash (v3+) → Flash → SDPA. Never silently fall back.

```python
def get_attention_fn(tpu_type):
    if "v3" in tpu_type or "v4" in tpu_type or "v5" in tpu_type:
        try:
            from torch_xla.experimental.splash_attention import splash_attention
            return splash_attention
        except ImportError:
            pass
    try:
        from torch_xla.experimental.custom_kernel import flash_attention
        return flash_attention
    except ImportError:
        pass
    return torch.nn.functional.scaled_dot_product_attention

attention_fn = get_attention_fn(xm.get_tpu_env("TYPE", "v2-8"))
```

> See `references/attention.md` for kernel benchmarking and fallback rules.
> See `references/pallas-custom-kernels.md` for Splash Attention via Pallas.

### 8. Data Pipeline

Stream from `datasets`, shard across TPU cores, deterministic sampling.

```python
from datasets import load_dataset
from torch_xla import runtime as xr

def make_dataloader(name, split, batch_size, tokenizer, seed=42):
    ds = load_dataset(name, split=split, streaming=True)
    ds = ds.shuffle(seed=seed, buffer_size=10_000)
    ds = ds.shard(num_shards=xr.world_size(), index=xr.global_ordinal())

    def collate(examples):
        return tokenizer(
            [ex["text"] for ex in examples],
            padding="max_length", truncation=True,
            max_length=512, return_tensors="pt"
        )

    from torch.utils.data import IterableDataset, DataLoader

    class StreamDS(IterableDataset):
        def __iter__(self): yield from ds

    return DataLoader(StreamDS(), batch_size=batch_size, collate_fn=collate, drop_last=True)
```

> See `references/data-pipeline.md` for multi-epoch streaming, XLA-Trainer patterns, and JAX pipelines.

### 9. Optimizer Compatibility

SyncFree AdamW preferred on TPU (~20% faster). Raw instances only — no wrapper magic.

```python
# PT-XLA (SyncFree preferred)
from torch_xla.amp.syncfree import AdamW
optimizer = AdamW(model.parameters(), lr=1e-4, weight_decay=0.1)

# JAX / optax
import optax
transform = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adamw(learning_rate=1e-4, weight_decay=0.1),
)
opt_state = transform.init(params)
```

> See `references/optimizers.md` for LR schedules and custom state handling.

### 10. Compilation Optimization

Three tools: compilation cache, `@assume_pure`, `scan_layers`.

**Compilation cache** — persist HLO across restarts:

```python
import torch_xla.runtime as xr

xr.initialize_cache('/tmp/xla_cache', readonly=False)
# Multi-process: per-process path
# xr.initialize_cache(f'/tmp/xla_cache_{index}', readonly=False)
```

**`@assume_pure`** — skip re-tracing for pure functions:

```python
from torch_xla.experimental.assume_pure import assume_pure

@assume_pure
def do_math(a, b):
    return a @ b
```

**`scan_layers`** — compile homogeneous decoder stack once:

```python
from torch_xla.experimental.scan_layers import scan_layers

# Before: unrolled loop → N compilations
# After: single compilation
def forward(self, hidden):
    return scan_layers(self.layers, hidden, is_layer_pure=True)
```

> See `references/tracing-optimization.md` for benchmarks and AOTAutograd compatibility.
> See `references/compilation-cache.md` for shared mounts and cache invalidation.

### 11. `torch.compile` with OpenXLA

```python
# Inference (2-18x speedup)
compiled_model = torch.compile(model.eval(), backend='openxla')

# Training step (experimental)
compiled_step = torch.compile(train_step, backend='openxla')
```

> See `references/torchtpu.md` for Dynamo integration and performance benchmarks.

### 12. Eager Mode

Debugging only. Operations execute immediately — no lazy graph. Combine with `@assume_pure` for selective compilation.

```python
torch_xla.experimental.eager_mode(True)
# All XLA ops now execute immediately — step through like CPU/CUDA
```

### 13. wandb Logging on TPU

Master process only. Aggregate before logging.

```python
import wandb

if xm.is_master_ordinal():
    wandb.init(project="tpu-research", config=full_config)

# Aggregate across devices
loss = xm.all_reduce(xm.REDUCE_SUM, loss) / xr.world_size()

if xm.is_master_ordinal():
    wandb.log({"train/loss": loss.item(), "step": step})

# Checkpoint artifact
if xm.is_master_ordinal() and step % 1000 == 0:
    artifact = wandb.Artifact(f"ckpt-{step}", type="model")
    artifact.add_dir(checkpoint_dir)
    wandb.log_artifact(artifact)
```

> See `references/wandb-logging.md` for multi-host sync and artifact versioning.

### 14. Evaluation Loops

Sharded inference, aggregate across devices.

```python
@torch.no_grad()
def evaluate(model, eval_loader, step):
    model.eval()
    total_loss = total_tokens = 0.0
    for batch in eval_loader:
        loss, num_tokens = compute_eval_loss(model, batch)
        total_loss += loss * num_tokens
        total_tokens += num_tokens
    total_loss = xm.all_reduce(xm.REDUCE_SUM, total_loss)
    total_tokens = xm.all_reduce(xm.REDUCE_SUM, total_tokens)
    ppl = torch.exp(total_loss / total_tokens)
    if xm.is_master_ordinal():
        wandb.log({"eval/perplexity": ppl.item(), "step": step})
    model.train()
```

> See `references/evaluation.md` for perplexity, accuracy, BLEU, and JAX eval patterns.

### 15. Reproducible Ablations

Lock all RNGs. Version custom modules with string IDs. Log full config + git hash.

```python
import random, numpy as np, torch

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    xm.set_rng_state(seed)

config = {
    "seed": 42,
    "model": {"dim": 768, "num_layers": 12, "num_experts": 8, "top_k": 2,
               "router_type": "topk", "ffn_type": "swiglu", "ln_type": "rmsnorm"},
    "train": {"batch_size": 32, "lr": 1e-4, "steps": 100_000, "warmup_steps": 2000},
    "tpu": {"version": tpu_version, "num_devices": num_devices},
    "git_commit": subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip(),
}
```

> See `references/ablations.md` for full reproducibility checklist and config versioning.

### 16. Checkpointing

```python
import torch_xla.runtime as xr

# Save (master only for state_dict, xr.save for distributed)
if xm.is_master_ordinal():
    torch.save({
        "step": step,
        "model": model.state_dict(),
        "optimizer": optimizer.state_dict(),
        "config": config,
    }, f"ckpt_{step}.pt")

# Resume
ckpt = torch.load("ckpt_50000.pt", map_location='cpu')
model.load_state_dict(ckpt["model"])
optimizer.load_state_dict(ckpt["optimizer"])
start_step = ckpt["step"]
```

> See `references/fsdp-v2.md` for distributed checkpoint patterns with FSDPv2.

### 17. Tensor Manipulation with einops

Use `einops` for all reshaping and einsum on TPU. XLA fuses better than manual `view` + `permute`.

```python
from einops import rearrange, einsum

qkv = rearrange(x, 'b s (three h d) -> three b h s d', three=3, h=num_heads)
scores = einsum(q, k, 'b h i d, b h j d -> b h i j')
```

> See `references/einops.md` for JAX compatibility and MoE-specific patterns.

---

## Boundaries

- Does NOT handle hyperparameter search (use Optuna / Ray Tune separately)
- Does NOT optimize inference serving (training focus only)
- Does NOT design model architectures from scratch (provides patterns for common novel components)
- Does NOT replace framework documentation (provides TPU-specific integration patterns)

---

## Composability — Working With Other Skills

> **See `PROTOCOL.md` (SIP) at skills root for full interop contract.**

### Domain Declaration

```yaml
domain: process
composable: true
yields_to: [craft, voice]
```

ml-engine owns **process** (training workflow, distributed setup, evaluation loops) and **content** (ML substance: tensor ops, sharding, attention kernels, optimizer state).

### When ml-engine Leads

- Any distributed training setup on TPU
- Model architecture component implementation (MoE, router, FFN, LN)
- Data pipeline with `datasets` streaming and sharding
- Optimizer integration and custom state handling
- wandb logging aggregation on multi-host TPU
- Evaluation loop construction and metric computation
- Reproducibility guardrails for ablation studies
- FSDPv2 setup and sharding configuration
- Tracing optimization (`@assume_pure`, `scan_layers`, compilation caching)
- `torch.compile` with OpenXLA backend integration
- SPMD mesh and partition spec configuration
- Checkpoint save, resume, and distributed checkpoint patterns
- Training profiling and bottleneck identification

### When ml-engine Defers

| Other Skill's Domain | What ml-engine Does |
|---------------------|------------------------|
| **Voice** (e.g. blogger) | Preserves factual content about training setup; voice skill rewrites prose tone. ml-engine owns all code, config, and metric content. |
| **Craft** (e.g. painter) | Preserves training code and data pipeline; craft skill adds UI/visualization for dashboards, plots, or reports. ml-engine provides raw metrics. |
| **Density** (e.g. caveman, compress) | SKILL.md and reference files are source files — not compressible. Conversational explanations about ml-engine can be compressed. |

### Layered Composition Rules

1. **Process + Content**: ml-engine is both process and content. When another content skill provides domain knowledge (e.g., NLP research findings), ml-engine shapes it into training code and config.

2. **Process + Craft**: ml-engine generates training scripts and metric logs. Craft skill consumes metrics to build visual dashboards. Boundary: ml-engine stops at raw CSV/tensor outputs; craft starts at visualization.

3. **Process + Voice**: ml-engine writes technical config and code. Voice skill rewrites user-facing explanations. Boundary: code blocks and config dicts are voice-agnostic.

### Pipeline Behavior

- **Upstream** (receives output from another skill): If a research skill provides novel architecture ideas, ml-engine implements them as sharded modules with TPU-compatible attention.
- **Downstream** (output feeds into another skill): ml-engine outputs training scripts, config files, and metric logs. Downstream skills (craft, voice) consume these for reporting or visualization.

### Conflict Signal

If a voice or craft skill attempts to modify code structure or sharding logic:

> `⚠️ Process conflict: voice/craft skill is modifying training loop structure or sharding annotations. Code structure preserved; prose/visual style applied to surrounding explanations only.`
