# einops for TPU and JAX

## Library

- GitHub: https://github.com/arogozhnikov/einops
- Docs: https://einops.rocks/

## Core Philosophy

`einops` provides human-readable tensor operations that are backend-agnostic. On TPU:
- XLA fuses `rearrange` better than manual `view` + `permute` chains
- `einsum` is compiled to optimized XLA HLO
- Same code works for PyTorch, JAX, TensorFlow

## Rearrange

### Multi-Head Attention Split/Merge

```python
from einops import rearrange

# (batch, seq, dim) -> (batch, seq, heads, head_dim)
qkv = rearrange(x, 'b s (three h d) -> three b h s d', three=3, h=12)
q, k, v = qkv[0], qkv[1], qkv[2]

# Merge back: (batch, heads, seq, head_dim) -> (batch, seq, dim)
out = rearrange(attn_out, 'b h s d -> b s (h d)')
```

### Patch Embedding (Vision)

```python
# Image: (batch, channels, height, width) -> (batch, patches, patch_dim)
patches = rearrange(img, 'b c (h p1) (w p2) -> b (h w) (p1 p2 c)', p1=16, p2=16)
```

### Sliding Window

```python
# (batch, seq, dim) -> (batch, windows, window_size, dim)
windows = rearrange(x, 'b (w k) d -> b w k d', k=window_size)
```

## Einsum

### Batch Matrix Multiply (Attention Scores)

```python
from einops import einsum

# (batch, heads, q_seq, head_dim) @ (batch, heads, kv_seq, head_dim) -> (batch, heads, q_seq, kv_seq)
scores = einsum(q, k, 'b h i d, b h j d -> b h i j')

# Apply attention weights to values
# (batch, heads, q_seq, kv_seq) @ (batch, heads, kv_seq, head_dim) -> (batch, heads, q_seq, head_dim)
out = einsum(scores, v, 'b h i j, b h j d -> b h i d')
```

### Router Gate Computation

```python
# (batch, seq, dim) @ (dim, num_experts) -> (batch, seq, num_experts)
gates = einsum(x, gate_weights, 'b s d, d e -> b s e')
```

### Layer-wise Statistics

```python
# Mean across sequence: (batch, seq, dim) -> (batch, dim)
mean_pooled = einsum(x, 'b s d -> b d')

# Sum across heads: (batch, seq, heads, dim) -> (batch, seq, dim)
head_sum = einsum(x, 'b s h d -> b s d')
```

## Reduce

```python
from einops import reduce

# Mean pool across sequence
# (batch, seq, dim) -> (batch, dim)
pooled = reduce(x, 'b s d -> b d', 'mean')

# Max pool across heads
# (batch, seq, heads, dim) -> (batch, seq, dim)
max_pooled = reduce(x, 'b s h d -> b s d', 'max')

# Sum pool across experts (MoE combine)
# (batch, seq, num_experts, dim) -> (batch, seq, dim)
combined = reduce(expert_outputs * gate_values, 'b s e d -> b s d', 'sum')
```

## Repeat

```python
from einops import repeat

# Repeat along new axis
# (batch, dim) -> (batch, seq, dim)
expanded = repeat(x, 'b d -> b s d', s=seq_len)

# Tile for expert replication
# (batch, seq, dim) -> (batch, seq, num_experts, dim)
tiled = repeat(x, 'b s d -> b s e d', e=num_experts)
```

## JAX Compatibility

```python
import jax.numpy as jnp
from einops import rearrange, einsum, reduce

# JAX arrays work transparently — einops dispatches to correct backend
x = jnp.ones((2, 16, 64))
out = rearrange(x, 'b (h w) c -> b h w c', h=4)

# JAX + vmap
from jax import vmap

batched_rearrange = vmap(lambda img: rearrange(img, 'c (h p1) (w p2) -> (h w) (p1 p2 c)', p1=16, p2=16))
```

## TPU/XLA-Specific Patterns

### Prefer `rearrange` over `view` + `permute`

```python
# BAD: XLA may not fuse
x = x.view(batch, seq, heads, dim).permute(0, 2, 1, 3)

# GOOD: XLA fuses into single HLO op
x = rearrange(x, 'b s h d -> b h s d')
```

### `einsum` for Fused Operations

```python
# Compute attention in one einsum chain
# QK^T @ V = einsum(Q, K, V) — XLA can fuse matmul + softmax + matmul
out = einsum(q, k, v, 'b h i d, b h j d, b h j e -> b h i e')
# Note: For attention, use explicit kernel (Flash/Splash) — einsum materializes full score matrix
```

## Anti-Patterns

- Don't chain `rearrange` calls: `rearrange(rearrange(x, ...), ...)` — compose into single expression
- Don't use dynamic shapes inside `rearrange` — XLA recompiles on shape change
- Don't use `einops` with `torch.compile(dynamic=True)` — may break shape inference
- For JAX: don't mix `einops` with `jax.lax` inside `jit` without testing — some ops may not lower
