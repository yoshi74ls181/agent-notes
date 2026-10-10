# Writing style

These rules apply to all human-facing prose.

## Reader and voice

The default reader is a capable colleague outside the project who has not seen the research or the conversation.
Write plainly and directly, in the active voice by default.
Follow the user's language and spelling conventions.

## Rules

### R1. Lead with the answer

The opening states the main finding, recommendation, or request, and background comes after.
In a design document, the answer is what to build and what it costs.

- Bad → Good: "This report examines several factors…" → "Switching to X cuts build time by 40%; the rest of this note explains why."

### R2. Define before use

Define every acronym, symbol, and specialist term the reader would not already know at its first use, or don't use it.
Vocabulary standard in the reader's own field needs no definition.
Expand every acronym, including the ones that name the device.
Prefer a quantity's plain-English name to a symbol, and keep a symbol only where the text needs it.
When a term comes from a field the reader doesn't work in, say what it gives them, not just what it is.
A word with a different meaning in the reader's field needs replacing, not just defining.
Name a special function on first use and give the numerical facts the text leans on, such as the peaks, zeros and limits a result sits on.
Don't assume the reader has read the source paper.

- Bad → Good: "The ELBO dropped." → "The evidence lower bound (ELBO), the quantity the model maximizes, dropped."
- Bad → Good: "the sine-Gordon equation, a version of the relativistic Klein–Gordon equation" → "a wave equation of the same form as a relativistic field theory, so the junction is a relativistic field theory on a chip"
- Bad → Good: "the coupling $\beta^2$, which stands where Planck's constant would stand in the action" → "$\beta^2$ sets the size of the phase's zero-point fluctuations: the higher the impedance, the more the phase fluctuates, as in fluxonium" (to a circuit physicist "coupling" means qubit–resonator coupling)

### R3. Say how sure you are, once

State the confidence and the evidence for each claim plainly.
Don't stack hedges ("may possibly suggest").

- Bad → Good: "This might perhaps indicate a possible link." → "Two of three datasets show the link; the third is too small to tell."

### R4. Prefer the concrete

Use numbers, names, and examples instead of vague quantifiers ("significant", "various", "many").

- Bad → Good: "Performance improved significantly." → "Latency fell from 120 ms to 45 ms."

### R5. No throat-clearing

Cut openers like "It is important to note that" and "It should be mentioned that".

- Bad → Good: "It is worth noting that the API is rate-limited." → "The API is rate-limited."

### R6. Name what "this" refers to

Follow "this", "that", and "these" with a noun when the referent could be unclear.

- Bad → Good: "This causes problems." → "This retry loop causes problems."

### R7. Lead with the physics, not the author

Never open a sentence with an attribution of the form "X (year) did Y".
State the physics or logic first and put the citation in parentheses after it.

- Bad → Good: "Josephson (1962) described screening in words: in weak fields, …" → "In weak fields the junction's own currents screen the field, but over a long penetration depth (Josephson 1962)."

### R8. Don't discuss priority

Leave out who was first, fair-attribution arguments, and "earliest use of the term" remarks.
Cite the work that matters and move on.

- Bad → Good: "Their footnote 4 records that Josephson had obtained the same formula in his unpublished PhD thesis. The fair attribution is therefore …" → (cut)

### R9. Open with a question only when it helps the reader

Open a document or section with a question only when the question tells the reader why the part matters.
When the heading or the first sentence already says what the part is, start with the content.
A document's opening question must be the one it answers, not a broader motivation it leaves open.

- Bad → Good: "We review sixty years of work on this system in historical order, organized by one number …" → "What kept physicists working on long Josephson junctions for sixty years? Our answer is …"
- Bad → Good: "Which circuit elements establish the qubit, its coupling mechanism and the readout?" opening a subsection headed "The circuit" → (cut; the subsection starts with the circuit)
- Bad → Good: "How much microwave loss does a Josephson junction's tunnel barrier contribute?" opening a design report → "This report designs a flux-tunable qubit whose electric field stays in its junction barriers, …"

### R10. One sentence per line in the source

In markdown, LaTeX and other plain-text source, start every sentence on its own line, and separate paragraphs with a blank line.
Labels such as "**Figure 2.**" stay on the line of the sentence they introduce.

- Bad → Good: "What kept physicists working on long Josephson junctions for sixty years? Our answer is that …" → "What kept physicists working on long Josephson junctions for sixty years?⏎One answer is that …"

### R11. Keep technical machinery out of the opening

In the abstract and the first paragraphs of the introduction, show why the topic is interesting and useful in terms the whole target audience follows.
Bring in a specialist parameter, symbol or formula only after that motivation, and don't make the main answer depend on it.
The same holds at the head of each section: its first sentences give the section's point, and technical caveats and limits go to the subsection that treats them.

- Bad → Good: "Our answer is that a long junction is a relativistic field theory that fits on a chip, and that one circuit parameter sets how quantum that theory is. … written $\beta^2=2\pi Z/R_Q$ …" → "One answer is that a long junction is a relativistic field theory that fits on a chip, with particles that can be counted, imaged and put to work."
- Bad → Good: "The three-junction circuit provides readout through the junctions' nonlinearity, while the bridge's stray capacitance limits the qubit's barrier participation." as the second sentence of a long section → the stray-capacitance limit moved to the subsection on barrier participation

### R12. Keep abstracts and summaries to the answer and the key results, and make them stand alone

An abstract runs to about 200 words.
An abstract or summary keeps the question, the answer, the targets, the main results and the open problem; element values, derivations, device details and secondary examples go to the body.
Result numbers belong in it, since the conclusions are the numbers; leave out only a number whose meaning needs the body.
It uses no term the document itself coins unless the term is glossed in the same breath, and it states each finding without the evidence for it.

- Bad → Good: A 330-word abstract that restated the transmission-line picture, gave two impedance examples and described a proposed circuit → a 210-word abstract with the question, the three excitations, their uses, classical → quantum, and the open problem.
- Bad → Good: "Shunt the pads with symmetric antennas providing 121.5 fF between them, and couple one antenna through 26.3 fF to a separate quarter-wave readout resonator 4.917 mm long." → "Symmetric antennas shunt the pads, and one antenna couples capacitively to a separate quarter-wave readout resonator."

### R13. One name per quantity, one quantity per name

Refer to each quantity the same way throughout the document, with its precise name.
Don't swap in informal stand-ins ("costs", "is worth" for an energy) or loose words ("levels" for distinct particle species).
A symbol, word or phrase means one thing in a document: rename a symbol reused for an unrelated quantity, name each of several similar objects distinctly (never the bare noun where there are several instances), and name the referent where a word could stand for several numbers.
Figure axis labels, legends and on-canvas text carry the same names as the prose.
A word of size beside a signed quantity (falls, grows, stronger, weaker) says whether it means the value or the magnitude.
A dimensionless ratio names what it is referred to, and a quantity that totals part of a system says which parts it includes.

- Bad → Good: "a fluxon costs $8/\beta^2$ … a fluxon is worth $4\times10^4$ plasma quanta" → "the rest energy of a fluxon is $8/\beta^2$ plasma quanta … the rest energy of a fluxon is $4\times10^4$ plasma quanta"
- Bad → Good: "the shift grows to −8 MHz" beside a negative coefficient → "the shift's magnitude grows to 8 MHz"

### R14. Put each figure and box just after its first citation

Place every figure (image and caption) and every box immediately after the paragraph whose body text first cites it, and number figures and boxes each in the order they appear.
Citations in captions or in other boxes don't count.
If a figure is first cited inside a box or list, put it right after that box or list.

- Bad → Good: "The history of long junctions is a climb along this axis (Fig. 4)." followed by three paragraphs and a table before Figure 4 → Figure 4 placed directly after that paragraph.

### R15. Label phase and angle axes in radians, with ticks at multiples of π

On a plot of a phase or an angle, use radians and put the ticks at simple multiples of π (π/4, π/2, π, 2π), labelled as such.
Don't plot rescaled units like φ/2π.
When the phase is wrapped, the axis runs exactly from −π to π, with no margin above or below.

- Bad → Good: y axis "φ/2π" with ticks 0, 0.5, 1 → y axis "φ" with ticks 0, π/2, π, 3π/2, 2π
- Bad → Good: wrapped phase on a −1.1π..1.1π axis → the same phase on exactly −π..π

### R16. Put panels that compare sizes on one scale

When panels show quantities the reader should compare, such as the amplitudes of different excitations, give them the same axis range.
Don't rescale each panel to fill its frame.

- Bad → Good: a 0.12 rad plasma ripple on a ±0.2 rad axis next to a 2π fluxon on a 0–2π axis → all three phase profiles on one −3π/2 to 2π axis, where the ripple is visibly small

### R17. Leave the project's history out of the text

In anything a newcomer may read, state the current content only.
Leave out how it came about: who asked for what, earlier versions, changed decisions, review rounds, and a figure's edit history.
Deleting the history is not deleting the reason: where "an earlier version did X" is the only place the text says why it does Y, rewrite it as what it does and why, and check the reason survives.

- Bad → Good: "The user first asked for 'just before', then changed it to 'just after' and extended it to boxes." → (cut; the text states only the current rule)

### R18. Captions say what each panel shows

A caption states what the figure shows, panel by panel, plus only what is needed to read it correctly: the qualifier on a plotted quantity (that it is computed, approximate, or a threshold the author set rather than an error bound) and the reason for a choice the reader can see, such as a zero baseline or an equal aspect ratio.
Definitions, formulas, derivations and explanations of the physics go in the text or a box.

- Bad → Good: "(b) A junction much shorter than $\lambda_J$ is a single LC resonator: its Josephson inductance $L_J=\Phi_0/2\pi I_c$ in parallel with the capacitance $C$ …, resonating at $\omega_p=1/\sqrt{L_JC}$." → "(b) A short junction as an LC resonator."

### R19. Draw circuit elements with their standard symbols

In circuit diagrams, use the standard symbol for every element: an inductor as a row of coil loops, a resistor as a zigzag or box, a capacitor as two plates, a Josephson junction as a cross.

- Bad → Good: series inductors drawn as smooth bumps that read as resistors → the same inductors drawn as coil loops

### R20. Give signal powers in dBm

State microwave, millimetre-wave and terahertz signal powers (emitted, delivered, detected) in dBm, not in watts.
A dc dissipation stays in watts.

- Bad → Good: "Sn junctions on cavity steps emitted $10^{-14}$–$10^{-12}$ W near 10 GHz" → "Sn junctions on cavity steps emitted −110 to −90 dBm near 10 GHz"

### R21. Put each figure label right next to the mark it names

Place every annotation in a figure directly beside the point, line or bar it labels, and add a short leader line when it can't sit close.
A label must never sit between two marks or closer to a different one.

- Bad → Good: "junction theory 1967" right-aligned above a gap between a bar and a dot, and "sine-Gordon models of …" below the next row → each label beside its own mark, with a leader line to the 1967 dot

### R22. Show sweeps as plots, not tables

When a quantity is varied against a parameter, show it as a plot.
Keep tables for definitions and for single design-point values.

- Bad → Good: a five-row table of the qubit's barrier participation against the bridge's stray capacitances → a plot of the fraction outside the barriers against the stray, with the closed-form estimate as a line

### R23. A cross-reference names its target

Never write "the previous section", "as discussed above" or "see the other study".
Name the section by its number or title, name the object, and name a sibling document or study rather than pointing at it.

- Bad → Good: "As discussed above, the coupling is weak." → "The coupling is weak (§2.5)."

### R24. General case first, special case second

Introduce a controlling parameter before the cases it distinguishes, and let each case follow from where it sits on it.
Where the cases fork, make the fork explicit in a short passage that states the regimes and what each implies.

- Bad → Good: three sections on three junction lengths, each with its own threshold → one paragraph on the length that separates them, then the three cases in order of it
