# Prompts — ASD-STE100 Compliant

This directory holds long-form, versioned, STE-controlled LLM prompts for `flickity-mepto`.

## Naming

- `000-template.md` — template
- `NNN-kebab-case-title.md` — zero-padded, strictly increasing (e.g. `001-migrate-build.md`)

## Authoring Standard — ASD-STE100 Issue 8

- Use approved STE dictionary (~900 words) + project technical names.
- One idea per sentence, max 20 words (25 for descriptive).
- Active voice, imperative for procedures, simple present/past/future `will`.
- No synonyms, no verbing nouns, vertical numbered lists for steps.
- Max 6 sentences per paragraph.

## Static Analysis

Before use, run:

```sh
npx vale prompts/*.md
npx markdownlint-cli2 prompts/*.md
npx cspell lint prompts/*.md
```

CI blocks prompts that fail STE lint. Fix the prompt, not the linter. No prompt is executed until it passes.

## References

- https://www.asd-ste100.org/
- Vale `vale-llm-slop` STE ruleset
