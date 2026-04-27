# ml-engine v3.0.0

TPU-first ML research engine for reproducible distributed training and ablation studies.

## What It Does

Builds training pipelines on TPU using PyTorch-XLA (primary) and JAX/torchax (secondary). Covers everything from single-device v2-8 to multi-pod v4-128, with modern `torch_xla` APIs, FSDPv2, SPMD, tracing optimization, and compilation caching.

## Structure

```
ml-engine/
├── SKILL.md                          # Core instruction set (this skill's brain)
├── README.md                         # This file
├── references/                       # Deep-dive docs loaded on demand
│   ├── ablations.md                  # Reproducible ablation checklist
│   ├── attention.md                  # Splash/Flash/SDPA kernel selection
│   ├── compilation-cache.md          # xr.initialize_cache() patterns
│   ├── data-pipeline.md              # datasets streaming + sharding
│   ├── dual-framework.md             # PT-XLA + JAX interop via DLPack
│   ├── einops.md                     # Tensor manipulation on TPU
│   ├── evaluation.md                 # Online/offline eval loops
│   ├── fsdp-v2.md                    # SpmdFullyShardedDataParallel
│   ├── model-architecture.md        # MoE, router, custom FFN/LN
│   ├── multi-pod-training.md         # v3-32, v3-64, v4-128+
│   ├── optimizers.md                 # torch.optim + optax + SyncFree
│   ├── pallas-custom-kernels.md      # call_jax + custom_op patterns
│   ├── spmd.md                       # SPMD mesh, partition specs
│   ├── torchax.md                    # PyTorch frontend for JAX
│   ├── torchtpu.md                   # Modern torch_xla runtime (PJRT)
│   ├── tpu-setup.md                  # Device detection + mesh init
│   ├── tracing-optimization.md       # @assume_pure, scan_layers, scan
│   ├── training-loop-patterns.md     # 6 training loop patterns + API migration
│   └── wandb-logging.md             # Multi-host wandb patterns
└── examples/                         # Real-world usage examples
    ├── dual_framework_example.md     # PT-XLA + JAX single-host training
    ├── fsdp_spmd_training.md         # FSDPv2 + SPMD data parallel
    ├── multi_process_ddp_training.md # DDP + XLA backend
    ├── single_device_training.md     # v2-8/v3-8 single process
    ├── torchax_example.md            # PyTorch-on-JAX patterns
    └── tracing_optimization_examples.md  # @assume_pure, scan_layers, scan
```

## Commands

### `/ml` — Godmode Research Scaffold

Full research scaffold in one command. Runs the full cycle: analyze → plan → implement → verify. Use for greenfield research ideas.

```
/ml [research idea]
```

**What it produces:**
1. Research hypothesis + experiment matrix
2. Mesh setup for target TPU (auto-detected)
3. Training script with correct strategy (SPMD/FSDPv2/DDP)
4. Data pipeline (streaming + sharding)
5. Attention kernel selection
6. wandb config + logging hooks
7. Eval loop + metrics
8. Reproducibility seed lock + config dict
9. Ablation matrix if multiple variables detected
10. Pallas optimization plan if bottleneck detected

Examples:
- `/ml "sparse MoE with dynamic clamping"` — full MoE research scaffold
- `/ml "scan_layers vs unrolled on v3-64"` — comparison experiment scaffold

---

### `/ml-train` — Generate Training Script

Generate a complete training script for the specified configuration.

```
/ml-train [model] [tpu] [strategy]
```

| Param | Options | Default |
|-------|---------|---------|
| model | `decoder`, `moe`, `encoder-decoder` | `decoder` |
| tpu | `v2-8`, `v3-8`, `v3-64`, `v4-128` | `v2-8` |
| strategy | `single`, `ddp`, `fsdp`, `spmd` | `single` |

Examples:
- `/ml-train moe v3-8 fsdp` — MoE model on v3-8 with FSDPv2
- `/ml-train decoder v2-8 single` — Decoder on v2-8 single process
- `/ml-train decoder v3-64 spmd` — Decoder on v3-64 with SPMD

### `/ml-mesh` — Generate Mesh Setup

Generate mesh initialization code for the specified TPU topology.

```
/ml-mesh [tpu] [parallelism]
```

| Param | Options | Default |
|-------|---------|---------|
| tpu | `v2-8`, `v3-8`, `v3-32`, `v3-64`, `v4-128` | `v2-8` |
| parallelism | `1d-data`, `2d-data-model`, `fsdp` | `1d-data` |

Examples:
- `/ml-mesh v3-64 2d-data-model` — 2D mesh for v3-64
- `/ml-mesh v2-8 fsdp` — FSDP mesh for v2-8

### `/ml-debug` — Debug XLA Training

Debug compilation, tracing, or performance issues.

```
/ml-debug [issue]
```

| Issue | What It Checks |
|-------|---------------|
| `recompilation` | Dynamic shapes, missing compilation cache |
| `slow-trace` | Missing `@assume_pure`, unrolled loops vs `scan_layers` |
| `oom` | Sharding mismatches, gradient checkpointing |
| `sync-hang` | Barrier mismatches, multi-host coordination |
| `eager` | Switch to eager mode for step-by-step debugging |

Examples:
- `/ml-debug recompilation` — Diagnose why XLA recompiles every step
- `/ml-debug oom` — Find memory issues on TPU
- `/ml-debug eager` — Enable eager mode for debugging

### `/ml-benchmark` — Benchmark Attention Kernel

Select and benchmark attention kernel for current TPU.

```
/ml-benchmark [kernel] [seq-len]
```

| Kernel | Notes |
|--------|-------|
| `splash` | TPU v3+ only, most efficient |
| `flash` | All TPUs, custom kernel |
| `sdpa` | Universal fallback |
| `auto` | Auto-detect best available (default) |

Examples:
- `/ml-benchmark auto 2048` — Auto-select kernel, 2048 seq len
- `/ml-benchmark splash 4096` — Benchmark Splash at 4096

### `/ml-migrate` — Migrate Old API to Modern

Convert legacy `torch_xla` code to modern APIs.

```
/ml-migrate [file-or-code]
```

Replaces:
| Old | New |
|-----|-----|
| `xm.xla_device()` | `torch_xla.device()` |
| `xm.mark_step()` | `torch_xla.sync()` or `torch_xla.step()` |
| `xmp.spawn()` | `torch_xla.launch()` |
| `ParallelLoader()` | `pl.MpDeviceLoader()` |
| `.to(xm.xla_device())` | `.to('xla')` |

### `/ml-port` — Port PyTorch to torch_xla Native

Port native PyTorch code to torch_xla with native XLA graph support. Transforms CPU/CUDA code into XLA-compatible patterns that leverage lazy tensor tracing, `torch_xla.step()`, `torch_xla.compile()`, and SPMD sharding — producing code that natively constructs and executes XLA graphs.

```
/ml-port [file-or-code] [mode]
```

| Mode | What It Does |
|------|-------------|
| `native` | Full port: device placement, step boundaries, compilation, sharding. Output runs natively on XLA graphs. |
| `compile` | Wrap with `torch.compile(backend='openxla')` — minimal changes, Dynamo handles graph capture. Good for inference. |
| `hybrid` | PT-XLA training loop + `torch.compile` for hot paths. Best of both: training stability + compiled speedup. |
| `eager` | Port device placement only, enable eager mode. For debugging before full native port. |

**What `/ml-port native` transforms:**

| PyTorch Pattern | torch_xla Native Pattern |
|----------------|------------------------|
| `.to('cuda')` / `.to('cpu')` | `.to('xla')` |
| Raw training loop | `with torch_xla.step():` context manager |
| `loss.backward(); optimizer.step()` | `loss.backward(); xm.optimizer_step(optimizer)` (multi-process) or `optimizer.step()` + `torch_xla.sync()` |
| `DataLoader(...)` | `pl.MpDeviceLoader(loader, device, input_sharding=...)` (SPMD) |
| `torch.save(model.state_dict(), ...)` | `xr.save(model.state_dict(), ...)` or distributed checkpoint |
| No compilation | `torch_xla.compile(step_fn, full_graph=True)` for stable graphs |
| No sharding | `mark_sharding(tensor, mesh, PartitionSpec(...))` for SPMD |

Examples:
- `/ml-port train.py native` — Full native XLA graph port
- `/ml-port model.py compile` — Wrap with torch.compile openxla backend
- `/ml-port train.py hybrid` — PT-XLA loop + compiled step function
- `/ml-port model.py eager` — Device placement + eager mode for debugging

### `/ml-optimize` — Optimize XLA Bottleneck

Analyze a specific object (module, function, operation) and optimize it for XLA/TPU. Two approaches: use existing XLA-optimized primitives, or write a custom Pallas kernel for operations that are XLA pain points.

```
/ml-optimize [object] [method]
```

| Method | What It Does |
|--------|-------------|
| `xla` | Rewrite using existing XLA-optimized primitives: `@assume_pure`, `scan_layers`, `torch_xla.compile`, `MpDeviceLoader`, `mark_sharding`, `torch.compile(backend='openxla')`. No custom kernels. |
| `pallas` | Write a custom Pallas kernel via `call_jax` + `jax.pallas` for operations that are XLA pain points (dynamic indexing, scatter/gather, custom routing, irregular memory access). |
| `auto` | Analyze the object, identify the bottleneck type, and pick the best method automatically. |

**XLA Pain Points → Pallas Solutions:**

| Pain Point | Why XLA Struggles | Pallas Solution |
|-----------|------------------|----------------|
| Dynamic indexing (`torch.gather`, `torch.scatter` with data-dependent indices) | XLA can't fuse dynamic gather/scatter into efficient HLO | Custom Pallas kernel with `pl.load` / `pl.store` and VMEM tiling |
| MoE token dispatch (top-k routing with variable expert counts) | Irregular memory access pattern, can't express as static HLO | Pallas dispatch kernel with expert-aligned VMEM layout |
| Custom routing loss (differentiable top-k, load balancing) | Complex control flow + reduction, XLA recompiles per shape | Pallas kernel with `pl.idmap` and pipelined reductions |
| Token padding/unpadding for sharded attention | Dynamic slice sizes cause recompilation | Pallas pad/unpad with fixed VMEM tiles |
| Non-uniform reduction (e.g., per-expert gradient accumulation) | Irregular reduction dimensions, XLA generates inefficient while loops | Pallas reduction with explicit SRAM/VMEM buffering |

**Existing XLA Optimization Primitives:**

| Primitive | When to Use |
|-----------|------------|
| `@assume_pure` | Function is side-effect-free, same shapes every call → skip re-tracing |
| `scan_layers` | Homogeneous decoder layers → compile once instead of N times |
| `scan` | Cumulative computation (running mean, cumulative sum) → single XLA while loop |
| `torch_xla.compile()` | Stable step function → persistent compiled binary |
| `mark_sharding()` | Tensor has known parallelism pattern → SPMD auto-partitions |
| `torch.compile(backend='openxla')` | Inference or stable fwd pass → Dynamo captures graph |
| `xr.initialize_cache()` | Same HLO across runs → skip recompilation on restart |

Examples:
- `/ml-optimize router auto` — Analyze MoE router, pick best optimization
- `/ml-optimize expert_dispatch pallas` — Write custom Pallas dispatch kernel
- `/ml-optimize decoder_layers xla` — Apply `scan_layers` + `@assume_pure`
- `/ml-optimize attention pallas` — Custom Pallas attention for irregular access
- `/ml-optimize step_fn xla` — Compile step function + compilation cache

### `/ml-ablate` — Run Ablation Matrix

Generate an ablation matrix for a single variable across a range of values. Produces config files, run scripts, and a results aggregation template.

```
/ml-ablate [variable] [values] [metric]
```

| Param | Notes |
|-------|-------|
| `variable` | Config key to sweep (e.g. `top_k`, `num_experts`, `lr`) |
| `values` | Comma-separated list (e.g. `"1,2,4"`) or range (e.g. `"1:8:2"`) |
| `metric` | Primary metric to compare (default: `perplexity`) |

Examples:
- `/ml-ablate top_k "1,2,4"` — sweep top-k routing, compare perplexity
- `/ml-ablate num_experts "8,16,32,64" expert_utilization` — expert count sweep
- `/ml-ablate lr "1e-5:1e-3:5" loss` — LR sweep, 5 log-spaced values

---

### `/ml-checkpoint` — Save / Resume / Inspect Checkpoint

Manage training checkpoints: save state, resume from checkpoint, or inspect what's inside.

```
/ml-checkpoint [action] [path]
```

| Action | What It Does |
|--------|-------------|
| `save` | Generate checkpoint save code (state_dict + config + step) |
| `resume` | Generate checkpoint resume code + step recovery |
| `inspect` | Print checkpoint contents (keys, shapes, step, config) |
| `distributed` | FSDPv2-compatible distributed checkpoint patterns |

Examples:
- `/ml-checkpoint save ./ckpts` — checkpoint save code for path
- `/ml-checkpoint resume ./ckpt_50000.pt` — resume from specific checkpoint
- `/ml-checkpoint inspect ./ckpt_50000.pt` — show what's in the file
- `/ml-checkpoint distributed ./ckpts` — FSDPv2 distributed checkpoint

---

### `/ml-profile` — Profile Training Bottleneck

Profile a training step or function to identify XLA compilation, data loading, or compute bottlenecks. Uses XLA profiler + chrome trace format.

```
/ml-profile [target] [steps]
```

| Target | What It Profiles |
|--------|------------------|
| `step_fn` | Full training step (forward + backward + optimizer) |
| `data` | Data loading + preprocessing pipeline |
| `model` | Model forward pass only |
| `attention` | Attention kernel specifically |
| `router` | MoE router dispatch + gather |

Examples:
- `/ml-profile step_fn 100` — profile 100 training steps, output chrome trace
- `/ml-profile data 50` — profile data pipeline for 50 batches
- `/ml-profile attention 20` — attention kernel profiling

---

### `/ml-plan` — Plan & Template Research

Plan and template a research idea into an executable ml-engine project. Takes a research idea/question and produces a structured plan with experiment templates, ablation matrix, compute budget, and training script scaffolding.

```
/ml-plan [idea] [scope]
```

| Scope | What It Produces |
|-------|-----------------|
| `full` | Complete research plan: hypothesis, experiment matrix, ablation checklist, compute budget, training script template, evaluation plan, wandb config, timeline. |
| `experiment` | Single experiment template: config dict, training script skeleton, evaluation metrics, expected compute. |
| `ablation` | Ablation matrix: variables to sweep, fixed baseline, reproducibility checklist, statistical significance plan. |
| `compute` | Compute budget only: FLOPs estimate, TPU hours, memory projection, optimal parallelism strategy. |
| `template` | Bare template files only: `config.yaml`, `train.py` skeleton, `eval.py` skeleton, `ablations.yaml`. No planning. |

**Plan Structure (scope=full):**

```yaml
research_plan:
  hypothesis: "Sparse MoE with top-2 routing + load balancing loss improves perplexity/FLOP vs dense baseline"
  baseline:
    model: "7B dense decoder"
    compute: "v3-8, 100K steps, batch=32, seq=2048"
  experiments:
    - id: exp_001
      name: "top2_router_lb"
      variables: { num_experts: [8, 16, 32], top_k: [1, 2], lb_loss_weight: [0.01, 0.1] }
      fixed: { dim: 4096, num_layers: 32, lr: 1e-4 }
      compute_budget: "v3-8 × 50K steps per config"
    - id: exp_002
      name: "expert_capacity_pallas"
      variables: { capacity_factor: [0.5, 1.0, 1.5] }
      custom_kernel: "pallas expert dispatch"
  ablation_matrix:
    - variable: num_experts
      values: [8, 16, 32, 64]
      metric: perplexity + expert_utilization
    - variable: router_type
      values: [topk, hash, switch]
      metric: perplexity + load_balance_score
  evaluation:
    primary: [perplexity, tokens/sec]
    secondary: [expert_utilization, routing_entropy, grad_norm_stability]
  reproducibility:
    seed_lock: true
    config_hash: true
    git_version: true
    deterministic_data: true
```

Examples:
- `/ml-plan "sparse MoE with load balancing" full` — Complete research plan
- `/ml-plan "scan_layers vs unrolled" experiment` — Single experiment template
- `/ml-plan "expert count sweep" ablation` — Ablation matrix only
- `/ml-plan "7B MoE on v3-64" compute` — Compute budget + parallelism strategy
- `/ml-plan "custom routing" template` — Bare file templates

## Quick Reference — Modern API

```python
import torch_xla

# Device
device = torch_xla.device()

# Step boundary (replaces xm.mark_step)
with torch_xla.step():
    ...
torch_xla.sync()  # standalone sync

# Multi-process (replaces xmp.spawn)
torch_xla.launch(_mp_fn, args=())

# Compilation
compiled = torch_xla.compile(step_fn, full_graph=True)

# Compilation cache
import torch_xla.runtime as xr
xr.initialize_cache('/tmp/xla_cache', readonly=False)

# Eager mode (debugging)
torch_xla.experimental.eager_mode(True)
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2026-04 | `/ml` godmode scaffold, `/ml-ablate` (ablation matrix), `/ml-checkpoint` (save/resume/inspect), `/ml-profile` (XLA profiler). Resolved SKILL.md merge conflict, checkpoint section added as core instruction #16. |
| 2.1.0 | 2025-07 | `/ml-port` (PyTorch → XLA native), `/ml-optimize` (XLA bottleneck + Pallas kernels), `/ml-plan` (research planning & templating) |
| 2.0.0 | 2025-07 | Modern `torch_xla` APIs, FSDPv2, SPMD, `@assume_pure`, `scan_layers`, `torchax`, compilation cache, eager mode, `torch.compile` openxla |
| 1.0.0 | 2024-12 | Initial release: TPU setup, MoE, attention kernels, data pipeline, wandb, evaluation |
