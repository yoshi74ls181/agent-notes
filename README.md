# agent-notes

Shared notes and tooling for research repositories. Add this repository as a submodule and
use what you need.

| File | Purpose |
|---|---|
| [`report-editing-policy.md`](report-editing-policy.md) | Report content, source format, editing rules, and review |
| [`subproject-structure.md`](subproject-structure.md) | Study layout, generated READMEs, and adoption |
| [`markdown-report-pipeline.md`](markdown-report-pipeline.md) | Markdown-to-HTML builds, notation, and validation |
| [`codex-cli.md`](codex-cli.md) | Non-interactive readers, output capture, and review context |
| [`figure-conventions.md`](figure-conventions.md) | Palettes, data validity, export sizes, and fonts |
| [`circuit-figures.md`](circuit-figures.md) | CircuiTikZ sources, layout, and export |
| [`qultra.md`](qultra.md) | Circuit quantisation, solver pitfalls, and validation |
| `scripts/md_to_html.js` | HTML builder using GitHub Markdown, MathJax, and embedded CSS |
| `scripts/tex_unicode.js` | Unicode-to-LaTeX conversion and unmapped-character guard |

```bash
npm install                          # once: mathjax-full, github-markdown-css
node scripts/md_to_html.js report.md
```

The builder searches upward from itself for `node_modules`, so a host repository that installs
at its own root does not need a second install here. **The build needs the network**: it
converts the markdown through GitHub, one request per report.
