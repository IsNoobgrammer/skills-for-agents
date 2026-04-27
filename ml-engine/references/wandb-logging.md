<<<<<<< S:/AntiGravity_Skills/ml-engine/references/wandb-logging.md
# wandb Logging on TPU

## Initialization

```python
import wandb
import torch_xla.core.xla_model as xm
import json

def init_wandb(config: dict, project="tpu-research", entity=None):
    """Initialize wandb on master process only."""
    if xm.is_master_ordinal():
        run = wandb.init(
            project=project,
            entity=entity,
            config=config,
            name=f"{config['model']['name']}-{config['train']['seed']}",
            tags=[config["tpu"]["version"], config["framework"]["primary"]],
        )
        return run
    return None
```

## Metric Logging

### Basic Training Metrics

```python
def log_train_step(step, loss, lr, grad_norm=None):
    """Log training metrics. Aggregate across devices first."""
    # Aggregate loss
    loss_tensor = torch.tensor(loss, device=xm.xla_device())
    global_loss = xm.all_reduce(xm.REDUCE_SUM, loss_tensor) / xm.xrt_world_size()

    metrics = {
        "train/loss": global_loss.item(),
        "train/lr": lr,
        "train/step": step,
    }

    if grad_norm is not None:
        grad_tensor = torch.tensor(grad_norm, device=xm.xla_device())
        global_grad_norm = xm.all_reduce(xm.REDUCE_SUM, grad_tensor) / xm.xrt_world_size()
        metrics["train/grad_norm"] = global_grad_norm.item()

    if xm.is_master_ordinal():
        wandb.log(metrics)
```

### Throughput Logging

```python
import time

def log_throughput(step, batch_size, seq_len, start_time, num_tokens=None):
    """Log tokens/sec and samples/sec."""
    elapsed = time.perf_counter() - start_time
    samples_per_sec = (batch_size * xm.xrt_world_size()) / elapsed

    metrics = {
        "perf/samples_per_sec": samples_per_sec,
        "perf/step_time_ms": elapsed * 1000,
    }

    if num_tokens is not None:
        tokens_per_sec = (num_tokens * xm.xrt_world_size()) / elapsed
        metrics["perf/tokens_per_sec"] = tokens_per_sec

    if xm.is_master_ordinal():
        wandb.log(metrics, step=step)
```

## Checkpoint Artifacts

```python
def save_checkpoint_artifact(step, checkpoint_dir, model, optimizer, config):
    """Save checkpoint as wandb artifact. Only on master."""
    if not xm.is_master_ordinal():
        return

    # Save model and optimizer state
    checkpoint = {
        "step": step,
        "model": model.state_dict(),
        "optimizer": optimizer.state_dict(),
        "config": config,
    }
    path = f"{checkpoint_dir}/checkpoint_{step}.pt"
    xm.save(checkpoint, path)  # XLA-aware save for multi-host

    # Log as artifact
    artifact = wandb.Artifact(
        name=f"checkpoint-{config['run_id']}",
        type="model",
        metadata={"step": step, **config},
    )
    artifact.add_file(path)
    wandb.log_artifact(artifact)
```

## JAX wandb Logging

```python
import wandb
import jax

# Init on process 0
if jax.process_index() == 0:
    wandb.init(project="tpu-research-jax", config=config)

def log_jax_train_step(step, loss, lr):
    """Log JAX training metrics."""
    # JAX loss is already pmean'd across devices
    if jax.process_index() == 0:
        wandb.log({
            "train/loss": float(loss),
            "train/lr": float(lr),
            "train/step": int(step),
        })
```

## Multi-Host Sync

```python
# For multi-pod training, wandb init on process 0 of host 0
import os

is_main_host = (os.environ.get("CLOUD_TPU_TASK_ID", "0") == "0")
is_main_process = xm.is_master_ordinal()  # process 0 of host 0

if is_main_host and is_main_process:
    wandb.init(project="tpu-pod-research")
```

## Metric Grouping

```python
# Group related metrics for wandb UI
wandb.define_metric("train/step")
wandb.define_metric("train/*", step_metric="train/step")
wandb.define_metric("eval/*", step_metric="eval/step")
```

## Anti-Patterns

- Don't call `wandb.log` from every TPU core — it creates duplicate runs and wastes bandwidth
- Don't log tensors directly — convert to CPU scalars with `.item()` or `float()`
- Don't forget `xm.save()` for checkpoints — plain `torch.save` breaks on multi-host
- Don't log every step — log every 10-100 steps to avoid overhead
=======
# wandb Logging on TPU

## Initialization

```python
import wandb
import torch_xla
import torch_xla.core.xla_model as xm
from torch_xla import runtime as xr
import json

def init_wandb(config: dict, project="tpu-research", entity=None):
    """Initialize wandb on master process only."""
    if xm.is_master_ordinal():
        run = wandb.init(
            project=project,
            entity=entity,
            config=config,
            name=f"{config['model']['name']}-{config['train']['seed']}",
            tags=[config["tpu"]["version"], config["framework"]["primary"]],
        )
        return run
    return None
```

## Metric Logging

### Basic Training Metrics

```python
def log_train_step(step, loss, lr, grad_norm=None):
    """Log training metrics. Aggregate across devices first."""
    # Aggregate loss
    loss_tensor = torch.tensor(loss, device='xla')
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/wandb-logging.md
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/wandb-logging.md
    global_loss = xm.all_reduce(xm.REDUCE_SUM, loss_tensor) / xm.xrt_world_size()
=======
    global_loss = xm.all_reduce(xm.REDUCE_SUM, loss_tensor) / xr.world_size()
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/wandb-logging.md
=======
    global_loss = xm.all_reduce(xm.REDUCE_SUM, loss_tensor) / xr.world_size()
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/wandb-logging.md

    metrics = {
        "train/loss": global_loss.item(),
        "train/lr": lr,
        "train/step": step,
    }

    if grad_norm is not None:
        grad_tensor = torch.tensor(grad_norm, device='xla')
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/wandb-logging.md
<<<<<<< S:/AntiGravity_Skills/ml-engine/references/wandb-logging.md
        global_grad_norm = xm.all_reduce(xm.REDUCE_SUM, grad_tensor) / xm.xrt_world_size()
=======
        global_grad_norm = xm.all_reduce(xm.REDUCE_SUM, grad_tensor) / xr.world_size()
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/wandb-logging.md
=======
        global_grad_norm = xm.all_reduce(xm.REDUCE_SUM, grad_tensor) / xr.world_size()
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/wandb-logging.md
        metrics["train/grad_norm"] = global_grad_norm.item()

    if xm.is_master_ordinal():
        wandb.log(metrics)
```

### Throughput Logging

```python
import time

def log_throughput(step, batch_size, seq_len, start_time, num_tokens=None):
    """Log tokens/sec and samples/sec."""
    elapsed = time.perf_counter() - start_time
    samples_per_sec = (batch_size * xr.world_size()) / elapsed

    metrics = {
        "perf/samples_per_sec": samples_per_sec,
        "perf/step_time_ms": elapsed * 1000,
    }

    if num_tokens is not None:
        tokens_per_sec = (num_tokens * xr.world_size()) / elapsed
        metrics["perf/tokens_per_sec"] = tokens_per_sec

    if xm.is_master_ordinal():
        wandb.log(metrics, step=step)
```

## Checkpoint Artifacts

```python
def save_checkpoint_artifact(step, checkpoint_dir, model, optimizer, config):
    """Save checkpoint as wandb artifact. Only on master."""
    if not xm.is_master_ordinal():
        return

    # Save model and optimizer state
    checkpoint = {
        "step": step,
        "model": model.state_dict(),
        "optimizer": optimizer.state_dict(),
        "config": config,
    }
    path = f"{checkpoint_dir}/checkpoint_{step}.pt"
    xm.save(checkpoint, path)  # XLA-aware save for multi-host

    # Log as artifact
    artifact = wandb.Artifact(
        name=f"checkpoint-{config['run_id']}",
        type="model",
        metadata={"step": step, **config},
    )
    artifact.add_file(path)
    wandb.log_artifact(artifact)
```

## JAX wandb Logging

```python
import wandb
import jax

# Init on process 0
if jax.process_index() == 0:
    wandb.init(project="tpu-research-jax", config=config)

def log_jax_train_step(step, loss, lr):
    """Log JAX training metrics."""
    # JAX loss is already pmean'd across devices
    if jax.process_index() == 0:
        wandb.log({
            "train/loss": float(loss),
            "train/lr": float(lr),
            "train/step": int(step),
        })
```

## Multi-Host Sync

```python
# For multi-pod training, wandb init on process 0 of host 0
import os

is_main_host = (os.environ.get("CLOUD_TPU_TASK_ID", "0") == "0")
is_main_process = xm.is_master_ordinal()  # process 0 of host 0

if is_main_host and is_main_process:
    wandb.init(project="tpu-pod-research")
```

## Metric Grouping

```python
# Group related metrics for wandb UI
wandb.define_metric("train/step")
wandb.define_metric("train/*", step_metric="train/step")
wandb.define_metric("eval/*", step_metric="eval/step")
```

## Anti-Patterns

- Don't call `wandb.log` from every TPU core — it creates duplicate runs and wastes bandwidth
- Don't log tensors directly — convert to CPU scalars with `.item()` or `float()`
- Don't forget `xm.save()` for checkpoints — plain `torch.save` breaks on multi-host
- Don't log every step — log every 10-100 steps to avoid overhead
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/wandb-logging.md
