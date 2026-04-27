# Tracing Optimization — `@assume_pure`, `scan_layers`, `scan`

## Overview

PyTorch/XLA uses lazy tensor tracing — operations are recorded into a graph and executed later. Re-tracing on every step adds overhead. These tools reduce or eliminate re-tracing.

## `@assume_pure`

Decorate pure functions to trace once per unique input shape/dtype. Cached computation is reused.

### With Functions

```python
from torch_xla.experimental.assume_pure import assume_pure

@assume_pure
def do_math(a, b, c=42):
    return a @ b + c

# Traced once, cached for all subsequent calls with same shapes
for i in range(1000):
    result = do_math(x, y)
```

### With `nn.Module`

```python
from torch.func import functional_call
from torch_xla.experimental.assume_pure import assume_pure

class MyModule(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear = nn.Linear(10, 10)
    def forward(self, x):
        return self.linear(x)

module = MyModule().to('xla')

# Convert module forward to pure function
pure_forward = lambda params, buffers, x: functional_call(module, (params, buffers), (x,))
cached_forward = assume_pure(pure_forward)

params = dict(module.named_parameters())
buffers = dict(module.named_buffers())
for i in range(1000):
    x = torch.randn(5, 10, device='xla')
    y = cached_forward(params, buffers, x)
```

### Benchmark

100-layer decoder-only model tracing:
- Without `@assume_pure`: 140ms
- With `@assume_pure`: 24ms

Running time does NOT scale with model complexity — fixed up-front cost.

### Limitations

- Only PyTorch upstream ops supported (no custom Pallas kernels yet)
- Supported XLA ops: `assume_pure` (recursive), `mark_sharding`
- Function MUST be pure — same input → same output, no side effects

## `scan_layers`

Replace for loops over homogeneous decoder layers. Traces first layer, reuses compilation for all subsequent layers.

### Usage

```python
from torch_xla.experimental.scan_layers import scan_layers

# Before: unrolled loop → long compile time
def run_decoder_layers(self, hidden_states):
    for layer in self.layers:
        hidden_states = layer(hidden_states)
    return hidden_states

# After: scan_layers → single compilation
def run_decoder_layers(self, hidden_states):
    return scan_layers(self.layers, hidden_states, is_layer_pure=True)
```

### Compile Time Savings

50-layer decoder, 5 training steps:
- For loop: max compile time 1m03s
- `scan_layers`: max compile time 19s

### Cache (is_layer_pure)

Set `is_layer_pure=True` to activate caching. Without cache: 9m35s. With cache: 4m59s (for 500 steps).

## `scan`

Lower-level loop primitive modeled after `jax.lax.scan`. Loops over leading dimension of tensors efficiently.

### Signature

```python
def scan(fn, init, xs, is_fn_pure=False):
    # fn: (carry, x) -> (carry, y)
    # init: initial carry
    # xs: input tensor(s) — leading dim is loop axis
    # Returns: (final_carry, stacked_outputs)
```

### Example: Cumulative Sum

```python
from torch_xla.experimental.scan import scan

def cumsum(accumulated, element):
    accumulated += element
    return accumulated, accumulated

init = torch.tensor([0.0], device='xla')
xs = torch.tensor([1.0, 2.0, 3.0], device='xla')
torch_xla.sync()

final, result = scan(cumsum, init, xs)
# final: tensor([6.])
# result: tensor([[1.], [3.], [6.]])
```

### Example: PyTree (Dict) Inputs

```python
carry = {
    'sum': torch.tensor([0.0], device='xla'),
    'count': torch.tensor([0.0], device='xla')
}
xs = {'values': torch.arange(1, 6, dtype=torch.float32, device='xla')}

def fn(carry_dict, x_dict):
    new_sum = carry_dict['sum'] + x_dict['values']
    new_count = carry_dict['count'] + 1.0
    new_carry = {'sum': new_sum, 'count': new_count}
    running_mean = new_sum / new_count
    return new_carry, running_mean

final_carry, means = scan(fn, carry, xs)
```

### Under the Hood

`scan` lowers the loop into an XLA `while` operation. Only one iteration is compiled by XLA, regardless of loop count.

## `while_loop` / `fori_loop`

XLA-native while loops via `torch._higher_order_ops.while_loop`.

```python
import torch_xla.experimental.fori_loop
from torch._higher_order_ops.while_loop import while_loop

def cond_fn(iteri, x):
    return iteri > 0

def body_fn(iteri, x):
    return iteri - 1, torch.add(x, 1)

init_val = torch.tensor(3, device='xla')
iteri = torch.tensor(10, device='xla')
_, res = while_loop(cond_fn, body_fn, (iteri, init_val))
# res: tensor(13, device='xla:0')
```

**Constraint:** `body_fn` must have same input/output shapes.

## When to Use What

| Tool | Use Case |
|------|----------|
| `@assume_pure` | Pure functions/modules that don't change between steps |
| `scan_layers` | Homogeneous decoder layers (LLMs) |
| `scan` | Custom loop logic with carry state |
| `while_loop` | Data-dependent loop termination |
| `torch_xla.compile()` | Entire step function as one graph |

## Anti-Patterns

- Don't use `scan_layers` with layers that have custom Pallas kernels (flash attention) — not yet supported
- Don't decorate impure functions with `@assume_pure` — will produce wrong results
- Don't use `while_loop` with varying output shapes — XLA requires fixed shapes
