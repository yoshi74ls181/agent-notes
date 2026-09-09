# Editing policy for reports

**Rules here are stated, not justified**, under "State the rule" at the end of [`AGENTS.md`](AGENTS.md).

A report is **reader-facing**: a newcomer should follow the science in logical order without learning the project's discovery history.

This note covers report content and source form.
The build is documented in [`markdown-report-pipeline.md`](markdown-report-pipeline.md); figure conventions and study layout have separate notes.

The rules are ordered by what an agent needs first when drafting.
§8 and §9 are the procedures for a report that already exists.
A removed section leaves its number vacant rather than renumbering the ones after it, and a new section takes the next free number rather than a vacated one.

## 0. Which document carries what

| document | reader | carries | does not carry |
|---|---|---|---|
| `AGENTS.md` | an agent about to change something | what is needed *before* opening anything: what the study is in a paragraph, which document answers which question, the constraints that stop a wrong edit, and the contracts an editor must not break. A number only when the number *is* the constraint | a fact rather than a constraint on action — link to the document that owns it. Any other finding. Prefer a pointer to a précis, and keep it under about 150 lines |
| `README.md` | a human arriving at the directory | brief orientation only: what this is, who owns it, where to start, the code layout, how to run it. One line on what the study concluded | any other finding, and any result `report.md` or `LOGBOOK.md` owns |
| `report.md` | a human who has never seen the project | the science, in logical order, and the limits on it. Where a dead end is the reason an observable is defined a particular way, the definition and the measurement constraint it left behind, without the failure. A wrong alternative only as a conditional | project history of any kind. A chronological order. Its scope is whatever story it tells, which may be one extension rather than the whole subproject, and it is not widened to cover more |
| `LOGBOOK.md` | someone continuing the work | **the project record**: every measured number, in script order, what each measured field means, and the history — what was tried, what failed, what was corrected and why. Every superseded claim, dead end and correction the rules below take out of the report, and any finding with no place in the report's story. May be chronological | — |
| `scripts/*` | someone re-running or extending a measurement | the method, and the traps in it, next to the code that hits them | — |
| the project's shared notes | someone starting the next study | anything that outlives this one | anything naming a study or a path that exists in one repository only |
| `report.html` | whoever the report is sent to | nothing of its own — it is regenerated on every build, so any edit to it is lost | — |

**A line belongs in `AGENTS.md` only if:** *would someone about to edit do the wrong thing without it?*

**Findings are owned by `report.md` and `LOGBOOK.md`,** and the two may cover the same material in different orders; do not collapse them.

## 1. Write for a working experimentalist, and define what survives

**Assume a working experimentalist in the report's field.**
Leave standard vocabulary unexplained.
For unfamiliar concepts, retain the correct name and add one operational sentence stating what was computed.

**Do not assume the reader has read the source paper.**

- **Minimise them.**
  Give a quantity its plain-English name.
  The one exception is the section reproducing the paper's own formula.
- **Define what survives, once, before it is used**, in a short table ahead of the first section that needs it.
- **That table declares dimensions and signs, not only meanings.**
  Say which entries are frequencies and which are dimensionless, and whether the table gives magnitudes or signed coefficients where the body carries a signed matrix of the same quantities.
  Say which values are design *targets* and which are consequences.
- **The summary box uses no symbol at all.**
  It sits before that table.
  Write the quantity out; every number must survive the translation.
  Do not gloss a symbol inline — remove it.
  Audit the box after every edit: extract it, grep for `[A-Za-z]_[A-Za-z0-9]` and for a caret, **then grep for every non-ASCII character in it and read what comes back**, and check every number in it still appears in the body.
  The underscore pattern alone is not enough: it passes κ, ω, Σ, and any bare single letter standing for a quantity.
- **Audit the box's comparatives, not only its symbols.**
  Any superlative or comparative in it — best, worst, beats everything, the largest — is a claim about the whole document and is checked against every table in it.
- **Name a proxy as a proxy where it first appears, including in the box.**
  A quantity standing in for a measurement — a damage estimate, a figure of merit, an infidelity proxy — carries its metric and its normalisation at first use.
  "Estimate" is not enough where the coefficient, the saturation rule and the choice of representative value are conventions; name them.
- **Expand every acronym on first use,** including the ones that name the device.
- **Name a special function on first use, and give the particular numerical facts the report leans on** — the peaks, zeros and limits its results sit on.
- **Name a sibling study rather than pointing at it.**
- **A quantity whose value would come out differently if the reader computed it from its standard definition is defined in the table, with the difference named.**
  Give beside it the derived quantity that does reproduce the printed value.
- **The units the table declares are the units the display equations use.**
  A symbol declared dimensionless, or in units of a natural quantum, does not appear as the argument of a trigonometric function or an exponential without a visible conversion.
- **A row or sentence stating how the document words something is verified by grep before it is written**, over headings, table headers, captions and figure text, not only body prose.
  If it cannot be verified, leave it out.

## 2. Order by logic, not by discovery, and keep the history out

The report says what is true, not how it came to be believed.

Delete discovery narratives such as "an earlier version" or "originally", and first person.

**Deleting the narrative is not deleting the choice.**
Where "an earlier version did X" is the only place the report says why it does Y, rewrite it as a statement of what it does and why, then check the replacement still carries the reason.

**A limitation that governs a table belongs beside that table.**
State it where the numbers are read and keep the full version where the limits are collected.
The same goes for a stipulated input that can reverse a comparison: name it as consequential wherever the comparison appears.

**A caption carries neither the figure's edit history nor a branch of its plotting code that did not fire.**
The justification for a *choice the reader can see* — a zero baseline, an equal aspect ratio — does belong there.

**Superseded design targets are history too.**
After retargeting, sweep prose, tables and formulas for values and comparisons carried over from the old design point.

**The report presents one device.**
Every comparison against a previous one is history, however quantitative, and every number from it is wrong.
A retarget is a sweep of the whole document.

**When a reader points at a sentence, grep the document for the *shape* before replying.**

**General case first, special case second.**
Introduce a controlling parameter *before* the cases it distinguishes, and let each case follow from where it sits.
**Make the fork explicit**: a short hinge section stating the regimes and what each implies.
**The summary box leads with the recommendation** — what should someone build, and what does it cost.

**The summary has to stand alone.**
Three constraints the body does not obey:

* **No terminology the report itself invents.**
  Standard vocabulary of the field is fine.
  A coined term is glossed in the same breath or left to the body.
* **No justifying the claims.**
  The finding, not the evidence for it.
* **Numbers, yes — the conclusions are the numbers.**
  Avoid only the number whose *meaning* needs the body.

**A headline in absolute units needs one anchor**: a comparison against a standard alternative, a bound, or an explicitly unreachable ideal.
Put the anchor in the limitations at **one significant figure**, not in the summary box.

## 3. One name, one meaning

A symbol, a word or a phrase means exactly one thing in a document.

**Rename symbols reused for unrelated quantities.**
Remove the symbol entirely when the quantity does not need a name.

**Name objects distinctly.**
Name each on first use and distinguish them.

**Name the referent when a word could stand for several numbers**, such as different quantities in a table and on a figure axis.

**Identify the measurement variant behind every quoted number**, or use one variant throughout.
This extends to a parameter that counts something, which is quoted with what it counts; a bare count is ambiguous between the parameter and the quantity it expands to.

**A figure's axis labels, legend entries and on-canvas annotations are part of the document's naming, and are swept with the prose.**
A quantity does not carry one name in the prose and another on the figure that shows it.
A reference line or marker draws the same variant of a quantity that the prose quotes, or its caption says which variant it draws.

**A quantity that aggregates part of a system is not named as though it aggregated all of it.**
State which components are included, which are left out, and the statistical model.

**Keep a property of the object separate from what the method can handle.**
Where a method excludes a case, say which computational assumption fails rather than redefining the object to match it.

**A dimensionless ratio names what it is referred to.**

**Finding them.**
Extract every symbol and every capitalised or quoted term and list the distinct quantities each denotes.
Where a system holds several instances of a component, the bare noun is never safe: name the instance.
Where a script computes a number in more than one place, check the places agree before quoting either.

## 4. The source is portable markdown: Unicode maths, no HTML

The source carries **neither raw HTML nor inline LaTeX**.

**Inline maths is Unicode.**
Convert an expression only when no backslash and no brace is left, so that nothing is ever half-rewritten.
A subscripted word stays as an underscore and its letters.

**The build sets those underscores as real subscripts**, with `scripts/md_to_html.js` setting them as `<sub>`.
Two consequences:

- **A subscript is one letter, an underscore, then letters or digits.** `snake_case` is left alone.
- **Put code in backticks.**
  A single-letter variable name in bare prose will be set as a subscript; backticked spans are never touched. `proseSubscript` in `scripts/tex_unicode.js` is the rule.

**Display equations stay as `$$...$$`.**
Display a load-bearing formula even when it fits on one line.
Asides, restated definitions and unit conversions may stay inline.

**Use Unicode for the symbols inside the `$$` too.**
Three things stay macros:

* **Function names**, which are set upright.
* **Multi-letter sub- and superscripts.**
  Use `\mathrm{}`.
* **Structure**: `\frac`, `\sqrt`, `\begin{gathered}`, `\\`, `\,`, `\qquad`.

Nothing is converted inside text and upright-roman arguments.
**None of this applies to the prose**, which never goes near MathJax.

**Verify notation rewrites by comparing rendered MathML.**
The build rejects unknown Unicode; see the conversion table in [`markdown-report-pipeline.md`](markdown-report-pipeline.md).

**What no-HTML costs, and accept it:** semantic colouring becomes bold, multi-column layouts become sequential sections, badges fold into their heading text, and sub- and superscripts become Unicode where the character exists and `^x` or `_x` where it does not.

**The project needs its own check** that counts raw tags, inline maths and stray macros outside display blocks and exits non-zero.

## 5. Sections are numbered, and cross-references name their target

**Number every section and subsection, to whatever depth the report goes.** `## 4.` and `### 4.2` in the main text; `## C.`, `### C.2` and `#### C.2.1` in the appendices.
Front matter ahead of the first section is not a section and takes no number.

Never "the previous section" or "as discussed above".
Name the section by its number, or name the object.

**A pointer whose target is the section containing it is a defect, not a redundancy.**
Check every `§n` against the heading above the sentence that carries it.

**A row index, a column position or a marker on a figure is a cross-reference too.**
Prefer naming the row by its scheme, the column by its heading and the marker by what it marks.
Where an index is unavoidable, re-derive every one after inserting or deleting a row.

## 8. When restructuring an existing report

1. **Diff the visible word multiset before and after.**
   Content meant to move verbatim should show zero losses.
2. **Re-read the first sentence of every section in order.**
3. **Re-check every claim of scope against the new scope.**
4. **Check that every symbol is still introduced before it is used.**
   Walk the symbols in order of first appearance.
5. **Deleting a section needs its own sweep.**
   Grep the deleted section for every number, symbol and proper noun it contained, then grep the survivor for each.
   Check the display equations and the figures, including any left on disk with nothing pointing at them.

## 9. The three-reader pass

Three readers, none of them the author.
**Run the first two at once**; **run the third only after both sets of findings are in the document.**
Readers 2 and 3 come from a different model family than reader 1.

### Reader 1, the referee

**An agent with the whole repository**, including the report, logbook, result logs, scripts, and this policy.
Check every number against evidence, the science, signs, and scope.
Ask it to record what it checked and found correct, not only what is wrong.

### Reader 2, the second-year graduate student

**A foreign-family agent given only the report and its figures.**
Read front to back and quote every passage requiring a reread or guess.
Identify unexplained nonstandard terms, §3 name collisions, arithmetic that does not close, and definitions introduced late.
Say where a first-time reader would give up and what order would help.

Two things this reader needs and the others do not:

- **Attach raster renders of any vector figure, and ask about them specifically.**
- **Say that the report has already been reviewed**, or it invents concerns to fill every heading, and **say that the reply must cover the whole document**, or it reads the first fifty lines exhaustively and stops.

### Readers 1 and 2, and what comes back from them

**Ask readers 1 and 2 about structure explicitly:** what belongs earlier, what is misplaced, and whether the order carries the argument.

**Ask both readers for aggressive cuts wherever a cut streamlines the logic.**
A passage that does not carry the argument goes, however well written, and material whose place is the logbook is named as such.
Each proposed cut gives the section, the line range, what it removes, and what is lost.

**Ask reader 1 to propose additions and modifications to this policy, and reader 2 additions only**, in a section of their own.
Ask them to only make proposals which are generalizable to other projects.

**Freeze the document before the readers are convened.**
Record its byte hash in the invocation and at the head of each feedback file, and do not edit the report or regenerate the result files it quotes while any reader is running.
If a rebuild lands mid-pass, re-run the affected reader rather than merging findings written against two texts.

**Both readers' findings go to a file, in one invocation each, not into messages.**
Reader 1 writes its own; reader 2's comes from pointing the runner's last-message-to-file flag at the file.
Name them `<owner>-<subproject>-referee-feedback.md` and `<owner>-<subproject>-student-feedback.md`, beside the report they review.
Write with an editor tool, never a shell heredoc.
Do not hand-assemble either file from batches; if you must join anything, join it with a plain byte copy (`cat`).
Have each reader confirm in one short message which item numbers its file holds, and read the file yourself.
If the feedback file already exists, overwrite it.
Gitignore both files.

**Have each reader head its own document** with which model answered, what it was given, and that its line numbers are the report as it read it.
**Cite the section number (§5) as well as the quoted sentence.**

**Per finding:** the section or subsection number, the line number, the quoted sentence, what is wrong, the evidence by file and line, what it should say, and **CONFIRMED** against **PLAUSIBLE**.
Numbered continuously across the whole file, with structural findings and proposed cuts in a section of their own and proposed changes to this policy in another.

**Expect the two to disagree.**
Resolve it in the text rather than by picking a side; where that is impossible, the referee wins on accuracy and the student wins on placement.

### Reader 3, the editor

**A foreign-family agent given the report and this policy** — the text alone, with no figures.
It reports no findings; it returns the whole report rewritten in the style of a well-written PhD dissertation addressed to an incoming graduate student.

**Copy the report to `<owner>-<subproject>-unedited-report.md` before convening this reader**, beside the report, and gitignore it.
Take the copy once readers 1 and 2 are fully incorporated, and overwrite it if it already exists.

**Accept the rewrite as the base document.**
Diff it against `<owner>-<subproject>-unedited-report.md` to find and correct any errors the editor might have introduced.

### Readers 2 and 3, which come from outside the local model family

Use [`codex-cli.md`](codex-cli.md) for runner commands, output capture, and review context.
Read it before convening readers 2 and 3.
The review-specific requirements are:

- **Verify which model read the document.**
  Ask it to name its own model and runtime before anything else, and keep the answer at the head of what it writes.
- **Give the reader a working root outside the repository**, or the foreign harness reads `AGENTS.md` and the restricted view is gone.
- **Inline the document rather than pointing at a path.**
  The whole report in the prompt, inside `<document>` tags, with `cat -n` line numbers so it can cite them.
  Reader 3 also gets this policy, in its own tags beside the report; reader 2 does not.
- **Set the reasoning effort explicitly.**

### Once a finding has been acted on

**Re-run the checks after every fix.**
Diff the prose for repeated sentences, re-run the number audit, and re-render every figure whose data moved.

## 11. What a number is allowed to claim

Sections 1 and 3 govern what a quantity is called; this one governs what a sentence may assert about one.

**A number said to be confirmed by a second route names the inputs the second route does not share.**
Write both expressions in the same evaluated quantities and cancel: if their ratio is a function of those quantities alone, the agreement is algebra and not evidence.
Report it as a consistency check, with what it does test.

**A sweep licenses claims at its rows and about its endpoints, not about the interval between two of them.**
A crossing, a threshold, or a claim holding for any value however small needs a sample each side of it, quoted with the two rows that bracket it.
A boundary found by search is bracketed, never located.

**A sensitivity, derivative or slope is quoted with the interval it was computed over.**
A generated difference column is labelled by one endpoint of its interval.
Compute it centred where the argument needs the local value; name the interval where it does not.

**A conclusion drawn at one operating condition is supported by the quantity evaluated at that condition.**
Where a nearby round value is quoted instead, say that it bounds the real one and in which direction.

**Identify every quantitative result as measured, assumed, analytically approximated, or numerically computed, at first presentation.**
Preserve the distinction in summaries and captions, and state the scope of any numerical accuracy claim.

**A tolerance, spread or agreement figure in generated prose is printed from the value the generating script measured, never written as a literal.**
Assert no more precision than the document prints: print the measured difference rather than a rounded pair the reader must subtract.
