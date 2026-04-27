<<<<<<< S:/AntiGravity_Skills/ml-engine/references/data-pipeline.md
# Data Pipeline — datasets Streaming with Sharding

## Streaming Setup

```python
from datasets import load_dataset
import torch_xla.core.xla_model as xm

def create_streaming_dataset(
    name="openwebtext",
    split="train",
    tokenizer=None,
    max_length=512,
    seed=42,
    buffer_size=10_000,
):
    ds = load_dataset(name, split=split, streaming=True)
    ds = ds.shuffle(seed=seed, buffer_size=buffer_size)

    # Shard across TPU cores for SPMD
    world_size = xm.xrt_world_size()
    rank = xm.get_ordinal()
    ds = ds.shard(num_shards=world_size, index=rank)

    # Tokenization
    def tokenize(examples):
        return tokenizer(
            examples["text"],
            padding="max_length",
            truncation=True,
            max_length=max_length,
            return_tensors=None,  # handle in collate
        )

    ds = ds.map(tokenize, batched=True, remove_columns=["text"])
    return ds
```

## Sharded Iterable DataLoader

## XLA-Trainer Dataset Patterns

### Pretrain Dataset (Auto-Column Detection)

```python
from data.pretrain_dataset import PretrainDataset

# Auto-detects "text" column, falls back to "data"
ds = PretrainDataset(
    tokenizer=tokenizer,
    dataset=hf_dataset,
    max_length=2048,
    text_column=None,  # auto-detect
)
```

### Conversation Dataset (Chat Template)

```python
from data.conversation_dataset import ConversationDataset

# Auto-detects "messages" column, falls back to "conversations"
# Applies tokenizer.chat_template if available
ds = ConversationDataset(
    tokenizer=tokenizer,
    dataset=hf_dataset,
    max_length=2048,
    conversation_column=None,  # auto-detect
)
```

### Key Patterns from XLA-Trainer

- **Auto-column detection**: No hardcoded column names — detects from dataset schema
- **Padding to `max_length`**: Always pad to fixed length for XLA graph stability
- **`return_tensors="pt"`**: Returns PyTorch tensors directly
- **`squeeze(0)`**: Remove batch dim from tokenizer output (DataLoader adds it back)
- **Labels = input_ids**: For causal LM, labels are shifted by loss function

```python
from torch.utils.data import IterableDataset, DataLoader

class StreamingDataset(IterableDataset):
    def __init__(self, dataset, world_size, rank):
        self.dataset = dataset
        self.world_size = world_size
        self.rank = rank

    def __iter__(self):
        # Each rank iterates its own shard
        for item in self.dataset:
            yield {
                "input_ids": torch.tensor(item["input_ids"], dtype=torch.long),
                "attention_mask": torch.tensor(item["attention_mask"], dtype=torch.long),
            }

def create_dataloader(dataset, batch_size, world_size, rank, num_workers=0):
    it_ds = StreamingDataset(dataset, world_size, rank)
    return DataLoader(
        it_ds,
        batch_size=batch_size,
        drop_last=True,          # Critical for TPU — avoids recompilation
        num_workers=num_workers, # 0 for TPU (XLA doesn't support multi-worker well)
        pin_memory=False,        # TPU doesn't use pinned memory
    )
```

## Multi-Epoch Determinism

```python
def create_deterministic_dataloader(name, split, batch_size, tokenizer, seed, epoch):
    # Seed = base_seed + epoch for different shuffle each epoch
    ds = load_dataset(name, split=split, streaming=True)
    ds = ds.shuffle(seed=seed + epoch, buffer_size=10_000)

    world_size = xm.xrt_world_size()
    rank = xm.get_ordinal()
    ds = ds.shard(num_shards=world_size, index=rank)

    # ... tokenize, create loader ...
    return loader
```

## JAX Data Pipeline

```python
import jax
import tensorflow as tf
import tensorflow_datasets as tfds

def create_jax_dataset(name, split, batch_size, seed=42):
    # Convert TFDS / HF dataset to TF dataset
    ds = tfds.load(name, split=split, shuffle_files=True)
    ds = ds.shuffle(10_000, seed=seed)
    ds = ds.batch(batch_size, drop_remainder=True)

    # Convert to JAX iterator
    for batch in tfds.as_numpy(ds):
        yield {
            "input_ids": jax.numpy.array(batch["input_ids"]),
            "labels": jax.numpy.array(batch["labels"]),
        }
```

## Buffer Size Tuning

| Dataset Size | Buffer Size | Memory Impact |
|-------------|-------------|---------------|
| < 1M rows | 10_000 | Low |
| 1M - 100M | 100_000 | Medium |
| > 100M | 1_000_000 | High (but better shuffle) |

Rule: `buffer_size` ≈ `0.1%` of dataset size, capped at available RAM.

## Anti-Patterns

- Don't use `shuffle=True` on `DataLoader` for streaming — it buffers the entire stream
- Don't forget `drop_last=True` on TPUs — padding uneven batches causes XLA recompilation per shape
- Don't use `num_workers > 0` with `torch_xla` — it deadlocks
- Don't load full dataset into RAM for large corpora (Pile, C4, etc.)
=======
# Data Pipeline — datasets Streaming with Sharding

## Streaming Setup

```python
from datasets import load_dataset
import torch_xla
from torch_xla import runtime as xr

def create_streaming_dataset(
    name="openwebtext",
    split="train",
    tokenizer=None,
    max_length=512,
    seed=42,
    buffer_size=10_000,
):
    ds = load_dataset(name, split=split, streaming=True)
    ds = ds.shuffle(seed=seed, buffer_size=buffer_size)

    # Shard across TPU cores for SPMD
    world_size = xr.world_size()
    rank = xr.global_ordinal()
    ds = ds.shard(num_shards=world_size, index=rank)

    # Tokenization
    def tokenize(examples):
        return tokenizer(
            examples["text"],
            padding="max_length",
            truncation=True,
            max_length=max_length,
            return_tensors=None,  # handle in collate
        )

    ds = ds.map(tokenize, batched=True, remove_columns=["text"])
    return ds
```

## Sharded Iterable DataLoader

## XLA-Trainer Dataset Patterns

### Pretrain Dataset (Auto-Column Detection)

```python
from data.pretrain_dataset import PretrainDataset

# Auto-detects "text" column, falls back to "data"
ds = PretrainDataset(
    tokenizer=tokenizer,
    dataset=hf_dataset,
    max_length=2048,
    text_column=None,  # auto-detect
)
```

### Conversation Dataset (Chat Template)

```python
from data.conversation_dataset import ConversationDataset

# Auto-detects "messages" column, falls back to "conversations"
# Applies tokenizer.chat_template if available
ds = ConversationDataset(
    tokenizer=tokenizer,
    dataset=hf_dataset,
    max_length=2048,
    conversation_column=None,  # auto-detect
)
```

### Key Patterns from XLA-Trainer

- **Auto-column detection**: No hardcoded column names — detects from dataset schema
- **Padding to `max_length`**: Always pad to fixed length for XLA graph stability
- **`return_tensors="pt"`**: Returns PyTorch tensors directly
- **`squeeze(0)`**: Remove batch dim from tokenizer output (DataLoader adds it back)
- **Labels = input_ids**: For causal LM, labels are shifted by loss function

```python
from torch.utils.data import IterableDataset, DataLoader

class StreamingDataset(IterableDataset):
    def __init__(self, dataset, world_size, rank):
        self.dataset = dataset
        self.world_size = world_size
        self.rank = rank

    def __iter__(self):
        # Each rank iterates its own shard
        for item in self.dataset:
            yield {
                "input_ids": torch.tensor(item["input_ids"], dtype=torch.long),
                "attention_mask": torch.tensor(item["attention_mask"], dtype=torch.long),
            }

def create_dataloader(dataset, batch_size, world_size, rank, num_workers=0):
    it_ds = StreamingDataset(dataset, world_size, rank)
    return DataLoader(
        it_ds,
        batch_size=batch_size,
        drop_last=True,          # Critical for TPU — avoids recompilation
        num_workers=num_workers, # 0 for TPU (XLA doesn't support multi-worker well)
        pin_memory=False,        # TPU doesn't use pinned memory
    )
```

## Multi-Epoch Determinism

```python
def create_deterministic_dataloader(name, split, batch_size, tokenizer, seed, epoch):
    # Seed = base_seed + epoch for different shuffle each epoch
    ds = load_dataset(name, split=split, streaming=True)
    ds = ds.shuffle(seed=seed + epoch, buffer_size=10_000)

    world_size = xr.world_size()
    rank = xr.global_ordinal()
    ds = ds.shard(num_shards=world_size, index=rank)

    # ... tokenize, create loader ...
    return loader
```

## JAX Data Pipeline

```python
import jax
import tensorflow as tf
import tensorflow_datasets as tfds

def create_jax_dataset(name, split, batch_size, seed=42):
    # Convert TFDS / HF dataset to TF dataset
    ds = tfds.load(name, split=split, shuffle_files=True)
    ds = ds.shuffle(10_000, seed=seed)
    ds = ds.batch(batch_size, drop_remainder=True)

    # Convert to JAX iterator
    for batch in tfds.as_numpy(ds):
        yield {
            "input_ids": jax.numpy.array(batch["input_ids"]),
            "labels": jax.numpy.array(batch["labels"]),
        }
```

## Buffer Size Tuning

| Dataset Size | Buffer Size | Memory Impact |
|-------------|-------------|---------------|
| < 1M rows | 10_000 | Low |
| 1M - 100M | 100_000 | Medium |
| > 100M | 1_000_000 | High (but better shuffle) |

Rule: `buffer_size` ≈ `0.1%` of dataset size, capped at available RAM.

## Anti-Patterns

- Don't use `shuffle=True` on `DataLoader` for streaming — it buffers the entire stream
- Don't forget `drop_last=True` on TPUs — padding uneven batches causes XLA recompilation per shape
- Don't use `num_workers > 0` with `torch_xla` — it deadlocks
- Don't load full dataset into RAM for large corpora (Pile, C4, etc.)
>>>>>>> C:/Users/shaur/.windsurf/worktrees/AntiGravity_Skills/AntiGravity_Skills-11bf4390/ml-engine/references/data-pipeline.md
