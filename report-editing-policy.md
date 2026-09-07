# Editing policy for reports

A report is **reader-facing**: a newcomer should follow the science in logical order without
learning the project's discovery history.

**Assume a working experimentalist in the report's field.** Leave standard vocabulary
unexplained. For unfamiliar concepts, retain the correct name and add one operational sentence
stating what was computed.

**Do not assume the reader has read the source paper.** Its private symbols carry no meaning
outside it.

- **Minimise them.** Give a quantity its plain-English name. The one exception is the section
  reproducing the paper's own formula.
- **Define what survives, once, before it is used**, in a short table ahead of the first section
  that needs it.
- **The summary box uses no symbol at all.** It sits before that table. Write the quantity out;
  every number must survive the translation. Do not gloss a symbol inline — remove it. Audit the
  box after every edit: extract it, grep for `[A-Za-z]_[A-Za-z0-9]` and for a caret, and check
  every number in it still appears in the body.
- **Expand every acronym on first use,** including the ones that name the device.
- **Name a special function on first use, and give the particular numerical facts the report
  leans on** — the peaks, zeros and limits its results sit on.
- **Name a sibling study rather than pointing at it.** "The sibling study" means nothing.

This note covers report content and source form. The build is documented in
[`markdown-report-pipeline.md`](markdown-report-pipeline.md); figure conventions and study
layout have separate notes.

## 0. Which document carries what

| | reader | carries |
|---|---|---|
| `AGENTS.md` | an agent about to change something | what is needed *before* opening anything: what the study is in a paragraph, which document answers which question, and the constraints that stop a wrong edit |
| `README.md` | a human arriving at the directory | brief orientation only: what this is, who owns it, where to start, the layout, how to run it |
| `report.md` | a human who has never seen the project | the science, in logical order, and the limits on it |
| `LOGBOOK.md` | someone continuing the work | **the project record**: every measured number, in script order, plus the history — what was tried, what failed, what was corrected and why |
| `scripts/*` | someone re-running or extending a measurement | the method, and the traps in it, next to the code that hits them |

**Findings are owned by `report.md` and `LOGBOOK.md`, and by nothing else.** Two exceptions:
`AGENTS.md` may carry a number when the number *is* the constraint, and `README.md` may carry one
line on what the study concluded.

**Code structure has no document of its own.** Layout to `README.md`; the contracts an editor must
not break to `AGENTS.md`; what each measured field means to `LOGBOOK.md`; anything that outlives
the study to the project's shared notes.

**A line belongs in `AGENTS.md` only if an editor would act wrongly without it.** Link to facts
elsewhere; keep constraints here. The file loads into every session in its subtree, so prefer
pointers and review for duplication when it grows much past 150 lines.

**`LOGBOOK.md` owns project history:** superseded claims, dead ends, corrections, and abandoned
approaches. It may be chronological; the report may not.

**Do not widen a report merely to make it complete.** Its scope may be one extension rather
than the whole subproject. Findings outside that story belong in `LOGBOOK.md`.

**`report.md` and `LOGBOOK.md` may cover the same material** in different orders; do not collapse
them. `README.md` and `AGENTS.md` may not restate a result those two own. `report.html` is
regenerated on every build, so any edit to it is lost.

## 1. The source is portable markdown: Unicode maths, no HTML

The source carries **neither raw HTML nor inline LaTeX**.

**Do not hard-wrap. One paragraph is one line.** Let the editor soft-wrap for the reader's window.

Hard wrapping reflows unrelated text in diffs and splits searchable phrases. It can also change
Markdown structure: a break before `|S21|`, `- `, or `1. ` may introduce a table row or list.

**What stays on its own line regardless**: headings, table rows, the `![alt](path)` figure lines
with their alt text intact, and display blocks. Those are already one logical unit per line.

**Inline maths is Unicode.** Convert an expression only when no backslash and no brace is left,
so that nothing is ever half-rewritten. A subscripted word stays as an underscore and its letters.

**The build sets those underscores as real subscripts**, with `scripts/md_to_html.js` setting
them as `<sub>`. Two consequences:

- **A subscript is one letter, an underscore, then letters or digits.** `snake_case` is left alone,
  which is what separates identifiers and filenames from subscripts.
- **Put code in backticks.** A single-letter variable name in bare prose will be set as a
  subscript; backticked spans are never touched. `proseSubscript` in `scripts/tex_unicode.js` is
  the rule.

**Display equations stay as `$$...$$`.** Display a load-bearing formula even when it fits on
one line. Asides, restated definitions, and unit conversions may stay inline.

**Use Unicode for the symbols inside the `$$` too.** Three things stay macros:

* **Function names**, which are set upright; spelled literally they render as italic variables.
* **Multi-letter sub- and superscripts.** A LaTeX script takes one token, so without braces the
  subscript loses its letters to the baseline. Use `\mathrm{}`.
* **Structure**: `\frac`, `\sqrt`, `\begin{gathered}`, `\\`, `\,`, `\qquad`.

Nothing is converted inside text and upright-roman arguments. **None of this applies to the
prose**, which never goes near MathJax: Unicode maths is simply correct there.

**Verify notation rewrites by comparing rendered MathML.** The build rejects unknown Unicode;
see the conversion table in [`markdown-report-pipeline.md`](markdown-report-pipeline.md).

**What no-HTML costs, and accept it:** semantic colouring becomes bold, multi-column layouts
become sequential sections, badges fold into their heading text, and sub- and superscripts become
Unicode where the character exists and `^x` or `_x` where it does not.

The builder is more permissive than this rule and will not catch a violation, so the project
needs its own check that counts raw tags, inline maths and stray macros outside display blocks
and exits non-zero.

## 2. No project history in the report

Delete discovery narratives such as "an earlier version" or "originally", and first person.
State what is true; keep how it came to be believed in the logbook.

**Superseded design targets are history too.** After retargeting, sweep prose, tables, and
formulas for values and comparisons carried over from the old design point.

**The report presents one device.** Every comparison against a previous one is history, however
quantitative, and every number from it is wrong. A retarget is a sweep of the whole document; the
staleness sweep at the end of this file is the procedure.

**One flagged violation is a class, not an instance.** When a reader points at a sentence, grep the
document for the *shape* before replying.

## 3. Dead ends go to LOGBOOK.md, not the report

**But keep every fact the numbers depend on.** Where a failed approach is the reason an observable
is defined a particular way, state the definition and the measurement constraint behind it, not the
failure.

**A wrong alternative may appear as a conditional, never as an event.** Write what the wrong choice
*would* do to the comparison, not that it was made and undone.

## 4. Keep every limit on the claims

Cut history, never scope. These stay, always:

* **"Not established"** paragraphs — what the work does not show, named explicitly.
* Convergence and mode-set caveats — the numerical settings the result depends on.
* **"What this cannot see"** — what the method structurally cannot address, as distinct from what
  was not attempted.
* Any number the measurement does not resolve, flagged as such. Where a scan quantises a quantity,
  say the absolute value is not resolved rather than quoting digits the step does not support.
* **The position of a maximum is bounded by the grid that found it, not by the precision of the
  values on it.** A peak found on a coarse grid is located between its neighbouring samples and no
  more precisely. Either coarsen the claim to the grid, or take the extra digits from a closed form
  evaluated at the same point (§18), which turns the scan into a check rather than the evidence.

A report with no limitations section is less trustworthy, not cleaner.

## 5. Order by logic, not by discovery

General case first, special case second. Introduce a controlling parameter *before* the cases it
distinguishes, and let each case follow from where it sits. **Make the fork explicit**: a short
hinge section stating the regimes and what each implies. **The summary box leads with the
recommendation** — what should someone build, and what does it cost.

**The summary has to stand alone.** Three constraints the body does not obey:

* **No terminology the report itself invents.** The standard vocabulary of the field is fine, and
  spelling it out in words costs the reader. A coined term is glossed in the same breath or left
  to the body.
* **No justifying the claims.** The finding, not the evidence for it.
* **Numbers, yes — the conclusions are the numbers.** Avoid only the number whose *meaning* needs
  the body.

**A headline in absolute units needs one anchor.** Give the reader a comparison against a standard
alternative, a bound, or an explicitly unreachable ideal. Put the anchor in the limitations at
**one significant figure**; more digits, or a place in the summary box, make it read as a computed
result rather than a scale.

## 6. No document voice

Delete commentary on the report's own emphasis or process. State the result directly instead
of announcing that it is worth computing, stating, or recalling.

Headings may carry argument where the reversal is the science. Navigation is not document voice: a
long report may open with a short "how to read this" and may state a convention it applies
throughout. What is banned is the report commenting on its own emphasis or history.

## 7. Cross-references name their target

Never "the previous section" or "as discussed above" — sections move and those references invert
silently. Name the section or the object.

## 8. Every comparison states its correction

Where two numbers were measured under conditions that differ, quote the raw value, the corrected
value, the correction and where the correction came from.

## 9. State the sign convention when the sign is the finding

Write which way a comparison goes in words as well as in the number. A table column names the
direction and the baseline, not the quality: `vs baseline, as measured`, never `penalty`.

## 10. Predictions are labelled, and never fits

A reference line says in its legend what it is and that it is not a fit. A closed form quoted in
the text says what it predicts *before* the measurement is given. In figures, theory is recessive
dashed grey and never a series colour.

## 11. Show untrusted data, marked

Never drop a point that failed a validity check. Plot it as an open marker and say in the caption
why its value is not meaningful; in tables, parenthesise the number and give the honest alternative
alongside.

## 12. No subjective tail on a quantitative sentence

> **[quantitative statement], and [subjective evaluation of it].**

Cut the subjective tail; the quantitative statement is sufficient.

**Quantify agreement and disagreement.** Give the values and spread. Cut admiration,
exclamations, and adjectives such as "astonishingly" or "beautifully".

**What is not a subjective tail.** Clauses that carry information stay: **a stated condition** that
makes the headline true; **a mechanism or cause**; **theoretical necessity with its scope** — "as it
must" is a fact about the claim's status, but say what it is forced over or cut it; **an
engineering judgement with a referent**; and **saying which of two things a number is**. The test:

> **Would a reader who disagreed with it have to check a different number, or only have a
> different temperament?**

A number, keep it. A temperament, cut it.

**Replace vague quantifiers with numbers:** "a comfortable factor", "not a small perturbation",
and "a big win". If the surrounding text already gives the number, cut the restatement.

**Finding them.** Grep `cleanest|sharpest|strongest|pleasing|elegant|striking|remarkable|worth
(having|stating|noting)|none of them small|happily|comfortable|very slightly`, then read every
sentence containing both a number and the word "and".

## 13. No sentence fragment with a comma-led modifier

> **[noun or gerund phrase], [comma-led modifier].**

Add a finite verb to make the fragment a main clause.

**Section headings and figure-caption leads are held to the same rule.** A heading naming a thing
and its state becomes a heading with a verb in it.

**What is not this defect.** A colon-led list; a figure-caption *sub*-label; a table cell; an
introductory phrase followed by a real main clause. A comma-led modifier is fine once the sentence
has a verb.

**Finding them.** Flag any sentence with no finite verb. For the ones that hide a verb inside the
modifier, flag any sentence whose text before the first comma has no finite verb and whose text
after it opens with a subordinator (`because`, `since`, `which`, `where`, `so`, `though`, `given`)
or a preposition.

## 14. The em dash does not extend a sentence

> **[clause] — [aside] — [continuation that should have been a new sentence].**

One dash for one aside in a short sentence. Two dashes in one sentence is the reliable signal: the
second is doing a full stop's job.

**Use a colon, a full stop or a subordinate clause instead**, in that order of preference — a colon
when the second half explains the first, a full stop when it is a separate fact, `because` or `so`
when the relation is worth naming.

**What is not this defect.** A single dash setting off a genuine aside in a short sentence, or one
introducing a list or a closing summary. The test is whether the sentence reads easier as two.

## 15. A paragraph header states the finding, not that there is one

A topic announcement such as "**What it gets.**" hides the finding, as does a lead-in that only
says what something is not.

**Put the finding in the header, with its number if it has one.** The reader who does not need the
paragraph can then skip it honestly.

**Finding them.** Grep every line beginning `**` and read the list on its own. A list of findings
reads as a summary of the report; a list of announcements reads as a table of contents.

## 16. One name, one meaning

A symbol, a word or a phrase means exactly one thing in a document. Four shapes:

**Rename symbols reused for unrelated quantities.** A gloss does not remove the collision.
Remove the symbol entirely when the quantity does not need a name.

**Name objects distinctly.** Two devices called "the device", or two sources called "the paper",
invite readers to combine incompatible numbers. Name each on first use and distinguish them.

**Name the referent when a word could stand for several numbers**, such as different quantities
in a table and on a figure axis.

**Identify the measurement variant behind every quoted number**, or use one variant throughout.
Values from different methods or conditions are not interchangeable.

**Finding them.** Extract every symbol and every capitalised or quoted term and list the distinct
quantities each denotes. Where a system holds several instances of a component, the bare noun is
never safe: name the instance. Where a script computes a number in more than one place, check the
places agree before quoting either.

## 17. Arithmetic the reader will attempt must close

**Arithmetic must close.** If nearby operands do not produce the stated result, explain the
missing definition or design decision rather than dismissing the discrepancy as rounding.

Three related shapes: **"so" between two independently computed numbers**, which hides an agreement
worth stating plainly; **a factor the reader has to derive**, so print the expression rather than
only its two ends; and **a word that describes the wrong operation**, which sends the reader's
arithmetic the other way.

**Check it after editing, not only after writing.**

## 18. Evaluate the closed form, and apply the method to the device

**Evaluate printed closed forms.** They may predict results otherwise asserted from a parameter
scan, turning the scan into an independent check.

**A method validated on something other than the device** — a prescription validated on a test case
and never applied to the device the report designs, whose corresponding number is fitted instead.

Three honest endings, and the report must pick one: **apply it** and quote the prediction against
the measurement; **say it was not applied**, so the quantity is an input rather than a prediction;
or **delete it** and leave the record in `LOGBOOK.md`. Presenting the validation as though it
licensed the result is not available.

## 19. Say each result once

Count the statements of each finding. **Keep one statement of each distinct piece of evidence.** A
table and the argument it supports are two pieces; the same number in two sections is one. When a
sentence begins "as noted above", delete it rather than write it.

**A caption carries neither the figure's edit history nor a branch of its plotting code that did
not fire.** The justification for a *choice the reader can see* — a zero baseline, an equal aspect
ratio — does belong there.

## When restructuring an existing report

1. **Diff the visible word multiset before and after.** Content meant to move verbatim should show
   zero losses.
2. **Re-read the first sentence of every section in order.** Forward references become backward
   ones when sections swap.
3. **Re-check every claim of scope against the new scope.** A sentence can be true of the report it
   was written for and false of the report it now sits in.
4. **Check that every symbol is still introduced before it is used.** Walk the symbols in order of
   first appearance.
5. **Deleting a section needs its own sweep.** Grep the deleted section for every number, symbol and
   proper noun it contained, then grep the survivor for each. Check the display equations and the
   figures, including any left on disk with nothing pointing at them.

### The three-reader pass

Three readers, none of them the author. **Run the first two at once**; **run the third only after
both sets of findings are in the document.** Readers 2 and 3 come from a different model family
than reader 1.

**Reader 1, the referee: an agent with the whole repository**, including the report, logbook,
result logs, scripts, and this policy. Check every number against evidence, the science, signs,
scope, and whether §18's method was applied to the device.

**Reader 2, the second-year graduate student: a foreign-family agent given only the report and
its figures.** Read front to back and quote every passage requiring a reread or guess. Identify
unexplained nonstandard terms, §16 name collisions, §17 arithmetic, and definitions introduced
late. Say where a first-time reader would give up and what order would help.

**Reader 3, the editor: a foreign-family agent given the report and nothing else.** It reports no
findings; it returns the whole report rewritten in the style of a well-written PhD dissertation
addressed to an incoming graduate student. Diff the rewrite against the source paragraph by
paragraph, and put every number, hedge and stated limit you accept back through the staleness
sweep.

**Do not merge readers 1 and 2.** The referee must have the policy and the project; the student
must have neither.

**Ask readers 1 and 2 about structure explicitly:** what belongs earlier, what is misplaced,
whether the order carries the argument, and what could be removed.

**Both readers' findings go to a file, in one invocation each, not into messages.** Reader 1
writes its own; reader 2's comes from pointing the runner's last-message-to-file flag at the file,
which needs no write access of its own. Name them `<owner>-<subproject>-referee-feedback.md` and
`<owner>-<subproject>-student-feedback.md`, beside the report they review. Write with an editor
tool, never a shell heredoc, which mangles backslashes. Do not hand-assemble either file from
batches; if you must join anything, join it with a plain byte copy (`cat`). Have each reader
confirm in one short message which item numbers its file holds, and read the file yourself.

**Have each reader head its own document** with which model answered, what it was given, and that
its line numbers are the report as it read it. Cite by quoted sentence.

**Per finding:** the line number, the quoted sentence, what is wrong, the evidence by file and
line, what it should say, and **CONFIRMED** against **PLAUSIBLE**. Numbered continuously, and
structural findings in a section of their own.

**Gitignore both files** — `*-referee-feedback.md` and `*-student-feedback.md`. They are working
material, deleted once the findings are in the report.

**Use messages only for what is genuinely conversational**, such as a disagreement to resolve or
a follow-up question. There: two items per message, prompt for every one, and when re-requesting
give the item number you already hold and quote the last words you received.

**Expect readers 1 and 2 to disagree.** Resolve it in the text rather than by picking a side;
where that is impossible, the referee wins on accuracy and the student wins on placement.

**A fix is an edit, so re-run the checks after it.** Diff the prose for repeated sentences, re-run
the number audit, and re-render every figure whose data moved.

#### Handing a report to a reader outside the local model family

Use [`codex-cli.md`](codex-cli.md) for runner commands, output capture, and review context.
Read it before convening readers 2 and 3. The review-specific requirements are:

- **Verify which model read the document.** Ask it to name its own model and runtime before
  anything else, and keep the answer at the head of what it writes. A plugin offering a foreign
  model may route through a wrapper of the local family.
- **Give the reader a working root outside the repository**, or the foreign harness reads
  `AGENTS.md` and the restricted view is gone.
- **Inline the document rather than pointing at a path.** The whole report in the prompt, inside
  `<document>` tags, with `cat -n` line numbers so it can cite them.
- **Attach raster renders of any vector figure to reader 2, and ask about them specifically.**
  Reader 3 gets the text alone.
- **Set the reasoning effort explicitly**, since it defaults from the runner's own config.
- **Tell reader 2 the report has already been reviewed**, or it invents concerns to fill every
  heading, and **tell it to cover the whole document**, or it reads the first fifty lines
  exhaustively and stops.

### The staleness sweep, once the edits have settled

1. **Every number against the evidence, and against the *right* evidence.** Pull every log and data
   file under `results/` and check each decimal in the report appears in one of them, allowing for
   correct rounding and for unit changes.

   **Do not automate this as "the number appears somewhere in `results/`".** A stale number still
   has a source — the log of the earlier run that produced it — so that check passes the defect it
   is for. The question is whether this table's numbers are in the file *this table came from*, and
   nothing in the report records which file that is. What can be automated is one layer down: an
   identity the printed numbers must satisfy, checked inside the script that prints them.
2. **Every number has a script.** No number or figure quoted in the report may exist only in a
   scratch calculation and in prose.
3. **Every figure and link resolves,** and every figure on disk is either used or deliberately not.
4. **Every cross-reference, against the current section order.** List every "the previous section",
   "above", "below" and check each; they read as ordinary prose and announce nothing when they go
   stale.
5. **Every claim of a check, against the checks that still exist.** Retiring a script leaves
   promises behind. Grep for "cross-check", "checked", "agrees", "below", "above" and confirm each
   has a referent.
6. **The symbol table against the body,** both ways: nothing defined and unused, nothing used and
   undefined. Expect false positives from LaTeX inside display blocks and from fragments of image
   filenames, and check them rather than suppressing them.
