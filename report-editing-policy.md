# Editing policy for reports

A report is **reader-facing**: someone who has never seen the project reads it front to back and
follows the science, learning nothing about the order in which it was found.

This note covers *what goes in the report*, including what form the source may take. The build
that turns that source into a shareable HTML file is
[`markdown-report-pipeline.md`](markdown-report-pipeline.md). Plotting conventions and the file
set of a study directory are a project's own to fix, and this note assumes only that they exist.

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

## 2. Order by logic, not by discovery, and keep the history out

The report says what is true, not how it came to be believed. That governs the sentences and the
order of the sections alike, and it is one rule because the two fail together: a document that
carries its own history tends to be arranged in the order the work happened.

**Delete every account of how the work went** — "an earlier version of this script",
"originally", "it took a check to notice", "the simulation overruled it" — and first person of any
kind.

**A caption carries neither the figure's edit history nor a branch of its plotting code that did
not fire.** The justification for a *choice the reader can see* — a zero baseline, an equal aspect
ratio — does belong there.

**A superseded target is project history, and it hides in the numbers.** When a study is
retargeted, the old design point returns as prose: a value attributed to the design this one grew
out of, a component this study started from, a comparison against something the reader has never
been shown. Worse, it returns as whole paragraphs of the old point's numbers standing beside the
new.

**The report presents one device.** Every comparison against a previous one is history, however
quantitative, and every number from it is wrong. A retarget is a sweep of the whole document; the
staleness sweep of §10 is the procedure.

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

## 4. The source is portable markdown: Unicode maths, no HTML

The source carries **neither raw HTML nor inline LaTeX**.

**Do not hard-wrap. One paragraph is one line.** Let the editor soft-wrap it to whatever width
the window has. A source hard-wrapped to a fixed column is unreadable in any editor narrower
than that column, which is the case the wrapping was supposed to help, and it re-wraps to a
different width for every reader who has a different one.

Three further reasons, and the last is the one that bites:

- **A diff of hard-wrapped prose is unreadable.** Change a word in the first sentence and every
  line of the paragraph reflows, so the diff shows the whole paragraph and hides which word
  moved. Unwrapped, the diff is the paragraph that changed and nothing else.
- **Search and edit both work on whole sentences.** A grep for a phrase fails when a line break
  falls inside it, and an exact-string edit needs the break reproduced.
- **Wrapping can change what markdown means.** A wrap that puts `|S21|` at the start of a line
  invents a table row; one that lands on `- ` or `1. ` invents a list. A hard-wrapper has to know
  the markup to avoid this, and none of ours did — this is not a hypothetical.

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

## 5. Sections are numbered, and cross-references name their target

**Number every section and subsection, to whatever depth the report goes.** `## 4.` and
`### 4.2` in the main text; `## C.`, `### C.2` and `#### C.2.1` in the appendices. Front matter
ahead of the first section is not a section and takes no number. A section number is the only
handle on a passage that neither moves when the document is reordered nor reflows when a sentence
is edited, which is what makes it the thing to cite.

Never "the previous section" or "as discussed above" — sections move and those references invert
silently. Name the section by its number, or name the object.

## 6. Arithmetic the reader will attempt must close

**A vague quantifier is a number the writer had and did not print** — "a comfortable factor", "not
a small perturbation", "a big win". Print it, or cut the restatement where the surrounding text
already gives the number.

Print two operands near a result and a reader will do the sum. **A sum that does not close is a
missing sentence, not a rounding problem**: it usually conceals a definition or a design decision
that was never stated, and a phrase like "with nothing fitted" invites exactly that check.

Three related shapes: **"so" between two independently computed numbers**, which hides an agreement
worth stating plainly; **a factor the reader has to derive**, so print the expression rather than
only its two ends; and **a word that describes the wrong operation**, which sends the reader's
arithmetic the other way.

**Check it after editing, not only after writing.**

## 7. Evaluate the closed form, and apply the method to the device

**A closed form that is printed and never evaluated.** Put numbers in it. It usually predicts, for
free, results the report is asserting from a parameter scan, and a prediction confirmed by a scan
is a stronger claim than a scan alone.

**A method validated on something other than the device** — a prescription validated on a test case
and never applied to the device the report designs, whose corresponding number is fitted instead.

Three honest endings, and the report must pick one: **apply it** and quote the prediction against
the measurement; **say it was not applied**, so the quantity is an input rather than a prediction;
or **delete it** and leave the record in `LOGBOOK.md`. Presenting the validation as though it
licensed the result is not available.

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

**An agent with the whole repository** — the report, the logbook, the result logs, the scripts and
this policy. Check the science, and check every number against the evidence. Finds sign errors,
quantities described as the wrong thing, claims that outrun their support, and the §7 analysis
that was never pointed at the device.

### Reader 2, the second-year graduate student

**A foreign-family agent given the report and its figures and nothing else.** Ask it to go front
to back naming every place it stopped, re-read or guessed and to quote the sentence; to ask for
every non-standard term to be explained rather than inferring it; and to say what a first-time
reader with limited patience would give up on and how the report should be reordered so they do
not. Finds §3 collisions, §6 arithmetic, symbols used before they are defined, terms the author
has stopped hearing, and whether the headline can be interpreted at all.

Two things this reader needs and the others do not:

- **Attach raster renders of any vector figure, and ask about them specifically.** It cannot
  rasterise an SVG or a PDF itself.
- **Say that the report has already been reviewed**, or it invents concerns to fill every heading,
  and **say that the reply must cover the whole document**, or it reads the first fifty lines
  exhaustively and stops.

### Readers 1 and 2, and what comes back from them

**Ask both about the structure, not only the sentences,** in as many words: does the order carry
the argument, is anything in the wrong place, what did you need earlier than you got it, and what
could go.

**Ask both to propose additions and modifications to this policy, in a section of their own.** The
pass is the only occasion on which anyone reads a report against these rules from a standing
start, so it is the best evidence there is about whether the rules are the right ones. The two are
asked different questions, because they hold different things:

- **Reader 1 has the policy and cites a rule by number.** A rule that was ambiguous to apply; one
  whose prescribed check does not catch what it claims to; one that no longer earns its length;
  a defect it found that no rule covers.
- **Reader 2 does not have the policy**, and is asked the naive form of the same question: what
  should the report have told you that it did not, and what would have stopped you giving up. A
  rule proposed from that answer comes from someone who met the document cold, which is the one
  vantage the policy cannot otherwise get.

Those proposals go to whoever owns the policy, not straight into it. It is shared across
repositories, so a change made to suit one report can cost another.

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

**The mechanics of running one are in [`codex-cli.md`](codex-cli.md)** — the flags, how to get
the reply into a file, how to restrict what the reader can see, and the traps. Read it before
convening either. What that note does not decide, this one does:

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
