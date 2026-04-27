# Pallas Custom Kernels on TPU

## Install

```bash
pip install torch_xla[pallas] -f https://storage.googleapis.com/jax-releases/jax_nightly_releases.html -f https://storage.googleapis.com/jax-releases/jaxlib_nightly_releases.html
```

## Core Concepts

TPU has two memory spaces: VMEM (vector memory, 16 MiB per core) and SMEM (scalar memory). Pallas kernels operate on blocks that fit in VMEM. HBM (high-bandwidth memory) holds full tensors. Kernel = load block from HBM to VMEM, compute, store back to HBM.

## Hello World: Vector Add

```python
import jax
import jax.numpy as jnp
from jax.experimental import pallas as pl
from jax.experimental.pallas import tpu as pltpu

def add_kernel(x_ref, y_ref, o_ref):
    """Load from VMEM refs, add, store back."""
    x = x_ref[...]
    y = y_ref[...]
    o_ref[...] = x + y

@jax.jit
def add_vectors(x: jax.Array, y: jax.Array) -> jax.Array:
    return pl.pallas_call(
        add_kernel,
        out_shape=jax.ShapeDtypeStruct(x.shape, x.dtype),
        grid=(),  # single program, whole array fits in VMEM
    )(x, y)
```

## Grid + BlockSpec (Chunked Kernel)

When arrays don't fit in VMEM, use `grid` + `BlockSpec` to tile. Grid = iteration space. Each invocation = one program.

```python
import functools

def matmul_kernel(a_ref, b_ref, o_ref):
    """Block matmul: accumulate partial dot products."""
    @pl.when(pl.program_id(2) == 0)
    def init():
        o_ref[...] = jnp.zeros_like(o_ref[...])

    a = a_ref[...]  # (block_m, block_k)
    b = b_ref[...]  # (block_k, block_n)
    acc = o_ref[...] + a @ b
    o_ref[...] = acc

@jax.jit
def matmul_pallas(a: jax.Array, b: jax.Array) -> jax.Array:
    m, k = a.shape
    _, n = b.shape
    block_m = block_n = block_k = 128

    return pl.pallas_call(
        matmul_kernel,
        grid=(m // block_m, n // block_n, k // block_k),
        in_specs=[
            pl.BlockSpec((block_m, block_k), lambda i, j, k: (i, k)),
            pl.BlockSpec((block_k, block_n), lambda i, j, k: (k, j)),
        ],
        out_specs=pl.BlockSpec((block_m, block_n), lambda i, j, k: (i, j)),
        out_shape=jax.ShapeDtypeStruct((m, n), a.dtype),
    )(a, b)
```

Key:
- `grid` = `(m/block_m, n/block_n, k/block_k)` — 3D iteration
- `in_specs` = how to slice input for each program
- `out_specs` = how to write output for each program
- `lambda i,j,k: (i, k)` maps program ID to block index

## TPU Memory Spaces

TPU distinguishes VMEM (vector) and SMEM (scalar). Use `pltpu.SMEM` for scalar outputs, `pltpu.VMEM` (default) for vector.

```python
from jax.experimental.pallas import tpu as pltpu

def scalar_kernel(x_ref, o_ref):
    # o_ref is SMEM because output is scalar per program
    i = pl.program_id(0)
    o_ref[...] = i  # scalar write

pl.pallas_call(
    scalar_kernel,
    out_specs=pl.BlockSpec(memory_space=pltpu.SMEM),
    out_shape=jax.ShapeDtypeStruct((8,), jnp.int32),
    grid=(8,),
)()
```

## Pipelining (Async Prefetch)

TPU supports async DMA (memory copy) pipelining. Overlap compute of current block with prefetch of next block.

```python
from jax.experimental.pallas import tpu as pltpu

def pipelined_kernel(a_ref, b_ref, o_ref):
    # Pallas TPU pipeline decorator handles prefetch automatically
    @pltpu.run_pipeline(num_stages=2)
    def body():
        a = a_ref[...]
        b = b_ref[...]
        o_ref[...] = a + b

    body()
```

See JAX docs: `docs.jax.dev/en/latest/pallas/tpu/pipelining.html`

## From PyTorch: `call_jax` + `make_kernel_from_pallas`

### Direct `call_jax`

```python
import torch
from torch_xla.core.xla_builder import call_jax

def jax_kernel(x, y):
    return x * y

result = call_jax(jax_kernel, [torch_xla_tensor, torch_xla_tensor], {}, "my_kernel")
```

### Wrap Pallas for PyTorch

```python
import torch
from torch_xla.experimental.custom_kernel import make_kernel_from_pallas, jax_import_guard

jax_import_guard()
import jax
from jax.experimental import pallas as pl
from jax.experimental.pallas import tpu as pltpu

def add_pallas_kernel(x_ref, y_ref, o_ref):
    o_ref[...] = x_ref[...] + y_ref[...]

# Wrap to PyTorch
def add_pt_kernel(x, y):
    pt_kernel = make_kernel_from_pallas(
        add_pallas_kernel,
        lambda x, y: [(x.shape, x.dtype)],  # output shape inference
    )
    return pt_kernel(x, y)

# Usage
a = torch.randn(1024, 1024).to('xla')
b = torch.randn(1024, 1024).to('xla')
c = add_pt_kernel(a, b)
```

## `torch.library.custom_op` (Production)

For autograd + torch.compile:

```python
import torch
from torch.library import custom_op
from torch_xla.core.xla_builder import call_jax
from torch_xla.experimental.custom_kernel import requires_jax

@custom_op("xla::my_pallas_kernel", mutates_args=())
def my_kernel_forward(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    def _jax_fwd(x_jax, y_jax):
        return x_jax * y_jax + jnp.sin(x_jax)
    return call_jax(_jax_fwd, [x, y], {}, "my_kernel_fwd")

@my_kernel_forward.register_fake
def my_kernel_fake(x, y):
    return torch.empty_like(x)

# Autograd wrapper
class MyKernel(torch.autograd.Function):
    @staticmethod
    @requires_jax
    def forward(ctx, x, y):
        return my_kernel_forward(x, y)

    @staticmethod
    @requires_jax
    def backward(ctx, grad_output):
        # VJP via JAX
        pass
```

## Anti-Patterns

- Don't write Pallas kernels with dynamic shapes — XLA recompiles
- Don't use Python loops inside kernel body — use `grid` for iteration
- Don't load full tensor into VMEM — use `BlockSpec` tiling
- Don't mix `jnp` and `torch` inside kernel — kernel is pure JAX
- For TPU: don't forget `pltpu.SMEM` for scalar outputs
