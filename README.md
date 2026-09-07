# agent-notes

Reusable notes and scripts for research and technical writing. Use the parts that fit your project; these notes do not impose a repository layout, writing style, or review workflow.

| Note | Purpose |
|---|---|
| [Report editing](report-editing-policy.md) | Clear claims, evidence, limitations, and review |
| [Subproject structure](subproject-structure.md) | Document roles and a minimal directory layout |
| [Markdown report pipeline](markdown-report-pipeline.md) | Build a Markdown report into HTML |
| [Codex CLI](codex-cli.md) | Run a non-interactive review and capture its output |
| [Figure conventions](figure-conventions.md) | Accessible, reproducible scientific figures |
| [Circuit figures](circuit-figures.md) | CircuiTikZ sources, export, and layout checks |
| [QuLTRA](qultra.md) | Validation checks for circuit quantisation |

## Build a report

Install Node.js with built-in `fetch` support (18 or later), then run:

```sh
npm install
node scripts/md_to_html.js report.md
```

The builder writes `report.html` beside the source. It uses GitHub's Markdown API, local MathJax, and an embedded stylesheet. **Building requires a network connection and sends the report text to GitHub.** Supported local images are embedded; see the [pipeline note](markdown-report-pipeline.md) for source conventions and limitations.

You can also vendor this repository as a submodule. The builder searches upward from its own directory for dependencies, or accepts a `node_modules` path as its second argument.

## Keep shared material small

- Keep project results, run logs, paths, and local constraints in the project that owns them.
- Add a shared note only when the guidance applies across projects. State tool-specific scope and link to sources for version-sensitive behavior.
- Give each topic one home and link to it. Prefer a short rule and a useful example to an incident narrative.
- Document only tools that exist here; label host-project examples as optional.
- Keep script comments focused on contracts and non-obvious behavior. Check affected behavior when changing code.
