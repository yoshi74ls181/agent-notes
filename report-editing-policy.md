# Editing policy for reports

A report is **reader-facing**: a newcomer should follow the science in logical order without learning the project's discovery history.

This note covers report content and source form.
The build is documented in [`markdown-report-pipeline.md`](markdown-report-pipeline.md); figure conventions and study layout have separate notes.

**The rules are ordered by what an agent needs first when drafting**: where a fact belongs and who it is written for, then what must not be carried over from the work, then structure and naming, then the form of the source.
§8 and §9 are the procedures for a report that already exists.
A section number is a stable handle, so a section that is removed leaves its number vacant rather than renumbering the ones after it — hence no §6, §7 or §10.

## 0. Which document carries what

| document | reader | carries | does not carry |
|---|---|---|---|
| `AGENTS.md` | an agent about to change something | what is needed *before* opening anything: what the study is in a paragraph, which document answers which question, the constraints that stop a wrong edit, and the contracts an editor must not break. A number only when the number *is* the constraint | a fact rather than a constraint on action — link to the document that owns it. Any other finding. It loads into every session in its subtree, so prefer a pointer to a précis; much past 150 lines it has started restating its neighbours |
| `README.md` | a human arriving at the directory | brief orientation only: what this is, who owns it, where to start, the code layout, how to run it. One line on what the study concluded | any other finding, and any result `report.md` or `LOGBOOK.md` owns |
| `report.md` | a human who has never seen the project | the science, in logical order, and the limits on it. Where a dead end is the reason an observable is defined a particular way, the definition and the measurement constraint it left behind, without the failure. A wrong alternative only as a conditional — what it *would* have done to the comparison | project history of any kind, a dead end among it, and no wrong alternative as an event that happened. Completeness: its scope is whatever story it tells, which may be one extension rather than the whole subproject, and it must not be widened to cover more. A chronological order |
| `LOGBOOK.md` | someone continuing the work | **the project record**: every measured number, in script order, what each measured field means, and the history — what was tried, what failed, what was corrected and why. Every superseded claim, dead end, correction and abandoned approach the rules below take out of the report, and any finding with no place in the report's story. May be chronological | — |
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
Its private symbols carry no meaning outside it.

- **Minimise them.**
  Give a quantity its plain-English name.
  The one exception is the section reproducing the paper's own formula.
- **Define what survives, once, before it is used**, in a short table ahead of the first section that needs it.
- **That table declares dimensions and signs, not only meanings.**
  A row whose value column reads like the others invites the reader to treat the quantity like the others.
  Say which entries are frequencies and which are dimensionless — one table introduced four quantities as "all of which are frequencies" when one was an energy fraction — and say whether the table gives magnitudes or signed coefficients, where the body carries a signed matrix of the same quantities.
  Say too which of the values are design *targets* and which are consequences: a column headed "for this device" that mixes the two is read as all targets.
- **The summary box uses no symbol at all.**
  It sits before that table.
  Write the quantity out; every number must survive the translation.
  Do not gloss a symbol inline — remove it.
  Audit the box after every edit: extract it, grep for `[A-Za-z]_[A-Za-z0-9]` and for a caret, **then grep for every non-ASCII character in it and read what comes back**, and check every number in it still appears in the body.
  The underscore pattern alone is not the rule and is not enough — it passes κ, ω, Σ, and any bare single letter standing for a quantity.
- **Audit the box's comparatives, not only its symbols.**
  The symbol audit is four greps and a box can pass all of them while asserting something the body contradicts.
  Any superlative or comparative in it — best, worst, beats everything, the largest — is a claim about the whole document and has to be checked against every table in it.
- **Name a proxy as a proxy where it first appears, including in the box.**
  A quantity standing in for a measurement — a damage estimate, a figure of merit, an infidelity proxy — carries its metric and its normalisation at first use.
  The word "estimate" is not enough when the coefficient, the saturation rule and the choice of representative value are all conventions: a reader who meets the number before the convention reads it as an infidelity, and the headline percentages will have done their argumentative work by the time the definition arrives.
- **Expand every acronym on first use,** including the ones that name the device.
- **Name a special function on first use, and give the particular numerical facts the report leans on** — the peaks, zeros and limits its results sit on.
- **Name a sibling study rather than pointing at it.**
  "The sibling study" means nothing.

## 2. Order by logic, not by discovery, and keep the history out

The report says what is true, not how it came to be believed.
That governs the sentences and the order of the sections alike, and it is one rule because the two fail together: a document that carries its own history tends to be arranged in the order the work happened.

Delete discovery narratives such as "an earlier version" or "originally", and first person.
State what is true; keep how it came to be believed in the logbook.

**Deleting the narrative is not deleting the choice.**
Where "an earlier version did X" is the only place the report says why it does Y, rewrite it as a statement of what it does and why, then check the replacement still carries the reason.
That a scan holds an action fixed rather than a duration is a methodological choice a reader needs; that it replaced a previous scan is not.
The §0 table has the right instinct for dead ends, but an agent editing prose finds §2's flat instruction first and takes the justification out with the history.

**A limitation that governs a table belongs beside that table.**
State it where the numbers are read and keep the full version where the limits are collected.
The same goes for a stipulated input that can reverse a comparison: name it as consequential wherever the comparison appears.

**A caption carries neither the figure's edit history nor a branch of its plotting code that did not fire.**
The justification for a *choice the reader can see* — a zero baseline, an equal aspect ratio — does belong there.

**Superseded design targets are history too.**
After retargeting, sweep prose, tables, and formulas for values and comparisons carried over from the old design point.

**The report presents one device.**
Every comparison against a previous one is history, however quantitative, and every number from it is wrong.
A retarget is a sweep of the whole document.

**One flagged violation is a class, not an instance.**
When a reader points at a sentence, grep the document for the *shape* before replying.

**General case first, special case second.**
Introduce a controlling parameter *before* the cases it distinguishes, and let each case follow from where it sits.
**Make the fork explicit**: a short hinge section stating the regimes and what each implies.
**The summary box leads with the recommendation** — what should someone build, and what does it cost.

**The summary has to stand alone.**
Three constraints the body does not obey:

* **No terminology the report itself invents.**
  The standard vocabulary of the field is fine, and spelling it out in words costs the reader.
  A coined term is glossed in the same breath or left to the body.
* **No justifying the claims.**
  The finding, not the evidence for it.
* **Numbers, yes — the conclusions are the numbers.**
  Avoid only the number whose *meaning* needs the body.

**A headline in absolute units needs one anchor.**
Give the reader a comparison against a standard alternative, a bound, or an explicitly unreachable ideal.
Put the anchor in the limitations at **one significant figure**; more digits, or a place in the summary box, make it read as a computed result rather than a scale.

Applying either half usually means *moving* material rather than cutting it.

## 3. One name, one meaning

A symbol, a word or a phrase means exactly one thing in a document.
Four shapes:

**Rename symbols reused for unrelated quantities.**
A gloss does not remove the collision.
Remove the symbol entirely when the quantity does not need a name.

**Name objects distinctly.**
Two devices called "the device", or two sources called "the paper", invite readers to combine incompatible numbers.
Name each on first use and distinguish them.

**Name the referent when a word could stand for several numbers**, such as different quantities in a table and on a figure axis.

**Identify the measurement variant behind every quoted number**, or use one variant throughout.
Values from different methods or conditions are not interchangeable.

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

- **A subscript is one letter, an underscore, then letters or digits.** `snake_case` is left alone, which is what separates identifiers and filenames from subscripts.
- **Put code in backticks.**
  A single-letter variable name in bare prose will be set as a subscript; backticked spans are never touched. `proseSubscript` in `scripts/tex_unicode.js` is the rule.

**Display equations stay as `$$...$$`.**
Display a load-bearing formula even when it fits on one line.
Asides, restated definitions, and unit conversions may stay inline.

**Use Unicode for the symbols inside the `$$` too.**
Three things stay macros:

* **Function names**, which are set upright; spelled literally they render as italic variables.
* **Multi-letter sub- and superscripts.**
  A LaTeX script takes one token, so without braces the subscript loses its letters to the baseline.
  Use `\mathrm{}`.
* **Structure**: `\frac`, `\sqrt`, `\begin{gathered}`, `\\`, `\,`, `\qquad`.

Nothing is converted inside text and upright-roman arguments.
**None of this applies to the prose**, which never goes near MathJax: Unicode maths is simply correct there.

**Verify notation rewrites by comparing rendered MathML.**
The build rejects unknown Unicode; see the conversion table in [`markdown-report-pipeline.md`](markdown-report-pipeline.md).

**What no-HTML costs, and accept it:** semantic colouring becomes bold, multi-column layouts become sequential sections, badges fold into their heading text, and sub- and superscripts become Unicode where the character exists and `^x` or `_x` where it does not.

The builder is more permissive than this rule and will not catch a violation, so the project needs its own check that counts raw tags, inline maths and stray macros outside display blocks and exits non-zero.

## 5. Sections are numbered, and cross-references name their target

**Number every section and subsection, to whatever depth the report goes.** `## 4.` and `### 4.2` in the main text; `## C.`, `### C.2` and `#### C.2.1` in the appendices.
Front matter ahead of the first section is not a section and takes no number.
A section number is the only handle on a passage that neither moves when the document is reordered nor reflows when a sentence is edited, which is what makes it the thing to cite.

Never "the previous section" or "as discussed above" — sections move and those references invert silently.
Name the section by its number, or name the object.

**A pointer whose target is the section containing it is a defect, not a redundancy.**
Check every `§n` against the heading above the sentence that carries it.
Numbering an existing document fails this way in particular, because the natural slip is to write the number of the section you are standing in; one such pointer survived a commit whose entire purpose was to make every pointer name the section it meant.

**A row index, a column position or a marker on a figure is a cross-reference too**, and it goes stale the same way without anything in the prose changing.
Prefer naming the row by its scheme, the column by its heading and the marker by what it marks.
Where an index is unavoidable, re-derive every one after inserting or deleting a row.

## 8. When restructuring an existing report

1. **Diff the visible word multiset before and after.**
   Content meant to move verbatim should show zero losses.
2. **Re-read the first sentence of every section in order.**
   Forward references become backward ones when sections swap.
3. **Re-check every claim of scope against the new scope.**
   A sentence can be true of the report it was written for and false of the report it now sits in.
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

**Ask readers 1 and 2 about structure explicitly:** what belongs earlier, what is misplaced, whether the order carries the argument, and what could be removed.

**Ask reader 1 to propose additions and modifications to this policy, and reader 2 additions only**, in a section of their own.
Ask them to only make proposals which are generalizable to other projects.

**Both readers' findings go to a file, in one invocation each, not into messages.**
Reader 1 writes its own; reader 2's comes from pointing the runner's last-message-to-file flag at the file, which needs no write access of its own.
Name them `<owner>-<subproject>-referee-feedback.md` and `<owner>-<subproject>-student-feedback.md`, beside the report they review.
Write with an editor tool, never a shell heredoc, which mangles backslashes.
Do not hand-assemble either file from batches; if you must join anything, join it with a plain byte copy (`cat`).
Have each reader confirm in one short message which item numbers its file holds, and read the file yourself.
If the feedback file already exists, overwrite it.
Gitignore both files.

**Have each reader head its own document** with which model answered, what it was given, and that its line numbers are the report as it read it.
**Cite the section number (§5) as well as the quoted sentence.**

**Per finding:** the section or subsection number, the line number, the quoted sentence, what is wrong, the evidence by file and line, what it should say, and **CONFIRMED** against **PLAUSIBLE**.
Numbered continuously across the whole file, with structural findings in a section of their own and proposed changes to this policy in another.

**Expect the two to disagree.**
Resolve it in the text rather than by picking a side; where that is impossible, the referee wins on accuracy and the student wins on placement.

### Reader 3, the editor

**A foreign-family agent given the report and this policy** — the text alone, with no figures.
It reports no findings; it returns the whole report rewritten in the style of a well-written PhD dissertation addressed to an incoming graduate student.
**Accept the rewrite as the base document.**
Diff it against the source to find and correct any errors the editor might have introduced.

### Readers 2 and 3, which come from outside the local model family

Use [`codex-cli.md`](codex-cli.md) for runner commands, output capture, and review context.
Read it before convening readers 2 and 3.
The review-specific requirements are:

- **Verify which model read the document.**
  Ask it to name its own model and runtime before anything else, and keep the answer at the head of what it writes.
  A plugin offering a foreign model may route through a wrapper of the local family.
- **Give the reader a working root outside the repository**, or the foreign harness reads `AGENTS.md` and the restricted view is gone.
- **Inline the document rather than pointing at a path.**
  The whole report in the prompt, inside `<document>` tags, with `cat -n` line numbers so it can cite them.
  Reader 3 also gets this policy, in its own tags beside the report; reader 2 does not.
- **Set the reasoning effort explicitly**, since it defaults from the runner's own config.

### Once a finding has been acted on

**A fix is an edit, so re-run the checks after it.**
Diff the prose for repeated sentences, re-run the number audit, and re-render every figure whose data moved.
