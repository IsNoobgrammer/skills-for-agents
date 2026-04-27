<<<<<<< S:/AntiGravity_Skills/ml-engine/references/attention.md
# Attention Kernels — Splash, Flash, SDPA on TPU

## Kernel Selection Decision Tree

```
TPU v3+ with Splash available?
  YES → Use Splash Attention (fastest, most memory efficient)
  NO  → TPU v2 or Splash unavailable?
          YES → Try Flash Attention (custom kernel)
          NO  → Fallback to SDPA (always works, explicit choice)
```

## Explicit Selection Code

```python
import torch
import torch_xla.core.xla_model as xm
import importlib

def select_attention_kernel(tpu_type: str):
    """Returns attention function and kernel name. Never silent fallback."""

    # Priority 1: Splash Attention (TPU v3+)
    if any(v in tpu_type for v in ["v3", "v4", "v5"]):
        try:
            splash_mod = importlib.import_module("torch_xla.experimental.splash_attention")
            return splash_mod.splash_attention, "splash"
        except (ImportError, AttributeError):
            print(f"[WARN] Splash Attention not available on {tpu_type}, trying Flash")

    # Priority 2: Flash Attention (all TPUs, custom kernel)
    try:
        from torch_xla.experimental.custom_kernel import flash_attention
        return flash_attention, "flash"
    except ImportError:
        print(f"[WARN] Flash Attention not available, using SDPA")

    # Priority 3: SDPA (explicit fallback)
    return torch.nn.functional.scaled_dot_product_attention, "sdpa"

# Usage
tpu_type = xm.get_tpu_env("TYPE", "v2-8")
attn_fn, kernel_name = select_attention_kernel(tpu_type)
print(f"[INFO] Using attention kernel: {kernel_name}")
```

## Attention Wrapper with Sharding

```python
class TPUAttention(nn.Module):
    def __init__(self, dim, num_heads, kernel_name="sdpa"):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = dim // num_heads
        self.qkv = nn.Linear(dim, 3 * dim, bias=False)
        self.out = nn.Linear(dim, dim, bias=False)
        self.kernel_name = kernel_name

    def forward(self, x, attn_fn):
        b, s, d = x.shape
        qkv = self.qkv(x).reshape(b, s, 3, self.num_heads, self.head_dim)
        q, k, v = qkv.unbind(dim=2)

        # (b, h, s, d)
        q = q.transpose(1, 2)
        k = k.transpose(1, 2)
        v = v.transpose(1, 2)

        if self.kernel_name == "sdpa":
            out = attn_fn(q, k, v, is_causal=True)
        else:
            # Splash/Flash have custom signatures
            out = attn_fn(q, k, v)

        out = out.transpose(1, 2).reshape(b, s, d)
        return self.out(out)
```

## Memory Comparison

| Kernel | v2-8 Peak HBM | v3-8 Peak HBM | Notes |
|--------|---------------|---------------|-------|
| SDPA (naive) | ~16GB | ~32GB | Materializes full (s,s) score matrix |
| Flash | ~4GB | ~8GB | Tiling + fused softmax |
| Splash | ~2GB | ~4GB | Pallas-based, most efficient |

## Benchmarking on Your TPU

```python
import time

def benchmark_attention(attn_fn, q, k, v, warmup=5, iters=20):
    for _ in range(warmup):
        out = attn_fn(q, k, v)
        xm.mark_step()

    start = time.perf_counter()
    for _ in range(iters):
        out = attn_fn(q, k, v)
        xm.mark_step()
    end = time.perf_counter()

    return (end - start) / iters
```

## Splash Attention via `call_jax` (PyTorch-XLA + JAX Pallas)

Splash Attention is a JAX Pallas kernel callable from PyTorch-XLA via `call_jax`.

```python
import torch
from torch_xla.core.xla_builder import call_jax
from torch_xla.distributed.spmd import Mesh

def splash_attention_call_jax(q, k, v, causal=True, mesh=None):
    """Call JAX Splash Attention kernel from PyTorch via call_jax."""
    import jax
    from jax.experimental.pallas.ops.tpu.splash_attention import (
        splash_attention_kernel,
        splash_attention_mask,
    )
    from jax.experimental import shard_map

    # JAX mesh from torch_xla mesh
    jax_mesh = mesh.get_jax_mesh() if mesh else None

    @functools.partial(
        shard_map.shard_map,
        mesh=jax_mesh,
        in_specs=(axis_names, axis_names, axis_names),
        out_specs=axis_names,
        check_rep=False,
    )
    def _splash_fwd(query, key, value):
        seq_len = query.shape[2]
        mask = splash_attention_mask.CausalMask(shape=(seq_len, seq_len))
        multi_head_mask = splash_attention_mask.MultiHeadMask(
            masks=(mask,) * query.shape[1]
        )
        splash_kernel = splash_attention_kernel.make_splash_mha(
            mask=multi_head_mask,
            head_shards=1,
            q_seq_shards=1,
        )
        return jax.vmap(splash_kernel)(query, key, value)

    # call_jax bridges PyTorch tensors -> JAX arrays -> PyTorch tensors
    return call_jax(_splash_fwd, [q, k, v], {}, "splash_attention")
```

> See `references/pallas-custom-kernels.md` for full `call_jax` + `custom_op` pattern.

## JAX Attention (Pure JAX)

```python
import jax
import jax.numpy as jnp
from jax.experimental.pallas import flash_attention as jax_flash

def jax_attention(q, k, v):
    # JAX SDPA
    return jax.nn.dot_product_attention(q, k, v, is_causal=True)

# Flash via Pallas (TPU)
def jax_flash_attention(q, k, v):
    return jax_flash(q, k, v, causal=True)
```

## Anti-Patterns

- **Never silently fallback**: Always log which kernel is active
- Don't call `attn_fn` with different `is_causal` per batch — XLA recompiles
- Don't mix attention kernels in the same model — pick one and stick with it
- Splash attention may require specific TPU software versions; check `torch_xla` version
=======
# Attention Kernels — Splash, Flash, SDPA on TPU

## Kernel Selection Decision Tree

```
TPU v3+ with Splash available?
  YES → Use Splash Attention (fastest, most memory efficient)
  NO  → TPU v2 or Splash unavailable?
          YES → Try Flash Attention (custom kernel)
          NO  → Fallback to SDPA (always works, explicit choice)
```

## Explicit Selection Code

```python
import torch
import torch_xla.core.xla_model as xm
import importlib

def select_attention_kernel(tpu_type: str):
    """Returns attention function and kernel name. Never silent fallback."""

    # Priority 1: Splash Attention (TPU v3+)
    if any(v in tpu_type for v in ["v3", "v4", "v5"]):
        try:
            splash_mod = importlib.import_module("torch_xla.experimental.splash_attention")
            return splash_mod.splash_attention, "splash"
        except (ImportError, AttributeError):
            print(f"[WARN] Splash Attention not available on {tpu_type}, trying Flash")

    # Priority 2: Flash Attention (all TPUs, custom kernel)
    try:
        from torch_xla.experimental.custom_kernel import flash_attention
        return flash_attention, "flash"
    except ImportError:
        print(f"[WARN] Flash Attention not available, using SDPA")

    # Priority 3: SDPA (explicit fallback)
    return torch.nn.functional.scaled_dot_product_attention, "sdpa"

# Usage
tpu_type = xm.get_tpu_env("TYPE", "v2-8")
attn_fn, kernel_name = select_attention_kernel(tpu_type)
print(f"[INFO] Using attention kernel: {kernel_name}")
```

## Attention Wrapper with Sharding

```python
class TPUAttention(nn.Module):
    def __init__(self, dim, num_heads, kernel_name="sdpa"):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = dim // num_heads
        self.qkv = nn.Linear(dim, 3 * dim, bias=False)
        self.out = nn.Linear(dim, dim, bias=False)
        self.kernel_name = kernel_name

    def forward(self, x, attn_fn):
        b, s, d = x.shape
        qkv = self.qkv(x).reshape(b, s, 3, self.num_heads, self.head_dim)
        q, k, v = qkv.unbind(dim=2)

        # (b, h, s, d)
        q = q.transpose(1, 2)
        k = k.transpose(1, 2)
        v = v.transpose(1, 2)

        if self.kernel_name == "sdpa":
            out = attn_fn(q, k, v, is_causal=True)
        else:
            # Splash/Flash have custom signatures
            out = attn_fn(q, k, v)

        out = out.transpose(1, 2).reshape(b, s, d)
        return self.out(out)
```

## Memory Comparison

| Kernel | v2-8 Peak HBM | v3-8 Peak HBM | Notes |
|--------|---------------|---------------|-------|
| SDPA (naive) | ~16GB | ~32GB | Materializes full (s,s) score matrix |
| Flash | ~4GB | ~8GB | Tiling + fused softmax |
| Splash | ~2GB | ~4GB | Pallas-based, most efficient |

## Benchmarking on Your TPU

```python
import time
import torch_xla

def benchmark_attention(attn_fn, q, k, v, warmup=5, iters=20):
    for _ in range(warmup):
        out = attn_fn(q, k, v)
        torch_xla.sync()

    start = time.perf_counter()
    for _ in range(iters):
        out = attn_fn(q, k, v)
        torch_xla.sync()
    end = time.perf_counter()

    return (end - start) / iters
```

## Splash Attention via `call_jax` (PyTorch-XLA + JAX Pallas)

Splash Attention is a JAX Pallas kernel callable from PyTorch-XLA via `call_jax`.

```python
import torch
from torch_xla.core.xla_builder import call_jax
from torch_xla.distributed.spmd import Mesh

def splash_attention_call_jax(q, k, v, causal=True, mesh=None):
    """Call JAX Splash Attention kernel from PyTorch via call_jax."""
    import jax
    from jax.experimental.pallas.ops.tpu.splash_attention import (
        splash_attention_kernel,
        splash_attention_mask,
    )
    from jax.experimental import shard_map

    # JAX mesh from torch_xla mesh
    jax_mesh = mesh.get_jax_mesh() if mesh else None

    @functools.partial(
        shard_map.shard_map,
        mesh=jax_mesh,
        in_specs=(axis_names, axis_names, axis_names),
        out_specs=axis_names,
        check_rep=False,
    )
    def _splash_fwd(query, key, value):
        seq_len = query.shape[2]
        mask = splash_attention_mask.CausalMask(shape=(seq_len, seq_len))
        multi_head_mask = splash_attention_mask.MultiHeadMask(
            masks=(mask,) * query.shape[1]
        )
        splash_kernel = splash_attention_kernel.make_splash_mha(
            mask=multi_head_mask,
            head_shards=1,
            q_seq_shards=1,
        )
        return jax.vmap(splash_kernel)(query, key, value)

    # call_jax bridges PyTorch tensors -> JAX arrays -> PyTorch tensors
    return call_jax(_splash_fwd, [q, k, v], {}, "splash_attention")
```

> See `references/pallas-custom-kernels.md` for full `call_jax` + `custom_op` pattern.

## JAX Attention (Pure JAX)

```python
import jax
import jax.numpy as jnp
from jax.experimental.pallas import flash_attention as jax_flash

def jax_attention(q, k, v):
    # JAX SDPA
    return jax.nn.dot_product_attention(q, k, v, is_causal=True)

# Flash via Pallas (TPU)
def jax_flash_attention(q, k, v):
    return jax_flash(q, k, v, causal=True)
```

## Anti-Patterns

- **Never silently fallback**: Always log which kernel is active
- Don't call `attn_fn` with different `is_causal` per batch — XLA recompiles
- Don't mix attention kernels in the same model — pick one and stick with it
- Splash attention may require specific TPU software versions; check `torch_xla` version
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/attention.md
