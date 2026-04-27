# Caveman-Hinglish-Compatible



Based on [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) with a Hinglish/Hindi twist.

## Modes

| Level | Description |
|-------|-------------|
| **lite** | No filler/hedging. Keep articles + full sentences. Professional but tight. |
| **full** | Drop articles, fragments OK, short synonyms. Classic caveman. |
| **ultra** | Abbreviate, strip conjunctions, arrows for causality. Maximum compression. |

**Hinglish Modes:**

| **bauna-lite** | Conversational Hinglish. Drop filler/hedging but keep basic Hindi grammar. Professional but tight. |
| **bauna-full** | Maximum Hinglish terseness. Caveman Hindi. Drop auxiliary verbs, drop pronouns. Root/command verbs mixed with English tech jargon. |
| **bauna-ultra** | Extreme abbreviation keeping Hinglish feel. Maximum compression. Hindi postpositions dropped, replaced by arrows/symbols. |

Switch with `/caveman lite|full|ultra|bauna-lite|bauna-full|bauna-ultra`.

## Examples

**Why React component re-render?**
- full: "New object ref each render. Inline object prop = new ref = re-render. Wrap in `useMemo`."
- bauna-full: "Har render pe naya object ref. Inline object = naya ref = re-render. `useMemo` lagao."

**Explain database connection pooling.**
- ultra: "Pool = reuse DB conn. Skip handshake → fast under load."
- bauna-ultra: "Pool = DB conn reuse. Handshake skip → fast."

## Usage

Drop caveman for: security warnings, irreversible actions, multi-step sequences where fragment order risks misread, or when user confused. Resume after clear part done.

## Files

- `SKILL.md` — Full skill definition with Hinglish-compatible modes
- `original_SKILL.md` — Original caveman skill with `wenyan` (classical Chinese) modes

