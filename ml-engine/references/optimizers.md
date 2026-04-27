<<<<<<< S:/AntiGravity_Skills/ml-engine/references/optimizers.md
# Optimizers — torch.optim + optax on TPU

## PyTorch-XLA Optimizers

Any `torch.optim.Optimizer` works with PT-XLA. The optimizer state is automatically sharded when using SPMD FSDP.

### Standard AdamW

```python
import torch.optim as optim

optimizer = optim.AdamW(
    model.parameters(),
    lr=1e-4,
    betas=(0.9, 0.95),
    eps=1e-8,
    weight_decay=0.1,
)
```

### SyncFree AdamW (Recommended for TPU)

Eliminates CPU-device synchronization during inf/NaN checks. ~20% faster on TPUs.

```python
from torch_xla.amp.syncfree import AdamW as SyncFreeAdamW

optimizer = SyncFreeAdamW(
    model.parameters(),
    lr=1e-4,
    betas=(0.9, 0.95),
    eps=1e-8,
    weight_decay=0.1,
)

# Training step — same API as standard AdamW
loss = compute_loss(model, batch)
loss.backward()
optimizer.step()
xm.mark_step()
```

### Learning Rate Schedule

```python
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100000)

optimizer.step()
scheduler.step()
xm.mark_step()
```

### Custom Optimizer State

For novel optimizer variants (e.g., custom momentum, routing-specific states):

```python
class CustomAdamW(optim.Optimizer):
    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.0):
        defaults = dict(lr=lr, betas=betas, eps=eps, weight_decay=weight_decay)
        super().__init__(params, defaults)

    @torch.no_grad()
    def step(self):
        for group in self.param_groups:
            for p in group["params"]:
                if p.grad is None:
                    continue

                grad = p.grad
                state = self.state[p]

                # Init state
                if len(state) == 0:
                    state["step"] = 0
                    state["exp_avg"] = torch.zeros_like(p)
                    state["exp_avg_sq"] = torch.zeros_like(p)

                exp_avg, exp_avg_sq = state["exp_avg"], state["exp_avg_sq"]
                beta1, beta2 = group["betas"]

                state["step"] += 1
                exp_avg.mul_(beta1).add_(grad, alpha=1 - beta1)
                exp_avg_sq.mul_(beta2).addcmul_(grad, grad, value=1 - beta2)

                bias_correction1 = 1 - beta1 ** state["step"]
                bias_correction2 = 1 - beta2 ** state["step"]
                step_size = group["lr"] / bias_correction1

                denom = (exp_avg_sq.sqrt() / bias_correction2).add_(group["eps"])
                p.addcdiv_(exp_avg, denom, value=-step_size)

                if group["weight_decay"] != 0:
                    p.add_(p, alpha=-group["lr"] * group["weight_decay"])
```

## JAX / optax Optimizers

```python
import optax
import jax
import jax.numpy as jnp

# Chain transforms
transform = optax.chain(
    optax.clip_by_global_norm(1.0),              # gradient clipping
    optax.scale_by_adam(b1=0.9, b2=0.95, eps=1e-8),
    optax.add_decayed_weights(0.1),             # weight decay
    optax.scale_by_schedule(
        optax.warmup_cosine_decay_schedule(
            init_value=0.0,
            peak_value=1e-4,
            warmup_steps=2000,
            decay_steps=100000,
            end_value=1e-5,
        )
    ),
    optax.scale(-1.0),  # negate for gradient descent
)

# Initialize state
params = model.init(jax.random.PRNGKey(0), jnp.ones((1, 512)))
opt_state = transform.init(params)

# Training step
@jax.jit
def train_step(params, opt_state, batch):
    def loss_fn(params):
        logits = model.apply(params, batch["input_ids"])
        return cross_entropy(logits, batch["labels"])

    loss, grads = jax.value_and_grad(loss_fn)(params)
    updates, opt_state = transform.update(grads, opt_state, params)
    params = optax.apply_updates(params, updates)

    # PMean across devices for SPMD
    loss = jax.lax.pmean(loss, axis_name="batch")
    return params, opt_state, loss
```

## Multi-Framework Optimizer Pattern

Use PT-XLA for primary training, JAX for auxiliary loss gradient:

```python
# PT-XLA primary optimizer
pt_optimizer = optim.AdamW(pt_model.parameters(), lr=1e-4)

# JAX auxiliary optimizer (e.g., for routing)
jax_transform = optax.adam(1e-3)
jax_params = {"router_aux": jnp.zeros((num_experts,))}
jax_opt_state = jax_transform.init(jax_params)

# Interop: convert JAX gradient to PT gradient for router parameters
# See dual-framework.md for DLPack interop
```

## Learning Rate Schedules

| Schedule | Use Case | PT-XLA | JAX/optax |
|----------|----------|--------|-----------|
| Constant | Baseline ablation | `optim.lr_scheduler.ConstantLR` | `optax.constant_schedule` |
| Cosine | Long training | `CosineAnnealingLR` | `warmup_cosine_decay_schedule` |
| Warmup + Linear | Standard | `LinearLR` + `SequentialLR` | `warmup_exponential_decay_schedule` |
| InvSqrt | Transformer classic | Custom | `polynomial_schedule` |

## Anti-Patterns

- Don't create optimizer before moving model to XLA device — parameters must be on TPU first
- Don't use `torch.optim` with JAX parameters — use optax
- Don't forget `xm.mark_step()` after `optimizer.step()` — gradients are lazy
- Don't mix weight decay with L2 regularization in the same optimizer — pick one
=======
# Optimizers — torch.optim + optax on TPU

## PyTorch-XLA Optimizers

Any `torch.optim.Optimizer` works with PT-XLA. The optimizer state is automatically sharded when using SPMD FSDP.

### Standard AdamW

```python
import torch.optim as optim
import torch_xla

optimizer = optim.AdamW(
    model.parameters(),
    lr=1e-4,
    betas=(0.9, 0.95),
    eps=1e-8,
    weight_decay=0.1,
)
```

### SyncFree AdamW (Recommended for TPU)

Eliminates CPU-device synchronization during inf/NaN checks. ~20% faster on TPUs.

```python
from torch_xla.amp.syncfree import AdamW as SyncFreeAdamW

optimizer = SyncFreeAdamW(
    model.parameters(),
    lr=1e-4,
    betas=(0.9, 0.95),
    eps=1e-8,
    weight_decay=0.1,
)

# Training step — same API as standard AdamW
loss = compute_loss(model, batch)
loss.backward()
optimizer.step()
torch_xla.sync()
```

### Learning Rate Schedule

```python
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100000)

optimizer.step()
scheduler.step()
torch_xla.sync()
```

### Custom Optimizer State

For novel optimizer variants (e.g., custom momentum, routing-specific states):

```python
class CustomAdamW(optim.Optimizer):
    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.0):
        defaults = dict(lr=lr, betas=betas, eps=eps, weight_decay=weight_decay)
        super().__init__(params, defaults)

    @torch.no_grad()
    def step(self):
        for group in self.param_groups:
            for p in group["params"]:
                if p.grad is None:
                    continue

                grad = p.grad
                state = self.state[p]

                # Init state
                if len(state) == 0:
                    state["step"] = 0
                    state["exp_avg"] = torch.zeros_like(p)
                    state["exp_avg_sq"] = torch.zeros_like(p)

                exp_avg, exp_avg_sq = state["exp_avg"], state["exp_avg_sq"]
                beta1, beta2 = group["betas"]

                state["step"] += 1
                exp_avg.mul_(beta1).add_(grad, alpha=1 - beta1)
                exp_avg_sq.mul_(beta2).addcmul_(grad, grad, value=1 - beta2)

                bias_correction1 = 1 - beta1 ** state["step"]
                bias_correction2 = 1 - beta2 ** state["step"]
                step_size = group["lr"] / bias_correction1

                denom = (exp_avg_sq.sqrt() / bias_correction2).add_(group["eps"])
                p.addcdiv_(exp_avg, denom, value=-step_size)

                if group["weight_decay"] != 0:
                    p.add_(p, alpha=-group["lr"] * group["weight_decay"])
```

## JAX / optax Optimizers

```python
import optax
import jax
import jax.numpy as jnp

# Chain transforms
transform = optax.chain(
    optax.clip_by_global_norm(1.0),              # gradient clipping
    optax.scale_by_adam(b1=0.9, b2=0.95, eps=1e-8),
    optax.add_decayed_weights(0.1),             # weight decay
    optax.scale_by_schedule(
        optax.warmup_cosine_decay_schedule(
            init_value=0.0,
            peak_value=1e-4,
            warmup_steps=2000,
            decay_steps=100000,
            end_value=1e-5,
        )
    ),
    optax.scale(-1.0),  # negate for gradient descent
)

# Initialize state
params = model.init(jax.random.PRNGKey(0), jnp.ones((1, 512)))
opt_state = transform.init(params)

# Training step
@jax.jit
def train_step(params, opt_state, batch):
    def loss_fn(params):
        logits = model.apply(params, batch["input_ids"])
        return cross_entropy(logits, batch["labels"])

    loss, grads = jax.value_and_grad(loss_fn)(params)
    updates, opt_state = transform.update(grads, opt_state, params)
    params = optax.apply_updates(params, updates)

    # PMean across devices for SPMD
    loss = jax.lax.pmean(loss, axis_name="batch")
    return params, opt_state, loss
```

## Multi-Framework Optimizer Pattern

Use PT-XLA for primary training, JAX for auxiliary loss gradient:

```python
# PT-XLA primary optimizer
pt_optimizer = optim.AdamW(pt_model.parameters(), lr=1e-4)

# JAX auxiliary optimizer (e.g., for routing)
jax_transform = optax.adam(1e-3)
jax_params = {"router_aux": jnp.zeros((num_experts,))}
jax_opt_state = jax_transform.init(jax_params)

# Interop: convert JAX gradient to PT gradient for router parameters
# See dual-framework.md for DLPack interop
```

## Learning Rate Schedules

| Schedule | Use Case | PT-XLA | JAX/optax |
|----------|----------|--------|-----------|
| Constant | Baseline ablation | `optim.lr_scheduler.ConstantLR` | `optax.constant_schedule` |
| Cosine | Long training | `CosineAnnealingLR` | `warmup_cosine_decay_schedule` |
| Warmup + Linear | Standard | `LinearLR` + `SequentialLR` | `warmup_exponential_decay_schedule` |
| InvSqrt | Transformer classic | Custom | `polynomial_schedule` |

## Anti-Patterns

- Don't create optimizer before moving model to XLA device — parameters must be on TPU first
- Don't use `torch.optim` with JAX parameters — use optax
- Don't forget `torch_xla.sync()` after `optimizer.step()` — gradients are lazy. Or use `with torch_xla.step():` context manager.
- Don't mix weight decay with L2 regularization in the same optimizer — pick one
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/optimizers.md
