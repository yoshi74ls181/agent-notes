# How a subproject is laid out

The file layout and adoption process for a study directory.
For document audiences and content, see [`report-editing-policy.md`](report-editing-policy.md) §0.

The scaffolding, synchronisation, and checker commands below are host-project tools; they are not included in this repository.

> **This policy is opt-in through the project's roster.**
> Checkers ignore unlisted directories, including studies with hand-written READMEs.
> Use an explicit roster rather than inferring adoption from existing files, so a missing required `AGENTS.md` is caught rather than treated as opting out.

## The files

| Path | What it is |
|---|---|
| `<owner>-<topic>/AGENTS.md` | **The single source for the directory.** Agent-facing, loaded into every session in the subtree, and the origin of `README.md`. |
| `<owner>-<topic>/CLAUDE.md` | A one-line shim holding `@AGENTS.md`, matching the repo root. Claude Code loads the shim and the import pulls in the real file; other agent tools read `AGENTS.md` directly. |
| `<owner>-<topic>/README.md` | **Generated** from the marked region of `AGENTS.md` by `scripts/sync_readme.py`. Never edited by hand. |
| `<owner>-<topic>/LOGBOOK.md` | The project record: every measured number in script order, plus the history and the corrections. |
| `<owner>-<topic>-report.md` | The write-up, **at the repo root**, built to `<owner>-<topic>-report.html` by the report builder ([`markdown-report-pipeline.md`](markdown-report-pipeline.md)). Indexed from the root `README.md`. |
| `<owner>-<topic>/src/`, `scripts/`, `results/` | Code, one study per script, and the data and figures they write. |

A directory may add documents — a `manuscript/`, a `refs/` — and may leave any of the above out if it has nothing to put there.
What it may not do is keep two documents with the same job.

## The shape of `AGENTS.md`

```markdown
<!-- readme:title: A human-readable title for the generated README -->
# AGENTS.md

Guidance for Claude Code working in `<owner>-<topic>/`. The structural policy is in
this note; the repo-wide git rules are in [`../AGENTS.md`](../AGENTS.md). Neither is
repeated here.

<!-- readme:begin -->
## What it concluded      <- one paragraph, no measured numbers, then pointers
## Start here             <- which document answers which question
## Layout                 <- the src/ tree, and where results land
## Findings and limits     <- pointers only: the findings live elsewhere
<!-- readme:end -->

## Running things          <- the invocation pattern and what a filename cannot tell you
## Traps that have cost time here
## Constraints on what you may write
## Editing the deliverables
```

The marked region is copied verbatim into `README.md` and must read as human orientation.
Keep agent-facing traps, contracts, and prohibitions outside the markers.

Both files sit in the same directory, so relative links inside the marked region resolve identically in each and need no rewriting.

## Starting one

```bash
python scripts/new_subproject.py <owner>-<topic> "A human-readable title"
```

That writes a conforming skeleton — `AGENTS.md` with the markers and the section headings, the `CLAUDE.md` shim, a `LOGBOOK.md` stub, the `src/`, `scripts/` and `results/` directories, and a generated `README.md` — then leaves the prose to you.
It adds the directory to the roster, and it refuses to overwrite an existing directory.

## Keeping one

```bash
python scripts/check_subproject.py     # structure
python scripts/sync_readme.py --check  # README matches its source
```

Put both in the project's gate list.
The first checks that an opted-in directory has the file set, that `CLAUDE.md` is the shim and nothing more, that the markers are present and ordered, and that `README.md` carries the generated banner rather than hand-written prose.
The second checks that `README.md` is what its `AGENTS.md` currently implies.

Neither looks at a directory that is not on the roster, and naming one explicitly is how you find out what it would have to change to join.

## The roster

Keep the roster in the host project: one directory per line, ignoring blank lines and `#`-comments.

Adding a directory opts it into the checks, including missing-file checks.
Removing it opts it out.
Other tooling should use the roster rather than hard-coded study names.
