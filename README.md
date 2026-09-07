# agent-notes

Notes and tooling that are not specific to any one research project, kept in one place so
several repositories can share them. Add this repository as a submodule and use what you need.

| | |
|---|---|
| [`report-editing-policy.md`](report-editing-policy.md) | What goes in a report and what does not: which document carries what, the source form, and the rules a draft is edited against |
| [`subproject-structure.md`](subproject-structure.md) | How a study directory is laid out: which file is the source for which, the shape of its `AGENTS.md`, and how a new one picks it up |
| [`markdown-report-pipeline.md`](markdown-report-pipeline.md) | Authoring a report in markdown and building it to a single self-contained HTML file that looks like a GitHub README: the conventions, the Unicode-to-MathJax conversion, and the traps |
| [`codex-cli.md`](codex-cli.md) | Driving the Codex CLI non-interactively, to get a reader from outside the local model family: the flags, writing the reply to a file, restricting what it can see, and the traps |
| [`figure-conventions.md`](figure-conventions.md) | The rules for every plot: choosing a colour encoding, validated palettes, showing data you do not trust, opaque backgrounds, and the GR font traps |
| [`circuit-figures.md`](circuit-figures.md) | Drawing a circuit schematic in CircuiTikZ as a `standalone` LaTeX document: sizing it for its output, the conventions, and the collisions only a render will show |
| [`qultra.md`](qultra.md) | Using QuLTRA to quantise a circuit with lumped and distributed elements together: the four traps, one of which fails silently and poisons every participation ratio at once |
| `scripts/md_to_html.js` | The builder: GitHub's `/markdown` API for the prose, MathJax for the maths, `github-markdown-css` for the style. `node scripts/md_to_html.js <report.md>` |
| `scripts/tex_unicode.js` | The Unicode-to-LaTeX conversion the builder applies, and the guard that refuses a character it does not know |

```bash
npm install                          # once: mathjax-full, github-markdown-css
node scripts/md_to_html.js report.md
```

The builder searches upward from itself for `node_modules`, so a host repository that installs
at its own root does not need a second install here. **The build needs the network**: it
converts the markdown through GitHub, one request per report.
