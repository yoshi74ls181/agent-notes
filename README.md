# agent-notes

Notes and tooling that are not specific to any one research project, kept in one place so
several repositories can share them. Add this repository as a submodule and use what you need.

| | |
|---|---|
| [`markdown-report-pipeline.md`](markdown-report-pipeline.md) | Authoring a report in markdown and building it to a single self-contained HTML file: the conventions, the Unicode-to-MathJax conversion, and the traps |
| `scripts/md_to_html.js` | The builder. `node scripts/md_to_html.js <report.md>` |
| `scripts/tex_unicode.js` | The Unicode-to-LaTeX conversion the builder applies, and the guard that refuses a character it does not know |
| `scripts/report.css` | The default stylesheet, inlined into the generated HTML |

```bash
npm install                          # once: pulls mathjax-full
node scripts/md_to_html.js report.md
```

The builder searches upward from itself for `node_modules`, so a host repository that installs
`mathjax-full` at its own root does not need a second install here.
