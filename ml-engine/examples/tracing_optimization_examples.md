# Tracing Optimization Examples — `@assume_pure`, `scan_layers`, `scan`

## Overview

Examples for reducing tracing overhead and compile time in PyTorch/XLA.

## Example 1: `@assume_pure` with Pure Function

```python
import torch
import torch_xla
from torch_xla.experimental.assume_pure import assume_pure

@assume_pure
def do_math(a, b, c=42):
    """Pure function: same input → same output, no side effects."""
    return a @ b + c

# Traced once, cached for all subsequent calls with same shapes
for i in range(1000):
    x = torch.randn(4, 4, device='xla')
    y = torch.randn(4, 4, device='xla')
    result = do_math(x, y, c=42)
    if i == 0:
        print("First call: traced and cached")
    # Subsequent calls: skip tracing, use cached computation

torch_xla.sync()
print(f"Result shape: {result.shape}")
```

## Example 2: `@assume_pure` with nn.Module

```python
import torch
import torch.nn as nn
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
pure_forward = lambda params, buffers, x: functional_call(
    module, (params, buffers), (x,)
)
cached_forward = assume_pure(pure_forward)

# Training loop — forward traced once per shape
params = dict(module.named_parameters())
buffers = dict(module.named_buffers())

for step in range(1000):
    x = torch.randn(5, 10, device='xla')
    y = cached_forward(params, buffers, x)
    # ... loss, backward, optimizer step
```

## Example 3: `scan_layers` for Decoder

```python
import torch
import torch.nn as nn
from torch_xla.experimental.scan_layers import scan_layers

class DecoderLayer(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.linear = nn.Linear(dim, dim)
        self.act = nn.GELU()
    def forward(self, x):
        return self.act(self.linear(x)) + x  # residual

class Decoder(nn.Module):
    def __init__(self, dim, num_layers):
        super().__init__()
        self.layers = nn.ModuleList([
            DecoderLayer(dim) for _ in range(num_layers)
        ])
        self.norm = nn.LayerNorm(dim)

    # BEFORE: unrolled for loop — long compile time
    # def forward(self, x):
    #     for layer in self.layers:
    #         x = layer(x)
    #     return self.norm(x)

    # AFTER: scan_layers — single compilation
    def forward(self, x):
        x = scan_layers(self.layers, x, is_layer_pure=True)
        return self.norm(x)

# Usage
model = Decoder(dim=512, num_layers=50).to('xla')
x = torch.randn(4, 512, 512, device='xla')
output = model(x)
```

**Compile time comparison (50 layers, 5 steps):**
- For loop: max compile ~1m03s
- `scan_layers`: max compile ~19s

## Example 4: `scan` for Cumulative Computation

```python
import torch
import torch_xla
from torch_xla.experimental.scan import scan

# Cumulative sum
def cumsum(accumulated, element):
    accumulated = accumulated + element
    return accumulated, accumulated

init = torch.tensor([0.0], device='xla')
xs = torch.tensor([1.0, 2.0, 3.0, 4.0, 5.0], device='xla')
torch_xla.sync()

final, result = scan(cumsum, init, xs)
torch_xla.sync()
print(f"Final sum: {final}")       # tensor([15.])
print(f"History: {result}")        # tensor([[1.], [3.], [6.], [10.], [15.]])
```

## Example 5: `scan` with PyTree (Dict)

```python
import torch
import torch_xla
from torch_xla.experimental.scan import scan

# Running mean using dict PyTree
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
torch_xla.sync()
print(f"Final carry: {final_carry}")
print(f"Means over time: {means}")
```

## Example 6: `while_loop`

```python
import torch
import torch_xla
import torch_xla.experimental.fori_loop
from torch._higher_order_ops.while_loop import while_loop

device = torch_xla.device()

def cond_fn(iteri, x):
    return iteri > 0

def body_fn(iteri, x):
    return iteri - 1, torch.add(x, 1)

init_val = torch.tensor(3, device=device)
iteri = torch.tensor(10, device=device)
_, res = while_loop(cond_fn, body_fn, (iteri, init_val))
print(f"Result: {res}")  # tensor(13, device='xla:0')
```

## When to Use What

| Pattern | Use Case | Compile Impact |
|---------|----------|---------------|
| `@assume_pure` | Pure functions/modules | Traces once per shape |
| `scan_layers` | Homogeneous decoder layers | Traces first layer only |
| `scan` | Custom loop with carry | Single compilation via XLA `while` |
| `while_loop` | Data-dependent termination | XLA-native loop |
| `torch_xla.compile()` | Entire step function | One graph per step |

## Limitations

- `scan_layers`/`scan` cannot trace functions with custom Pallas kernels (e.g., flash attention) — not yet supported
- `@assume_pure` only supports PyTorch upstream ops + `mark_sharding` + recursive `assume_pure`
- `while_loop` requires fixed input/output shapes in `body_fn`
- Impure functions decorated with `@assume_pure` will produce wrong results silently
