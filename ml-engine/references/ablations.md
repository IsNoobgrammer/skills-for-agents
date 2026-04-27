<<<<<<< S:/AntiGravity_Skills/ml-engine/references/ablations.md
# Reproducible Ablations

## Checklist

- [ ] Seed locked (Python, NumPy, PyTorch, XLA, JAX)
- [ ] Deterministic data pipeline (streaming, no random file order)
- [ ] All hyperparameters in config dict, logged to wandb
- [ ] Custom module versioning (string identifier in config)
- [ ] Checkpoint naming includes config hash
- [ ] Same TPU version across compared runs
- [ ] No environment variable drift between runs
- [ ] Git commit hash logged
- [ ] Batch size and sequence length fixed per ablation group

## Seed Locking

```python
import random
import numpy as np
import torch
import torch_xla.core.xla_model as xm
import jax
import jax.numpy as jnp

def set_global_seed(seed=42):
    """Lock all RNGs. Call before ANY model/data initialization."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

    # XLA TPU RNG
    try:
        xm.set_rng_state(seed)
    except Exception:
        pass

    # JAX RNG
    try:
        jax_key = jax.random.PRNGKey(seed)
        return jax_key
    except Exception:
        return None
```

## Config Dict

```python
from dataclasses import dataclass, asdict
from typing import Optional

@dataclass
class ModelConfig:
    name: str = "moe-base"
    dim: int = 768
    num_layers: int = 12
    num_heads: int = 12
    num_experts: int = 8
    top_k: int = 2
    router_type: str = "topk-gelu"     # version this!
    ffn_type: str = "swiglu"            # version this!
    ln_type: str = "rmsnorm"            # version this!
    attn_kernel: str = "splash"         # version this!
    dropout: float = 0.0

@dataclass
class TrainConfig:
    seed: int = 42
    batch_size: int = 32
    seq_len: int = 512
    lr: float = 1e-4
    warmup_steps: int = 2000
    max_steps: int = 100_000
    weight_decay: float = 0.1
    grad_clip: float = 1.0
    eval_every: int = 1000
    save_every: int = 5000

@dataclass
class TPUConfig:
    version: str = "v2-8"
    mesh_shape: tuple = (8,)
    axis_names: tuple = ("data",)

@dataclass
class ExperimentConfig:
    model: ModelConfig
    train: TrainConfig
    tpu: TPUConfig
    dataset: str = "openwebtext"
    tokenizer: str = "gpt2"
    framework_primary: str = "pt-xla"
    framework_secondary: str = "jax"
    wandb_project: str = "tpu-research"

# Generate full config
config = ExperimentConfig(
    model=ModelConfig(),
    train=TrainConfig(seed=42),
    tpu=TPUConfig(version="v2-8"),
)
full_config = asdict(config)
```

## Config Hashing

```python
import hashlib
import json

def hash_config(config: dict) -> str:
    """Deterministic hash for config dict. Used in checkpoint names."""
    # Sort keys for determinism
    config_str = json.dumps(config, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(config_str.encode()).hexdigest()[:8]

checkpoint_name = f"ckpt-{config['train']['seed']}-{hash_config(full_config)}-{step}"
```

## Module Versioning

```python
# Each custom module type gets a version string
# Log this in wandb config and save in checkpoint metadata

MODULE_VERSIONS = {
    "router": "topk-gelu-v1.2",
    "ffn": "swiglu-v2.0",
    "ln": "rmsnorm-v1.0",
    "attn": "splash-v1.0",
}

# In checkpoint:
checkpoint = {
    "step": step,
    "model": model.state_dict(),
    "config": full_config,
    "module_versions": MODULE_VERSIONS,
    "git_commit": get_git_commit(),
}
```

## Deterministic Data

```python
# Ensure dataset streaming is deterministic
def create_deterministic_loader(dataset_name, split, seed, epoch):
    ds = load_dataset(dataset_name, split=split, streaming=True)
    ds = ds.shuffle(seed=seed + epoch, buffer_size=10_000)
    # ... shard, tokenize, create loader ...
    return loader
```

## Environment Capture

```python
import os
import subprocess

def capture_environment():
    return {
        "git_commit": subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip(),
        "git_dirty": subprocess.check_output(["git", "status", "--short"]).decode().strip() != "",
        "torch_version": torch.__version__,
        "torch_xla_version": xm.get_xla_supported_devices()[0] if xm.xla_device() else "none",
        "jax_version": jax.__version__,
        "tpu_version": xm.get_tpu_env("TYPE", "unknown"),
        "python_path": os.environ.get("PYTHONPATH", ""),
        "cuda_visible_devices": os.environ.get("CUDA_VISIBLE_DEVICES", "none"),
    }
```

## Comparing Ablations

```python
# Use wandb runs table for side-by-side comparison
# All configs logged to wandb.config allow automatic comparison

# Run naming convention: {model_name}-{module_versions}-{seed}-{git_short}
# Example: moe-base-topk-gelu-v1.2-swiglu-v2.0-42-abc1234
```

## Anti-Patterns

- Don't use different seeds for different runs in the same ablation group
- Don't change batch size or seq len between compared runs (affects gradient statistics)
- Don't forget to log git dirty status — uncommitted changes invalidate reproducibility
- Don't use `torch.backends.cudnn.deterministic` on TPU (cuDNN is GPU-only)
- Don't rely on default RNG states — always call `set_global_seed`
=======
# Reproducible Ablations

## Checklist

- [ ] Seed locked (Python, NumPy, PyTorch, XLA, JAX)
- [ ] Deterministic data pipeline (streaming, no random file order)
- [ ] All hyperparameters in config dict, logged to wandb
- [ ] Custom module versioning (string identifier in config)
- [ ] Checkpoint naming includes config hash
- [ ] Same TPU version across compared runs
- [ ] No environment variable drift between runs
- [ ] Git commit hash logged
- [ ] Batch size and sequence length fixed per ablation group

## Seed Locking

```python
import random
import numpy as np
import torch
import torch_xla.core.xla_model as xm
import jax
import jax.numpy as jnp

def set_global_seed(seed=42):
    """Lock all RNGs. Call before ANY model/data initialization."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

    # XLA TPU RNG
    try:
        xm.set_rng_state(seed)
    except Exception:
        pass

    # JAX RNG
    try:
        jax_key = jax.random.PRNGKey(seed)
        return jax_key
    except Exception:
        return None
```

## Config Dict

```python
from dataclasses import dataclass, asdict
from typing import Optional

@dataclass
class ModelConfig:
    name: str = "moe-base"
    dim: int = 768
    num_layers: int = 12
    num_heads: int = 12
    num_experts: int = 8
    top_k: int = 2
    router_type: str = "topk-gelu"     # version this!
    ffn_type: str = "swiglu"            # version this!
    ln_type: str = "rmsnorm"            # version this!
    attn_kernel: str = "splash"         # version this!
    dropout: float = 0.0

@dataclass
class TrainConfig:
    seed: int = 42
    batch_size: int = 32
    seq_len: int = 512
    lr: float = 1e-4
    warmup_steps: int = 2000
    max_steps: int = 100_000
    weight_decay: float = 0.1
    grad_clip: float = 1.0
    eval_every: int = 1000
    save_every: int = 5000

@dataclass
class TPUConfig:
    version: str = "v2-8"
    mesh_shape: tuple = (8,)
    axis_names: tuple = ("data",)

@dataclass
class ExperimentConfig:
    model: ModelConfig
    train: TrainConfig
    tpu: TPUConfig
    dataset: str = "openwebtext"
    tokenizer: str = "gpt2"
    framework_primary: str = "pt-xla"
    framework_secondary: str = "jax"
    wandb_project: str = "tpu-research"

# Generate full config
config = ExperimentConfig(
    model=ModelConfig(),
    train=TrainConfig(seed=42),
    tpu=TPUConfig(version="v2-8"),
)
full_config = asdict(config)
```

## Config Hashing

```python
import hashlib
import json

def hash_config(config: dict) -> str:
    """Deterministic hash for config dict. Used in checkpoint names."""
    # Sort keys for determinism
    config_str = json.dumps(config, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(config_str.encode()).hexdigest()[:8]

checkpoint_name = f"ckpt-{config['train']['seed']}-{hash_config(full_config)}-{step}"
```

## Module Versioning

```python
# Each custom module type gets a version string
# Log this in wandb config and save in checkpoint metadata

MODULE_VERSIONS = {
    "router": "topk-gelu-v1.2",
    "ffn": "swiglu-v2.0",
    "ln": "rmsnorm-v1.0",
    "attn": "splash-v1.0",
}

# In checkpoint:
checkpoint = {
    "step": step,
    "model": model.state_dict(),
    "config": full_config,
    "module_versions": MODULE_VERSIONS,
    "git_commit": get_git_commit(),
}
```

## Deterministic Data

```python
# Ensure dataset streaming is deterministic
def create_deterministic_loader(dataset_name, split, seed, epoch):
    ds = load_dataset(dataset_name, split=split, streaming=True)
    ds = ds.shuffle(seed=seed + epoch, buffer_size=10_000)
    # ... shard, tokenize, create loader ...
    return loader
```

## Environment Capture

```python
import os
import subprocess

def capture_environment():
    return {
        "git_commit": subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip(),
        "git_dirty": subprocess.check_output(["git", "status", "--short"]).decode().strip() != "",
        "torch_version": torch.__version__,
        "torch_xla_version": torch_xla.__version__ if torch_xla.device() else "none",
        "jax_version": jax.__version__,
        "tpu_version": xm.get_tpu_env("TYPE", "unknown"),
        "python_path": os.environ.get("PYTHONPATH", ""),
        "cuda_visible_devices": os.environ.get("CUDA_VISIBLE_DEVICES", "none"),
    }
```

## Comparing Ablations

```python
# Use wandb runs table for side-by-side comparison
# All configs logged to wandb.config allow automatic comparison

# Run naming convention: {model_name}-{module_versions}-{seed}-{git_short}
# Example: moe-base-topk-gelu-v1.2-swiglu-v2.0-42-abc1234
```

## Anti-Patterns

- Don't use different seeds for different runs in the same ablation group
- Don't change batch size or seq len between compared runs (affects gradient statistics)
- Don't forget to log git dirty status — uncommitted changes invalidate reproducibility
- Don't use `torch.backends.cudnn.deterministic` on TPU (cuDNN is GPU-only)
- Don't rely on default RNG states — always call `set_global_seed`
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/ablations.md
