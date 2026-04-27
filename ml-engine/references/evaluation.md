<<<<<<< S:/AntiGravity_Skills/ml-engine/references/evaluation.md
# Evaluation Loops

## Online Evaluation (Within Training Loop)

Run eval every N steps during training.

```python
@torch.no_grad()
def evaluate_online(model, eval_loader, step, max_eval_batches=None):
    model.eval()
    total_loss = torch.tensor(0.0, device=xm.xla_device())
    total_tokens = torch.tensor(0, device=xm.xla_device())

    for i, batch in enumerate(eval_loader):
        if max_eval_batches and i >= max_eval_batches:
            break

        logits = model(batch["input_ids"], attention_mask=batch["attention_mask"])
        loss = compute_loss(logits, batch["labels"])

        # Count valid tokens (non-padding)
        num_tokens = batch["attention_mask"].sum()
        total_loss += loss * num_tokens
        total_tokens += num_tokens

    # Aggregate across all devices
    total_loss = xm.all_reduce(xm.REDUCE_SUM, total_loss)
    total_tokens = xm.all_reduce(xm.REDUCE_SUM, total_tokens)

    avg_loss = total_loss / total_tokens
    perplexity = torch.exp(avg_loss)

    model.train()

    if xm.is_master_ordinal():
        wandb.log({
            "eval/perplexity": perplexity.item(),
            "eval/loss": avg_loss.item(),
            "eval/step": step,
        })

    return perplexity.item()
```

## Offline Evaluation (Separate Script)

```python
import torch
import torch_xla.core.xla_model as xm
from pathlib import Path

def load_checkpoint(model, optimizer, checkpoint_path):
    """Load checkpoint from wandb artifact or local path."""
    checkpoint = torch.load(checkpoint_path, map_location=xm.xla_device())
    model.load_state_dict(checkpoint["model"])
    if optimizer:
        optimizer.load_state_dict(checkpoint["optimizer"])
    return checkpoint["step"], checkpoint["config"]

def evaluate_offline(model, eval_loader, checkpoint_path):
    step, config = load_checkpoint(model, None, checkpoint_path)
    model.eval()

    # ... same as online eval ...

    if xm.is_master_ordinal():
        print(f"Step {step}: Perplexity = {perplexity:.2f}")

    return perplexity
```

## Perplexity Calculation

```python
def compute_perplexity(logits, labels, mask=None):
    """
    logits: (batch, seq, vocab)
    labels: (batch, seq)
    mask: (batch, seq) — 1 for valid tokens, 0 for padding
    """
    log_probs = torch.nn.functional.log_softmax(logits, dim=-1)
    # Gather log probs for true labels
    token_log_probs = log_probs.gather(dim=-1, index=labels.unsqueeze(-1)).squeeze(-1)

    if mask is not None:
        token_log_probs = token_log_probs * mask
        num_tokens = mask.sum()
    else:
        num_tokens = labels.numel()

    avg_neg_log_likelihood = -token_log_probs.sum() / num_tokens
    perplexity = torch.exp(avg_neg_log_likelihood)
    return perplexity, num_tokens
```

## Accuracy for Classification

```python
def compute_accuracy(logits, labels, mask=None):
    predictions = logits.argmax(dim=-1)
    correct = (predictions == labels)

    if mask is not None:
        correct = correct & mask.bool()
        num_tokens = mask.sum()
    else:
        num_tokens = labels.numel()

    accuracy = correct.sum() / num_tokens
    return accuracy
```

## JAX Evaluation

```python
import jax
import jax.numpy as jnp

@jax.jit
def eval_step(params, batch):
    logits = model.apply(params, batch["input_ids"])
    loss = cross_entropy(logits, batch["labels"])
    # pmean across devices
    loss = jax.lax.pmean(loss, axis_name="batch")
    return loss
```

## Checkpoint Resumption

```python
def maybe_resume(model, optimizer, checkpoint_dir):
    """Resume from latest checkpoint if available."""
    checkpoint_dir = Path(checkpoint_dir)
    checkpoints = sorted(checkpoint_dir.glob("checkpoint_*.pt"))

    if not checkpoints:
        return 0  # Start from step 0

    latest = checkpoints[-1]
    step, config = load_checkpoint(model, optimizer, latest)

    if xm.is_master_ordinal():
        print(f"Resumed from checkpoint: {latest} (step {step})")

    return step
```

## Sharded Inference

```python
def generate_sharded(model, input_ids, max_new_tokens=50):
    """Autoregressive generation with model parallelism."""
    model.eval()
    for _ in range(max_new_tokens):
        logits = model(input_ids)
        next_token = logits[:, -1, :].argmax(dim=-1, keepdim=True)
        input_ids = torch.cat([input_ids, next_token], dim=-1)
        xm.mark_step()  # Important for lazy execution
    return input_ids
```

## Anti-Patterns

- Don't forget `model.eval()` + `torch.no_grad()` — dropout and batch norm behave differently
- Don't run eval on the full dataset every step — sample 1-10% or use fixed eval batches
- Don't forget to aggregate metrics across devices — each core sees different data
- Don't use `model.train()` before logging eval metrics — log first, then switch mode
=======
# Evaluation Loops

## Online Evaluation (Within Training Loop)

Run eval every N steps during training.

```python
@torch.no_grad()
def evaluate_online(model, eval_loader, step, max_eval_batches=None):
    model.eval()
    total_loss = torch.tensor(0.0, device='xla')
    total_tokens = torch.tensor(0, device='xla')

    for i, batch in enumerate(eval_loader):
        if max_eval_batches and i >= max_eval_batches:
            break

        logits = model(batch["input_ids"], attention_mask=batch["attention_mask"])
        loss = compute_loss(logits, batch["labels"])

        # Count valid tokens (non-padding)
        num_tokens = batch["attention_mask"].sum()
        total_loss += loss * num_tokens
        total_tokens += num_tokens

    # Aggregate across all devices
    total_loss = xm.all_reduce(xm.REDUCE_SUM, total_loss)
    total_tokens = xm.all_reduce(xm.REDUCE_SUM, total_tokens)

    avg_loss = total_loss / total_tokens
    perplexity = torch.exp(avg_loss)

    model.train()

    if xm.is_master_ordinal():
        wandb.log({
            "eval/perplexity": perplexity.item(),
            "eval/loss": avg_loss.item(),
            "eval/step": step,
        })

    return perplexity.item()
```

## Offline Evaluation (Separate Script)

```python
import torch
import torch_xla.core.xla_model as xm
from pathlib import Path

def load_checkpoint(model, optimizer, checkpoint_path):
    """Load checkpoint from wandb artifact or local path."""
    checkpoint = torch.load(checkpoint_path, map_location='xla')
    model.load_state_dict(checkpoint["model"])
    if optimizer:
        optimizer.load_state_dict(checkpoint["optimizer"])
    return checkpoint["step"], checkpoint["config"]

def evaluate_offline(model, eval_loader, checkpoint_path):
    step, config = load_checkpoint(model, None, checkpoint_path)
    model.eval()

    # ... same as online eval ...

    if xm.is_master_ordinal():
        print(f"Step {step}: Perplexity = {perplexity:.2f}")

    return perplexity
```

## Perplexity Calculation

```python
def compute_perplexity(logits, labels, mask=None):
    """
    logits: (batch, seq, vocab)
    labels: (batch, seq)
    mask: (batch, seq) — 1 for valid tokens, 0 for padding
    """
    log_probs = torch.nn.functional.log_softmax(logits, dim=-1)
    # Gather log probs for true labels
    token_log_probs = log_probs.gather(dim=-1, index=labels.unsqueeze(-1)).squeeze(-1)

    if mask is not None:
        token_log_probs = token_log_probs * mask
        num_tokens = mask.sum()
    else:
        num_tokens = labels.numel()

    avg_neg_log_likelihood = -token_log_probs.sum() / num_tokens
    perplexity = torch.exp(avg_neg_log_likelihood)
    return perplexity, num_tokens
```

## Accuracy for Classification

```python
def compute_accuracy(logits, labels, mask=None):
    predictions = logits.argmax(dim=-1)
    correct = (predictions == labels)

    if mask is not None:
        correct = correct & mask.bool()
        num_tokens = mask.sum()
    else:
        num_tokens = labels.numel()

    accuracy = correct.sum() / num_tokens
    return accuracy
```

## JAX Evaluation

```python
import jax
import jax.numpy as jnp

@jax.jit
def eval_step(params, batch):
    logits = model.apply(params, batch["input_ids"])
    loss = cross_entropy(logits, batch["labels"])
    # pmean across devices
    loss = jax.lax.pmean(loss, axis_name="batch")
    return loss
```

## Checkpoint Resumption

```python
def maybe_resume(model, optimizer, checkpoint_dir):
    """Resume from latest checkpoint if available."""
    checkpoint_dir = Path(checkpoint_dir)
    checkpoints = sorted(checkpoint_dir.glob("checkpoint_*.pt"))

    if not checkpoints:
        return 0  # Start from step 0

    latest = checkpoints[-1]
    step, config = load_checkpoint(model, optimizer, latest)

    if xm.is_master_ordinal():
        print(f"Resumed from checkpoint: {latest} (step {step})")

    return step
```

## Sharded Inference

```python
def generate_sharded(model, input_ids, max_new_tokens=50):
    """Autoregressive generation with model parallelism."""
    model.eval()
    for _ in range(max_new_tokens):
        logits = model(input_ids)
        next_token = logits[:, -1, :].argmax(dim=-1, keepdim=True)
        input_ids = torch.cat([input_ids, next_token], dim=-1)
        torch_xla.sync()  # Important for lazy execution
    return input_ids
```

## Anti-Patterns

- Don't forget `model.eval()` + `torch.no_grad()` — dropout and batch norm behave differently
- Don't run eval on the full dataset every step — sample 1-10% or use fixed eval batches
- Don't forget to aggregate metrics across devices — each core sees different data
- Don't use `model.train()` before logging eval metrics — log first, then switch mode
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/evaluation.md
