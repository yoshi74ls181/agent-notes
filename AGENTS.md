# AGENTS.md

Guidance for agents working in this repository.

This repository holds notes and tooling shared between research repositories, and it is consumed as a git submodule.
Nothing in it is specific to any one host repository.
A host repository pins a commit, so a change here reaches a host only when that host moves its pointer.

## How to write the files in this repository

**Do not hard-wrap, and put a line break after every sentence.**
This applies to every markdown file here and to every comment in `scripts/`.
One sentence is one line, however long that line becomes, and a paragraph is as many lines as it has sentences.
Blank lines still separate paragraphs.

The reason is that a sentence is the unit that gets edited.
Hard wrapping at a column reflows unrelated text into a diff whenever a word is added near the start of a paragraph, so a one-word fix shows up as a rewritten paragraph and a reviewer cannot see what changed.
Putting the whole paragraph on one line fixes that but replaces it with a different problem: the diff is then correct but unreadable, because every change to a paragraph shows as one enormous line replaced by another.
Breaking after each sentence gives a diff whose changed lines are the changed sentences.
It also makes a moved sentence show up as a move rather than as two rewrites.

What is exempt, because it is not prose:

- Fenced code blocks, and indented code blocks.
- Table rows.
- Headings.
- HTML comments, such as the `readme:` markers.
- Display maths.
- Aligned or tabular material inside a script comment.

Two things this rule is **not**:

- It is not a line-length limit.
  A long sentence stays on one long line.
  Do not break a sentence to fit a column, and do not join two sentences to fill one.
- It is not the rule that [`report-editing-policy.md`](report-editing-policy.md) §4 sets for report sources in host repositories, which is that one paragraph is one line.
  Those two rules govern different files and they are deliberately different.
  Do not change either to match the other.

`scripts/semantic_breaks.py` applies the rule and checks that applying it changed no content.
Run it with `--check` to see what it would do without writing:

```bash
python scripts/semantic_breaks.py --check *.md scripts/*.js
python scripts/semantic_breaks.py *.md scripts/*.js
```

For markdown it verifies that the visible word sequence is unchanged.
For a script it verifies something stronger, because a script has to keep running: that every non-comment line is byte-identical and that no comment word moved.
It is idempotent, so running it on a compliant file rewrites nothing.

## The rest of the repository

`scripts/md_to_html.js` is the report builder and `scripts/tex_unicode.js` is its Unicode-to-TeX layer.
[`markdown-report-pipeline.md`](markdown-report-pipeline.md) documents both.
**A change to either script changes every report in every host repository**, so rebuild a report in a host repository and compare the artifact before landing one.
The build is deterministic given the same input and the same GitHub renderer, so a rebuild that changes the artifact means something changed.

The two build-time dependencies are `mathjax-full` and `github-markdown-css`.
There is no `scripts` block in `package.json`, so call the builder with `node` directly.

## Notes in this repository

Each note is the durable record for its topic, so a host repository should link to it rather than restate it.

| note | what it covers |
|---|---|
| [`report-editing-policy.md`](report-editing-policy.md) | what a report carries, who it is written for, and the three-reader pass |
| [`markdown-report-pipeline.md`](markdown-report-pipeline.md) | the markdown-to-HTML build, its conversions, and its guards |
| [`figure-conventions.md`](figure-conventions.md) | palettes, colour encoding, validity marking, and figure output sizes |
| [`circuit-figures.md`](circuit-figures.md) | schematics |
| [`subproject-structure.md`](subproject-structure.md) | how a study directory is laid out and which file is the source for which |
| [`codex-cli.md`](codex-cli.md) | driving a foreign-family model as a reader in the three-reader pass |
| [`qultra.md`](qultra.md) | the circuit-quantisation package, and the four checks to run before using its results |

**A note earns its rules from something that went wrong.**
When a pass or a build teaches something that outlives one study, put it in the matching note with the evidence, and say what it cost.
A rule with no incident behind it is a preference, and it will be ignored.
