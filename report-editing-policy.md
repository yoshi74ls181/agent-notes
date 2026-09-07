# Editing policy for reports

A report is **reader-facing**: a newcomer should follow the science in logical order without
learning the project's discovery history.

This note covers report content and source form. The build is documented in
[`markdown-report-pipeline.md`](markdown-report-pipeline.md); figure conventions and study
layout have separate notes.

**The rules are ordered by what an agent needs first when drafting**: where a fact belongs and
who it is written for, then what must not be carried over from the work, then structure and
naming, then the form of the source, then the numbers. §8 to §10 are the procedures for a report
that already exists.

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

**A line belongs in `AGENTS.md` only if:** *would someone about to edit do the wrong thing without
it?*

**Findings are owned by `report.md` and `LOGBOOK.md`,** and the two may cover the same material in
different orders; do not collapse them.

## 1. Write for a working experimentalist, and define what survives

**Assume a working experimentalist in the report's field.** Leave standard vocabulary
unexplained. For unfamiliar concepts, retain the correct name and add one operational sentence
stating what was computed.

**Do not assume the reader has read the source paper.** Its private symbols carry no meaning
outside it.

- **Minimise them.** Give a quantity its plain-English name. The one exception is the section
  reproducing the paper's own formula.
- **Define what survives, once, before it is used**, in a short table ahead of the first section
  that needs it.
- **That table declares dimensions and signs, not only meanings.** A row whose value column
  reads like the others invites the reader to treat the quantity like the others. Say which
  entries are frequencies and which are dimensionless — one table introduced four quantities as
  "all of which are frequencies" when one was an energy fraction — and say whether the table
  gives magnitudes or signed coefficients, where the body carries a signed matrix of the same
  quantities. Say too which of the values are design *targets* and which are consequences: a
  column headed "for this device" that mixes the two is read as all targets.
- **The summary box uses no symbol at all.** It sits before that table. Write the quantity out;
  every number must survive the translation. Do not gloss a symbol inline — remove it. Audit the
  box after every edit: extract it, grep for `[A-Za-z]_[A-Za-z0-9]` and for a caret, **then grep
  for every non-ASCII character in it and read what comes back**, and check every number in it
  still appears in the body. The underscore pattern alone is not the rule and is not enough — it
  passes κ, ω, Σ, and any bare single letter standing for a quantity, which on one audited box
  was five of the eleven symbols present.
- **Audit the box's comparatives, not only its symbols.** The symbol audit is four greps and a
  box can pass all of them while asserting something the body contradicts. Any superlative or
  comparative in it — best, worst, beats everything, the largest — is a claim about the whole
  document and has to be checked against every table in it. One box called an unranked alternative
  one that "would beat everything recommended here" while the report's own frequency scan beat that
  alternative by a factor of fifteen, without needing either of the alternative's prerequisites.
- **Name a proxy as a proxy where it first appears, including in the box.** A quantity standing in
  for a measurement — a damage estimate, a figure of merit, an infidelity proxy — carries its metric
  and its normalisation at first use. The word "estimate" is not enough when the coefficient, the
  saturation rule and the choice of representative value are all conventions: a reader who meets
  the number before the convention reads it as an infidelity, and the headline percentages will
  have done their argumentative work by the time the definition arrives.
- **Expand every acronym on first use,** including the ones that name the device.
- **Name a special function on first use, and give the particular numerical facts the report
  leans on** — the peaks, zeros and limits its results sit on.
- **Name a sibling study rather than pointing at it.** "The sibling study" means nothing.

## 2. Order by logic, not by discovery, and keep the history out

The report says what is true, not how it came to be believed. That governs the sentences and the
order of the sections alike, and it is one rule because the two fail together: a document that
carries its own history tends to be arranged in the order the work happened.

Delete discovery narratives such as "an earlier version" or "originally", and first person.
State what is true; keep how it came to be believed in the logbook.

**Deleting the narrative is not deleting the choice.** Where "an earlier version did X" is the only
place the report says why it does Y, rewrite it as a statement of what it does and why, then check
the replacement still carries the reason. That a scan holds an action fixed rather than a duration
is a methodological choice a reader needs; that it replaced a previous scan is not. The §0 table
has the right instinct for dead ends, but an agent editing prose finds §2's flat instruction first
and takes the justification out with the history.

**A limitation that governs a table belongs beside that table.** State it where the numbers are
read and keep the full version where the limits are collected. The same goes for a stipulated input
that can reverse a comparison: name it as consequential wherever the comparison appears. One report
listed a stipulation as "inconsequential" in its own inventory of stipulations, having shown
fourteen paragraphs earlier that moving it by a decade decides which of two channels dominates.

**A caption carries neither the figure's edit history nor a branch of its plotting code that did
not fire.** The justification for a *choice the reader can see* — a zero baseline, an equal aspect
ratio — does belong there.

**Superseded design targets are history too.** After retargeting, sweep prose, tables, and
formulas for values and comparisons carried over from the old design point.

**The report presents one device.** Every comparison against a previous one is history, however
quantitative, and every number from it is wrong. A retarget is a sweep of the whole document; the
staleness sweep of §10 is the procedure.

**And the shape that survives every automated check is the one where the number is still in
`results/`.** A value solved against the *old* target is not stale as a number — its log is
right there, so §10.1's grep passes it and §10.2's passes it too. What is stale is the target it
was solved for, and nothing in the report records that. On one report a resonator capacitance and
impedance solved for a shift ten times smaller than the one the document designs were attached to
the new shift for three review rounds, alongside a comparison — "a factor of two short" — that
was a factor of twenty short of the target actually in force. **So sweep for the old target's
value, not only for stale numbers**: grep the logs for the superseded target, list every design
value solved in the same run, and check each against the sentence that now quotes it. A
comparative phrase is the tell, because it carries the old target implicitly.

**One flagged violation is a class, not an instance.** When a reader points at a sentence, grep the
document for the *shape* before replying.

**General case first, special case second.** Introduce a controlling parameter *before* the cases
it distinguishes, and let each case follow from where it sits. **Make the fork explicit**: a short
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

Applying either half usually means *moving* material rather than cutting it.

## 3. One name, one meaning

A symbol, a word or a phrase means exactly one thing in a document. Four shapes:

**Rename symbols reused for unrelated quantities.** A gloss does not remove the collision.
Remove the symbol entirely when the quantity does not need a name.

**Name objects distinctly.** Two devices called "the device", or two sources called "the paper",
invite readers to combine incompatible numbers. Name each on first use and distinguish them.

**Name the referent when a word could stand for several numbers**, such as different quantities
in a table and on a figure axis.

**Identify the measurement variant behind every quoted number**, or use one variant throughout.
Values from different methods or conditions are not interchangeable.

**A dimensionless ratio names what it is referred to.** One report gave the same device a mode-to-qubit
ratio of 1.34 in one section and 1.31 in another. Both were right — one referred to the geometric
mean of the qubit pair, the other to the frequency the couplings were measured at — and nothing
said so. The same split gave two values of the quantity the ratio normalises, one of which no
result file printed.

**Finding them.** Extract every symbol and every capitalised or quoted term and list the distinct
quantities each denotes. Where a system holds several instances of a component, the bare noun is
never safe: name the instance. Where a script computes a number in more than one place, check the
places agree before quoting either.

## 4. The source is portable markdown: Unicode maths, no HTML

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

## 5. Sections are numbered, and cross-references name their target

**Number every section and subsection, to whatever depth the report goes.** `## 4.` and
`### 4.2` in the main text; `## C.`, `### C.2` and `#### C.2.1` in the appendices. Front matter
ahead of the first section is not a section and takes no number. A section number is the only
handle on a passage that neither moves when the document is reordered nor reflows when a sentence
is edited, which is what makes it the thing to cite.

Never "the previous section" or "as discussed above" — sections move and those references invert
silently. Name the section by its number, or name the object.

**A pointer whose target is the section containing it is a defect, not a redundancy.** Check every
`§n` against the heading above the sentence that carries it. Numbering an existing document fails
this way in particular, because the natural slip is to write the number of the section you are
standing in; one such pointer survived a commit whose entire purpose was to make every pointer
name the section it meant.

**A row index, a column position or a marker on a figure is a cross-reference too**, and it goes
stale the same way without anything in the prose changing. Prefer naming the row by its scheme,
the column by its heading and the marker by what it marks. Where an index is unavoidable,
re-derive every one after inserting or deleting a row. One report indexed the same table correctly
in one section and off by one in another, because a row had been inserted between the two edits;
the document contained its own counter-example and no rule caught it.

## 6. Arithmetic the reader will attempt must close

**Replace vague quantifiers with numbers:** "a comfortable factor", "not a small perturbation",
and "a big win". If the surrounding text already gives the number, cut the restatement.

**Arithmetic must close.** If nearby operands do not produce the stated result, explain the
missing definition or design decision rather than dismissing the discrepancy as rounding.

Three related shapes: **"so" between two independently computed numbers**, which hides an agreement
worth stating plainly; **a factor the reader has to derive**, so print the expression rather than
only its two ends; and **a word that describes the wrong operation**, which sends the reader's
arithmetic the other way.

**A percentage or a factor carries its denominator.** Three ways it goes wrong even when the
division is right. The base changes between the summary and the body, so one "99.6%" is a
fraction of the discrete spurs in one place and of the whole excess in the other. A ratio of
two logarithmic readings gets reported as a factor: 1.601 dB over 0.085 dB is not "a factor of
19" in anything physical, since the gains behind them differ by 1.42. And a *relative* excess
loses the word "relative": 1.12 percent of a probability is not 1.12 percentage points of it, and
a header that drops it invites the reader to compare the number against two columns whose
difference is 0.45 points.

**Quote the numbers of one column at one precision, and let the printed operands reproduce the
printed result.** Rounding a column's headline value to a word while quoting its neighbours to the
digit makes one look like a scale and the others like computations, when all three came from the
same place: "eighty times more" sat between "21 at 100 mK" and "64 at 1 K" while the evidence said
81. And where the report shows its working — *this* is *that* times *the other* — the operands as
printed must give the result as printed, or the sentence says which of them is rounded. One chain
read "3.2 × 10⁻³ per gate. This is 3.2 times the zero-temperature 9.8 × 10⁻⁴", whose product is
3.1 × 10⁻³; the two factors were evaluated at different qubit frequencies and neither the report
nor its logs said which.

**A comparison says what it holds fixed, and the thing held is rarely the thing of interest.**
Two designs compared "at the same" something need that something named, because the reader will
assume it is whichever quantity the sentence is about. One report offered a device that bought a
factor of 1.32 in separation "at the same contrast" — the contrast in fact fell by 17.6%, as the
same section said two paragraphs earlier, and what had been held across the comparison was the
gain. Where a sweep holds one quantity to make another comparable, name it at every place the
comparison is quoted, and give what the held quantity cost.

**A numerical correction states the conditions it was computed under.** A table of thermal
populations gives its temperature, its assumed level spectrum, how many levels were kept and which
probability convention is meant. This bites hardest where the report has already said that the
spectrum an exact treatment would need is unavailable: an approximate correction quoted without its
model reads as the exact one, and a reader who tries to reproduce it cannot.

**An edge found between two samples is bracketed, not located, and a solver failure is not a
physical bound.** Both halves fail together, because the sentence that reports a ceiling is the
one that has to say what kind of ceiling it is. Three things get conflated: the last parameter
value at which a solve converged, the point at which a model extrapolates to a limit, and a bound
the device actually has. Say which, and where the edge came from two samples with nothing tried
between them, say so — "nothing between the two was tried, so the ceiling is bracketed and not
located" is the whole fix, and a report that writes it correctly in one place and not in another
reads as though the second edge were better established. Where the ceiling is a solver's, a
second construction is what separates it from the device's, and the report should either carry
that check or decline the claim.

**Check it after editing, not only after writing.**

## 7. Evaluate the closed form, and apply the method to the device

**Evaluate printed closed forms.** They may predict results otherwise asserted from a parameter
scan, turning the scan into an independent check.

**A method validated on something other than the device** — a prescription validated on a test case
and never applied to the device the report designs, whose corresponding number is fitted instead.

Three honest endings, and the report must pick one: **apply it** and quote the prediction against
the measurement; **say it was not applied**, so the quantity is an input rather than a prediction;
or **delete it** and leave the record in `LOGBOOK.md`. Presenting the validation as though it
licensed the result is not available.

**A closed form that is maximised somewhere has an optimum of ITS OWN quantity, and that is not
the optimum of what was measured.** The step from one to the other needs the rest of the chain to
be flat in the swept parameter, and usually it is not: a susceptibility denominator depends on
the same parameter, or the drive is separately re-optimised at each point. One report derived a
self-energy difference maximised at a particular ratio and wrote that the expression "places the
maximum" of the measured field separation, which it does not — it corroborates a sampled maximum
and locates its own. Say which quantity the form maximises, and let it support the sweep rather
than replace it.

**And a maximum in one variable does not become a prescription on a ratio.** A condition written
as one quantity equalling another reads as advice about both, and it is normally advice about the
one that was swept. On the same report a maximum at "shift equals linewidth", established by
moving the shift, was read as licensing a linewidth chosen to match a shift; read the other way
the same expression falls monotonically and has no interior maximum at all. Where only one factor
of a ratio has been varied, say so in the sentence that states the ratio.

## 8. When restructuring an existing report

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

## 9. The three-reader pass

Three readers, none of them the author. **Run the first two at once**; **run the third only after
both sets of findings are in the document.** Readers 2 and 3 come from a different model family
than reader 1.

**Do not merge readers 1 and 2.** The referee must have the policy and the project; the student
must have neither. A student holding either stops being a first-time reader, and a first-time
reading is the one thing only reader 2 can supply.

### Reader 1, the referee

**An agent with the whole repository**, including the report, logbook, result logs, scripts,
and this policy. Check every number against evidence, the science, signs, scope, and whether
§7's method was applied to the device.

**Budget it, and give it a fallback.** This reader is auditing every number in a long document
against a directory of logs, and an unbounded brief is how it fails: it audits until it runs out
of room and writes nothing at all. Cap the investigation explicitly, in tool calls or in tables,
and say that a finished file with twenty evidenced findings beats an unwritten one with forty.
**Tell it to audit the summary last and as its own pass.** A brief that points a referee at the
sections carrying the new work will get those sections audited and the front matter skimmed with
whatever attention is left, and the summary is where a wrong claim does the most damage, because
it is the part a reader quotes to someone else. On one pass the single finding that changed a
conclusion was in the summary, and the referee reached it having nearly run out of room.

**If it still does not deliver, the editor does the audit itself and says so in the file's
header.** A pass whose reader 1 was not independent, and which declares it, is worth more than a
pass with no number audit — that audit is the one thing readers 2 and 3 cannot supply, because
neither of them can see `results/`.

**Ask it to record what it checked and found correct, not only what is wrong.** The brief is
otherwise entirely negative and the per-finding format has no slot for a passing check, so a
reader that verifies something and finds it sound reports nothing and the editor has to re-audit it
to learn the difference between "checked and correct" and "not reached". Where the brief names a
change to scrutinise, ask for the check and its result either way. On one pass this is how the
figure whose reference lines had just been derived from the records was confirmed clean, with the
byte-identical re-render quoted as the evidence.

### Reader 2, the second-year graduate student

**A foreign-family agent given only the report and its figures.** Read front to back and quote
every passage requiring a reread or guess. Identify unexplained nonstandard terms, §3 name
collisions, §6 arithmetic, and definitions introduced late. Say where a first-time reader would
give up and what order would help.

Two things this reader needs and the others do not:

- **Attach raster renders of any vector figure, and ask about them specifically.** It cannot
  rasterise an SVG or a PDF itself.
- **Say that the report has already been reviewed**, or it invents concerns to fill every heading,
  and **say that the reply must cover the whole document**, or it reads the first fifty lines
  exhaustively and stops.

### Readers 1 and 2, and what comes back from them

**Ask readers 1 and 2 about structure explicitly:** what belongs earlier, what is misplaced,
whether the order carries the argument, and what could be removed.

**Ask reader 1 to propose additions and modifications to this policy, and reader 2 additions
only**, in a section of their own. Reader 2 has not seen the policy and so cannot say what in it
to change.

**Both readers' findings go to a file, in one invocation each, not into messages.** Reader 1
writes its own; reader 2's comes from pointing the runner's last-message-to-file flag at the file,
which needs no write access of its own. Name them `<owner>-<subproject>-referee-feedback.md` and
`<owner>-<subproject>-student-feedback.md`, beside the report they review. Write with an editor
tool, never a shell heredoc, which mangles backslashes. Do not hand-assemble either file from
batches; if you must join anything, join it with a plain byte copy (`cat`). Have each reader
confirm in one short message which item numbers its file holds, and read the file yourself.

**Have each reader head its own document** with which model answered, what it was given, and that
its line numbers are the report as it read it. **Cite the section number (§5) as well as the
quoted sentence.** Line numbers go stale the moment the document is edited; section numbers
mostly do not, and a finding that carries both stays findable after the first round of fixes.

**Per finding:** the section or subsection number, the line number, the quoted sentence, what is
wrong, the evidence by file and line, what it should say, and **CONFIRMED** against
**PLAUSIBLE**. Numbered continuously across the whole file, with structural findings in a section
of their own and proposed changes to this policy in another.

**Gitignore both files** — `*-referee-feedback.md` and `*-student-feedback.md`. They are working
material, deleted once the findings are in the report.

**Use messages only for what is genuinely conversational**, such as a disagreement to resolve or
a follow-up question. There: two items per message, prompt for every one, and when re-requesting
give the item number you already hold and quote the last words you received.

**Expect the two to disagree.** Resolve it in the text rather than by picking a side; where that
is impossible, the referee wins on accuracy and the student wins on placement.

### Reader 3, the editor

**A foreign-family agent given the report and this policy** — the text alone, with no figures. It
is the one reader outside the repository that gets the policy, so that the rewrite comes back
already obeying the rules rather than in a register that then has to be brought into line. It
reports no findings; it returns the whole report rewritten in the style of a well-written PhD
dissertation addressed to an incoming graduate student. **Accept the rewrite as the base
document.** Diff it against the source to find and correct any errors the editor might have
introduced.

### Readers 2 and 3, which come from outside the local model family

Use [`codex-cli.md`](codex-cli.md) for runner commands, output capture, and review context.
Read it before convening readers 2 and 3. The review-specific requirements are:

- **Verify which model read the document.** Ask it to name its own model and runtime before
  anything else, and keep the answer at the head of what it writes. A plugin offering a foreign
  model may route through a wrapper of the local family.
- **Give the reader a working root outside the repository**, or the foreign harness reads
  `AGENTS.md` and the restricted view is gone.
- **Inline the document rather than pointing at a path.** The whole report in the prompt, inside
  `<document>` tags, with `cat -n` line numbers so it can cite them. Reader 3 also gets this
  policy, in its own tags beside the report; reader 2 does not.
- **Set the reasoning effort explicitly**, since it defaults from the runner's own config.

### Once a finding has been acted on

**A fix is an edit, so re-run the checks after it.** Diff the prose for repeated sentences, re-run
the number audit, and re-render every figure whose data moved.

## 10. The staleness sweep, once the edits have settled

1. **Every number against the evidence, and against the *right* evidence.** Pull every log and data
   file under `results/` and check each decimal in the report appears in one of them, allowing for
   correct rounding and for unit changes.

   **Do not automate this as "the number appears somewhere in `results/`".** A stale number still
   has a source — the log of the earlier run that produced it — so that check passes the defect it
   is for. The question is whether this table's numbers are in the file *this table came from*, and
   nothing in the report records which file that is. What can be automated is one layer down: an
   identity the printed numbers must satisfy, checked inside the script that prints them.

   **And a range quoted from a sweep carries the sub-range it was taken over.** Where a script
   excludes rows because the reasoning behind a quantity does not apply to them — and prints them,
   and says why — the report inherits the exclusion along with the number. One report quoted a
   spread "across a factor of four" from a sweep spanning a factor of thirty without saying so,
   and dropped the excluded row whose value was six times off the trend and unexplained. Where two
   claims in one paragraph hold over different sub-ranges, both need stating: a constancy result
   and the ratio derived from it survived to different ends of the same sweep.
2. **Every number has a script.** No number or figure quoted in the report may exist only in a
   scratch calculation and in prose. This covers two kinds that do not look like measurements and
   are the ones that survive a sweep: **a number derived in prose** from ones that were measured,
   and **a number describing a case that was not run** — what a device *would* have carried at a
   depth nobody simulated. Both read as data. If the report needs one, the script must print it;
   if no script prints it, the report cannot quote it.

   **Mechanise it.** Extract every numeric literal from the report, grep each against `results/`
   and `scripts/`, and list the ones that appear in neither. Run it *before* the three-reader pass
   rather than after: it needs no judgement, and a referee's attention is better spent on what
   survives it. On one audited report the sweep found four prose-only numbers that two readers
   between them had missed, one of which described a case no script could run. Expect false
   positives and check them rather than suppressing them — a value formatted at runtime with
   `%.2f` and a rounded physical constant both fail the grep and are both correct.

   **Expect it to come back, and grep the scripts for the last person who fixed it.** This defect
   recurs in the same passages, because the arithmetic that derives one number from measured ones
   is natural to do in prose. On one report a script carried a comment written by whoever closed
   it the previous time, in the very section where a paragraph three lines further down the report
   had re-introduced it. A comment saying "these are printed because the report quotes them and
   nothing printed them" is a marker for where to look first.
3. **Every figure and link resolves,** and every figure on disk is either used or deliberately not.
4. **Every reference line, annotation and legend label a figure hardcodes, against the table it
   claims to match.** A constant baked into a plotting script is prose: it goes stale like prose,
   and re-rendering the figure cannot fix it, because that constant is the one thing on the panel
   that is not read from the data. On one audited report a superseded value survived a whole
   correction pass this way — the CSVs, the tables and the captions were all fixed, and a dashed
   reference line went on asserting the old number, with its own spread quoted in the legend
   beside it, until somebody compared the line against the table underneath it.
5. **Every cross-reference, against the current section order.** List every "the previous section",
   "above", "below" and check each; they read as ordinary prose and announce nothing when they go
   stale.
6. **Every claim of a check, against the checks that still exist.** Retiring a script leaves
   promises behind. Grep for "cross-check", "checked", "agrees", "below", "above" and confirm each
   has a referent.
7. **The symbol table against the body,** both ways: nothing defined and unused, nothing used and
   undefined. Expect false positives from LaTeX inside display blocks and from fragments of image
   filenames, and check them rather than suppressing them.
8. **Every DIRECTION the summary asserts, re-derived from the current tables.** This is the item
   the other seven cannot supply, and the reason it is needed is that a direction contains no
   number. "Improves as the modes are narrowed" has nothing for §10.1 to check against `results/`,
   a script behind every number it does quote so §10.2 passes it, and sound cross-references. It
   is nonetheless capable of asserting the exact opposite of the section it summarises — on one
   report it reproduced the trend of a comparison that the body itself discredits two paragraphs
   later, because a new sweep had inverted the answer and the summary was written from the old
   one. So after any new sweep, list every rises, falls, improves, grows, better and worse in the
   summary and confirm each against the table it now describes. §1's audit of the box's
   comparatives is the neighbouring check; a direction is neither a comparative nor a
   superlative, so that audit does not catch it.
