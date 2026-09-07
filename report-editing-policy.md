# Editing policy for reports

A report is **reader-facing**: someone who has never seen the project reads it front to back and
follows the science, learning nothing about the order in which it was found.

**Assume a working experimentalist in the report's own field.** The field's standard vocabulary
goes unexplained. Anything outside its common training keeps its correct name — so a reader can
look it up — and gets one operational sentence saying what was actually computed.

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

A number quoted with an undefined symbol is not a checkable number: this is a correctness rule.

This note covers *what goes in the report*, including what form the source may take. The build
that turns that source into a shareable HTML file is
[`markdown-report-pipeline.md`](markdown-report-pipeline.md). Plotting conventions and the file
set of a study directory are a project's own to fix, and this note assumes only that they exist.

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

**A line belongs in `AGENTS.md` only if:** *would someone about to edit do the wrong thing without
it?* A fact rather than a constraint on action goes in another document, with `AGENTS.md` linking
to it. That file loads into every session in its subtree, so prefer a pointer to a précis. Much
past 150 lines it has started restating its neighbours.

**`LOGBOOK.md` is the designated home for project history** — every superseded claim, dead end,
correction and abandoned approach the rules below take out of the report. It may be chronological.
The report may not.

**A report is not obliged to be complete, and must not be widened to make it so.** Its scope is
whatever story it tells, which may be one extension rather than the whole subproject. A finding
with no place in that story belongs in `LOGBOOK.md` alone.

**`report.md` and `LOGBOOK.md` may cover the same material** in different orders; do not collapse
them. `README.md` and `AGENTS.md` may not restate a result those two own. `report.html` is
regenerated on every build, so any edit to it is lost.

## 1. The source is portable markdown: Unicode maths, no HTML

The source carries **neither raw HTML nor inline LaTeX**.

**Inline maths is Unicode.** Convert an expression only when no backslash and no brace is left,
so that nothing is ever half-rewritten. A subscripted word stays as an underscore and its letters.

**The build sets those underscores as real subscripts**, with `scripts/md_to_html.js` setting
them as `<sub>`. Two consequences:

- **A subscript is one letter, an underscore, then letters or digits.** `snake_case` is left alone,
  which is what separates identifiers and filenames from subscripts.
- **Put code in backticks.** A single-letter variable name in bare prose will be set as a
  subscript; backticked spans are never touched. `proseSubscript` in `scripts/tex_unicode.js` is
  the rule.

**Display equations stay as `$$...$$`,** and **a load-bearing formula gets `$$` even if it would
fit on one line.** The test is what the formula does, not how long it is: if the reader has to stop
and look at it, display it; an aside, a definition restated or a unit conversion stays inline.

**Use Unicode for the symbols inside the `$$` too.** Three things stay macros:

* **Function names**, which are set upright; spelled literally they render as italic variables.
* **Multi-letter sub- and superscripts.** A LaTeX script takes one token, so without braces the
  subscript loses its letters to the baseline. Use `\mathrm{}`.
* **Structure**: `\frac`, `\sqrt`, `\begin{gathered}`, `\\`, `\,`, `\qquad`.

Nothing is converted inside text and upright-roman arguments. **None of this applies to the
prose**, which never goes near MathJax: Unicode maths is simply correct there.

**Verify a rewrite, do not assume it.** Compare the rendered MathML before and after the change
rather than the rendered text, and note that the build refuses any character it cannot hand to
MathJax. The conversion table is in
[`markdown-report-pipeline.md`](markdown-report-pipeline.md).

**What no-HTML costs, and accept it:** semantic colouring becomes bold, multi-column layouts
become sequential sections, badges fold into their heading text, and sub- and superscripts become
Unicode where the character exists and `^x` or `_x` where it does not.

The builder is more permissive than this rule and will not catch a violation, so the project
needs its own check that counts raw tags, inline maths and stray macros outside display blocks
and exits non-zero.

## 2. No project history in the report

Delete every account of how the work went — "an earlier version of this script", "originally", "it
took a check to notice", "the simulation overruled it" — and first person of any kind. Say what is
true, not how it came to be believed.

**A superseded target is project history, and it hides in the numbers.** When a study is
retargeted, the old design point returns as prose: a value attributed to the design this one grew
out of, a component this study started from, a comparison against something the reader has never
been shown. Worse, it returns as whole paragraphs of the old point's numbers standing beside the
new.

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

Applying this usually means *moving* material rather than cutting it.

## 6. No document voice

Delete every sentence about the report — what is worth computing, what is worth stating carefully,
why the study did not stop somewhere, what the reader should recall from above. If a thing is worth
stating, state it.

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

Cut the tail; the sentence is finished without it. This is the commonest defect in these reports.

**Admiring the agreement is the commonest instance.** When a measurement lands on a closed form,
say that it does and give the numbers. State the spread and delete the adjective. Cut
"astonishingly well", "beautifully", "better than it has any right to be", and exclamations about
numbers. The same restraint applies to disagreement: quantify it rather than dramatising it.

**What is not a subjective tail.** Clauses that carry information stay: **a stated condition** that
makes the headline true; **a mechanism or cause**; **theoretical necessity with its scope** — "as it
must" is a fact about the claim's status, but say what it is forced over or cut it; **an
engineering judgement with a referent**; and **saying which of two things a number is**. The test:

> **Would a reader who disagreed with it have to check a different number, or only have a
> different temperament?**

A number, keep it. A temperament, cut it.

**Vague quantifiers are the same defect in miniature** — "a comfortable factor", "not a small
perturbation", "a big win". Each is a number the writer had and did not print. Print it, or cut the
restatement where the surrounding text already gives it.

**Finding them.** Grep `cleanest|sharpest|strongest|pleasing|elegant|striking|remarkable|worth
(having|stating|noting)|none of them small|happily|comfortable|very slightly`, then read every
sentence containing both a number and the word "and".

## 13. No sentence fragment with a comma-led modifier

> **[noun or gerund phrase], [comma-led modifier].**

There is no main clause. Give it a verb, and the sentence gets shorter as well as grammatical.

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

A lead-in that announces a topic — "**What it gets.**", "**The intent.**", "**Where the line
falls.**" — makes the reader open the paragraph to find out whether they needed it. So does the
shape that says what something is *not*.

**Put the finding in the header, with its number if it has one.** The reader who does not need the
paragraph can then skip it honestly.

**Finding them.** Grep every line beginning `**` and read the list on its own. A list of findings
reads as a summary of the report; a list of announcements reads as a table of contents.

## 16. One name, one meaning

A symbol, a word or a phrase means exactly one thing in a document. Four shapes:

**A symbol reused for an unrelated quantity.** **The fix is never to gloss it, it is to rename**,
and often the better rename removes the symbol entirely, since a constant that appears twice does
not need a name.

**Two objects with the same generic name** — two devices both called "the device", two source
papers both "the paper". A reader who combines a number from one with a number from the other gets
a contradiction and cannot tell whether the report is wrong or they are. Name each on first use and
say explicitly that the one is *not* the other.

**A word standing for several numbers** — a quantity meaning one thing in a table, another on a
figure axis and a third to the reader. Name the referent every time; never use the bare word.

**One quantity measured several ways, quoted without saying which** — several values, each correct
for its own method or condition, quoted as though they were one. **Say which variant produced the
number, every time, or use one variant throughout.** Grepping finds nothing wrong with this one.

**Finding them.** Extract every symbol and every capitalised or quoted term and list the distinct
quantities each denotes. Where a system holds several instances of a component, the bare noun is
never safe: name the instance. Where a script computes a number in more than one place, check the
places agree before quoting either.

## 17. Arithmetic the reader will attempt must close

Print two operands near a result and a reader will do the sum. **A sum that does not close is a
missing sentence, not a rounding problem**: it usually conceals a definition or a design decision
that was never stated, and a phrase like "with nothing fitted" invites exactly that check.

Three related shapes: **"so" between two independently computed numbers**, which hides an agreement
worth stating plainly; **a factor the reader has to derive**, so print the expression rather than
only its two ends; and **a word that describes the wrong operation**, which sends the reader's
arithmetic the other way.

**Check it after editing, not only after writing.**

## 18. Evaluate the closed form, and apply the method to the device

**A closed form that is printed and never evaluated.** Put numbers in it. It usually predicts, for
free, results the report is asserting from a parameter scan, and a prediction confirmed by a scan
is a stronger claim than a scan alone.

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

Three readers, none of them the author, because the author cannot see a naming collision or an
unclosed sum in their own document. **Run the first two at once** — they need nothing from each
other and they find disjoint sets. **Run the third only after both sets of findings are in the
document**, since its job is to rewrite what the first two have already corrected.

Readers two and three are deliberately from a different model family than reader one. Two readers
of the same family share blind spots, and the pass that catches the convention a project has
stopped seeing is the one run from outside it.

**Reader 1, the referee: a Claude Code agent with the whole repository.** The report, the logbook,
the result logs, the scripts and this policy. Check the science, and check every number against
`results/`. Finds sign errors, quantities described as the wrong thing, claims that outrun their
support, and the §18 analysis that was never pointed at the device.

**Reader 2, the second-year graduate student: a Codex agent given the report and its figures and
nothing else.** It has the field's background and none of the project's. Ask it to go front to
back naming every place it stopped, re-read or guessed and to quote the sentence; to ask for every
non-standard term to be explained rather than inferring it; and to say what a first-time reader
with limited patience would give up on and how the report should be reordered so they do not.
Finds §16 collisions, §17 arithmetic, symbols used before they are defined, terms the author has
stopped hearing, and whether the headline can be interpreted at all.

**Reader 3, the editor: a Codex agent given the report and nothing else.** It does not report
findings. It returns the whole report rewritten in the style of a well-written PhD dissertation
addressed to an incoming graduate student. Diff the rewrite against the source and take it
paragraph by paragraph: an editor holding no evidence can improve a sentence and break a number,
so every number, hedge and stated limit in what you accept goes back through the staleness sweep.

**Do not merge readers 1 and 2.** The referee must have the policy and the project; the student
must have neither, or it stops noticing what it was convened to notice.

**Ask readers 1 and 2 about the structure, not only the sentences,** in as many words: does the
order carry the argument, is anything in the wrong place, what did you need earlier than you got
it, and what could go. Line-level defects are volunteered; structural ones have to be asked for.

**Ask readers 1 and 2 for their findings in small numbered batches, and put that in the brief** —
one topic per message, numbered continuously so a gap is visible. Output limits truncate the tail,
which is where the structural findings sit.

**Two items per message, not five.** A batch of five arrives cut inside the fourth, and the cut
lands at about the same length every time, so asking the same reader for "the rest" the same way
loses the same tail again. Say so in the brief, in as many words: *a short message that arrives
whole beats a complete one I only get 80% of, so cut the batch and send the remainder next.*

**Prompt for every batch. A reader that has sent one goes idle and stays there.** It is waiting
for a request it has no way to know is wanted, and a batch never arrives unasked — budget one
message per batch and expect to send them all. Do not wait for the next one to appear; it will
not.

**When re-requesting, give the high-water mark and not a description.** "I have items 1 through 7
complete and nothing after" continues; "send the rest" and "carry on where you left off"
re-summarise, and a reader asked twice for a tail may resend the whole batch instead. Say which
items are in hand every time, and name the fragment you are missing by quoting its last few words
— a reader cannot see where its own output was cut.

**Expect readers 1 and 2 to disagree.** Resolve it in the text rather than by picking a side; where
that is impossible, the referee wins on accuracy and the student wins on placement.

**A fix is an edit, so re-run the checks after it.** After any substantial edit, diff the prose for
repeated sentences, re-run the number audit, and re-render every figure whose data moved.

#### Handing a report to a reader outside the local model family

Readers 2 and 3 are the ones this applies to, and the pass is easily faked.

- **Verify which model actually read the document.** A plugin offering a foreign model may route
  through a wrapper of the local family. The give-away is a reader describing tools of its own
  rather than the foreign runtime.
- **The foreign harness reads `AGENTS.md` by default, which destroys the restricted view**, and no
  instruction prevents it. **What does prevent it is giving the reader a working root outside the
  repository** — run it with its own `--cd`/`-C` set to a scratch directory and the git-repo check
  skipped, and it finds no `AGENTS.md` to read. What hangs is pointing a *repository-rooted*
  sandbox at a path outside itself; moving the reader's root is a different thing and works.
- **Inline the document anyway rather than pointing at a path.** Put the whole report in the prompt
  inside `<document>` tags with `cat -n` line numbers so it can cite them. Inlining is what makes
  "the report and nothing else" true of the content rather than only of the filesystem, and it
  survives a reader that decides to go looking.
- **Ask the reader to name its own model and runtime, and keep the answer.** One line at the top of
  the brief, answered before anything else, is the cheap version of the verification above.
- **Attach the figures to reader 2, and ask about them specifically.** Send raster renders of any
  figure the report embeds as vector art. Reader 3 gets the text alone.
- **Set the reasoning effort explicitly**, since it defaults from the CLI's own config, and **tell
  reader 2 the report has already been reviewed**, or it invents concerns to fill every heading.
- **Give reader 2 a line budget per batch, or it reads the first fifty lines exhaustively and
  stops.** Left to itself it treated seven stops in the opening two pages as a batch. Tell it how
  many lines the batch covers and that reaching the end matters more than completeness inside any
  one section; its later batches are then worth more than its first.
- **Resuming the reader keeps the attached figures**, so a session is worth continuing rather than
  restarting per heading. Check the resume subcommand's own flags: the ones that set the working
  root and the sandbox are usually accepted only on the initial call, and the session's own root
  is inherited.

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
