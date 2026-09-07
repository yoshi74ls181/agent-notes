# Subproject structure

Choose a layout that makes sources, results, and instructions easy to find. The following is an optional starting point; names and locations belong to the host project.

```text
study/
  README.md       # purpose, entry points, setup, and commands
  AGENTS.md       # local editing constraints, if needed
  report.md       # findings and limitations, if needed
  LOGBOOK.md      # decisions, experiments, and corrections, if needed
  src/           # reusable code
  scripts/       # runnable analyses and builds
  results/       # outputs with enough provenance to reproduce them
```

Create only what the study needs. Keep each fact in a clear home and link to it elsewhere. The [report editing note](report-editing-policy.md) explains the document roles.

## Local instructions

Keep `AGENTS.md` short and specific to editing the directory:

- Link to the overview and relevant shared notes.
- Give commands that are not obvious from the build configuration.
- State constraints, known failure modes, and required checks.
- Identify generated files and their sources.

Avoid repeating parent instructions, results, or the directory inventory. Add tool-specific instruction files only when that tool needs them; prefer a supported import of the common guidance to a second copy.

## Generated documentation

A hand-written `README.md` is a useful default. Generate it only when shared content would otherwise need to be maintained twice. If a project generates documentation, it should:

1. Identify the source and mark generated files clearly.
2. Provide a reproducible generation command and a check for stale output.
3. Preserve relative links when copying content.
4. Define which directories participate, rather than inferring adoption from files that may be missing.

Scaffolding, README synchronisation, and roster checks are host-project responsibilities; this repository does not provide those tools.
