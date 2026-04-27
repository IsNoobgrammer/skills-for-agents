# Compilation Caching

## Overview

XLA compilation converts traced HLO into device executables. Compilation is time-consuming. When HLO doesn't change across executions, persist compilation results to disk for reuse.

## Setup

```python
import torch_xla.runtime as xr

# Initialize before any computation
xr.initialize_cache('/tmp/xla_cache', readonly=False)
```

## Multi-Process Caching

Each process needs a unique cache path:

```python
def _mp_fn(index):
    xr.initialize_cache(f'/tmp/xla_cache_{index}', readonly=False)
    # ... training loop

if __name__ == '__main__':
    torch_xla.launch(_mp_fn, args=())
```

Or use `xr.global_ordinal()` if `index` is unavailable:

```python
def _mp_fn(index):
    xr.initialize_cache(f'/tmp/xla_cache_{xr.global_ordinal()}', readonly=False)
```

## Shared Cache for SPMD

For SPMD workloads with shared cache mount, use `readonly` to control write access:

```python
# Writer worker
xr.initialize_cache('/shared/xla_cache', readonly=False)

# Read-only workers (e.g., other SPMD replicas)
xr.initialize_cache('/shared/xla_cache', readonly=True)
```

## Cache Invalidation

- HLO changes between executions → recompilation occurs
- `torch_xla` version changes → recompilation occurs (generates new executables)
- Cache is tied to the XLA compiler version — upgrading `torch_xla` invalidates cache

## When to Use

| Scenario | Cache? |
|----------|--------|
| Development iteration (same model, repeated runs) | Yes — significant speedup |
| Production training (fixed model, long runs) | Optional — first compile amortizes |
| Multi-host with shared NFS | Yes — one writer, readonly for others |
| Dynamic shapes (varying input sizes) | Limited — each shape triggers new compile |

## Anti-Patterns

- Don't share a writable cache between processes — use unique paths per process
- Don't assume cache survives `torch_xla` upgrades — version mismatch forces recompile
- Don't use readonly=True on the writer process — compilation will fail
