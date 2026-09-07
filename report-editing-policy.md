# Report editing

Write for someone who knows the field but has not followed the project. Lead with the result or recommendation, then explain the method, evidence, and limits in logical order. Adapt these guidelines to the report's audience and purpose.

## Give each document a clear role

| Document | Content |
|---|---|
| `README.md` | Purpose, entry points, setup, and how to run the work |
| `AGENTS.md` | Constraints and checks an agent needs before editing |
| Report | Findings, supporting evidence, methods, and limitations |
| Logbook | Experiments, decisions, failed approaches, and corrections |
| Code and data | Executable methods, inputs, outputs, and provenance |

Use only the documents you need. Link to detailed results instead of copying them into every overview. Edit generated deliverables through their sources. See [subproject structure](subproject-structure.md) for a possible layout.

## Make the argument readable

- Make the summary understandable on its own. State the outcome, useful numbers, and material conditions; avoid unexplained notation.
- Introduce quantities, units, acronyms, and nonstandard terms before using them. Keep one meaning per name or symbol.
- Explain the general case before exceptions. Name the condition that separates cases.
- Use headings that tell readers what a section contains. Cross-reference named sections or objects.
- State facts directly. Cut repeated conclusions, self-commentary, and subjective praise of numerical agreement.
- Keep development history in the logbook unless it is evidence the report needs. Retain relevant baselines and comparisons, clearly labelled.

## Keep claims checkable

- Trace reported numbers and figures to the specific data, script, configuration, or cited source that supports them. Finding the same number in an unrelated run is not verification.
- State units, sign conventions, baselines, and any corrections needed to compare measurements.
- Distinguish predictions, fits, measurements, and assumptions. Evaluate formulas when the numerical result supports a claim.
- Check arithmetic and consistency across prose, tables, equations, and figures. Round to the precision the method supports; a fine numerical value does not imply a finely located peak on a coarse grid.
- Preserve limitations: validity range, convergence, resolution, uncertainty, and what the method cannot establish.
- Mark invalid or unresolved results and explain exclusions. Do not silently remove inconvenient data or present it as valid. See [figure conventions](figure-conventions.md).

## Keep the source maintainable

Use the project's chosen source format and wrapping style consistently. For Markdown, keep each paragraph or sentence as a logical unit rather than reflowing unrelated text. Put code identifiers and paths in backticks.

Choose notation the target renderer supports. Use display equations for expressions readers need to inspect, and verify rendered structure after changing notation. The [Markdown pipeline](markdown-report-pipeline.md) documents this repository's Unicode conversion and source conventions; those are tool-specific choices.

## Review after editing

1. Read the summary and section openings in order. Check that definitions precede use and that the stated scope matches the body.
2. Verify changed claims against their actual sources, including units, rounding, and conditions.
3. Check links, figure references, and generated outputs. Inspect figures at their intended display size.
4. After moving or deleting material, check for lost qualifications, stale cross-references, duplicate conclusions, and obsolete values.
5. Run the project's relevant checks again after applying review feedback.

For substantial reports, separate evidence checking from a first-time reader's assessment of clarity. Independent review can help, but the project chooses the reviewers and tools. Give each reviewer a clear scope and ask for quoted passages, evidence, suggested changes, and a distinction between confirmed errors and open questions. Record the version reviewed; line numbers become stale after edits. See [Codex CLI](codex-cli.md) for one way to capture a review.
