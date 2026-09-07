# Circuit schematics with CircuiTikZ

Draw a circuit figure from a hand-written `standalone` LaTeX document rather than from a drawing
program. The schematic is then a text file that diffs, and its symbols and fonts match the maths
around it. This note is the part shared between figures; each figure's own `.tex` should carry
the reasoning specific to that circuit, next to the drawing it explains.

The plotting rules — colour, honesty, what to check before shipping — are in
[`figure-conventions.md`](figure-conventions.md), and the ones about recessive elements and about
opaque backgrounds apply here too.

## Building

```bash
cd <the figure's directory>
pdflatex circuit.tex                       # or latexmk -cd -pdf circuit.tex
pdftocairo -svg circuit.pdf circuit.svg    # vector copy for an HTML report
```

`pdflatex`, `latexmk` and `pdftocairo` all ship with TeX Live; `pdftocairo` comes from the poppler
utilities bundled with it. Nothing else is needed — no Node, no Python.

**What to commit.** The `.tex` is the source and the `.svg` is the deliverable an HTML report
embeds, so commit both. Commit the `.pdf` **only** where a LaTeX document `\includegraphics` it;
where the PDF is a pure intermediate on the way to the SVG, gitignore it along with the `.aux` and
`.log`. Rasterised previews are intermediates too.

## Give the figure an opaque background, and not with `\pagecolor`

A `standalone` page is transparent. So is the PDF built from it, and so is every SVG converted
from that PDF — which means black strokes on nothing, invisible in a dark-themed viewer. Nothing
in the build warns, and no image viewer will show you: viewers composite transparency onto their
own white canvas, so the figure looks right in the one place you are most likely to check it.

**`\pagecolor{white}` is the obvious fix and it is the wrong one.** It defeats `standalone`'s
crop and emits a full letter page — one figure's viewBox went from 634 × 390 pt to 612 × 792.
Use the tikz background rectangle, which fills the bounding box, and move the border inside it:

```latex
\documentclass[border=0pt]{standalone}
\usetikzlibrary{backgrounds}
...
\begin{tikzpicture}[show background rectangle, inner frame sep=5pt,
    background rectangle/.style={fill=white}, ...]
```

`inner frame sep` is what puts the padding inside the white area rather than leaving a transparent
margin around it. Verify on the file rather than by eye — there should be a white-filled path
covering the whole viewBox.

## Conventions, and why each one is that way

**Draw at final size.** A figure drawn ~17.6 cm wide goes into a two-column
`\includegraphics[width=\textwidth]` with no scaling, which keeps the label sizes honest: a
schematic scaled down 30% has labels 30% too small for the body text beside it. For an
HTML-only figure the same discipline matters twice over, because a report stylesheet will
typically set `figure img{width:100%}`:

* **The aspect ratio you draw is the height the reader gets.** Aim near 1.6:1. A near-square
  schematic at full column width is enormous on screen.
* **A small drawing is scaled UP, and every label with it.** A figure first drawn 9 cm wide and
  then magnified about 3× to fill the column had labels visibly larger than the body text beside
  them. The cure is to draw the geometry larger and leave the type alone: give the `tikzpicture`
  `x=1.75cm, y=1.75cm` and multiply every *absolute* length by the same 1.75 — bipole lengths,
  node sizes, line widths, arrow lengths, decoration amplitudes and segment lengths. Coordinates
  follow the unit vectors; none of those do, which is why they have to be done by hand. Keep
  fonts at `footnotesize`, and the label-to-figure ratio lands near the body-text-to-column ratio.

**There is no Josephson-junction bipole in CircuiTikZ.** The JJ is a *node* style drawing the
standard crossed box, filled white so the wire appears to terminate on it:

```latex
jj/.style={draw, line width=0.9pt, fill=white, inner sep=0pt, minimum size=4.4mm,
  path picture={\draw[line width=0.9pt]
    (path picture bounding box.south west) -- (path picture bounding box.north east)
    (path picture bounding box.north west) -- (path picture bounding box.south east);}}
```

**State mutual-inductance signs as labels, not as winding sense.** Where a flux line's coils are
drawn perpendicular to the loop inductors they couple to — which is often the layout the circuit
actually has — a dot convention would be geometrically meaningless. Write the sign next to each
coupling instead, `+M_p` and `-M_p`. The signs are the whole content: opposite-sign mutuals into
two loops are what thread the *same-sign* flux through both, so putting them in the picture rather
than only in the netlist is what makes the figure checkable against the netlist the simulation
uses.

**Coils are a decoration, not a bipole.** `to[cute inductor]` is available but is hard to place on
an exact segment, so draw a coil along a known segment with
`decoration={coil, aspect=0.62, segment length=1.55mm, amplitude=1.15mm}`, wrapped in small
`\vcoil` / `\hcoil` macros. A shorter `segment length` and smaller `amplitude` gives a visually
smaller inductor, which is how a figure can say that a parasitic is orders below the real element
beside it.

**Flux into the page is a circled cross,** drawn by a macro rather than by a character, so it
scales with the line width.

**Subordinate elements are `black!45`.** A bias line that is real but not the subject is drawn
faint. That is the same rule as the recessive dashed grey for theory curves in
[`figure-conventions.md`](figure-conventions.md).

## Draw the netlist, not the idea

Make the figure a picture of the netlist the simulation actually runs, element for element,
including the parts that exist only because the solver needs them: a parasitic loop inductance for
a flux line to couple to, a port resistor, a DC path to ground. That is deliberate. A reader
checking a simulation result wants to know what was simulated, and a tidied schematic of the
*idea* hides exactly the elements most likely to be responsible for a surprise.

Three consequences worth planning for:

* **Say how big a parasitic is.** A loop inductance of 0.1 pH against a 100 pH main inductor looks
  like a design element if the number is missing. Put it in the caption, and draw it short.
* **Leaving an element out is allowed, but say so in the caption.** A third port held at zero in
  every result cost a third of one figure's height to draw, so it was named in the caption
  instead, with the `.tex` recording how to put it back.
* **A drawn element that is absent from the netlist needs the same care in reverse.** Where a
  component is an exact open circuit at its bias point and is therefore *removed* from the
  netlist rather than carried along inert, drawing it is still right — but the caption has to say
  it passes no current, or a reader will look for it in the solver's element list.

## Traps

**`\ctikzset{bipoles/length=...}` is global** and set before `\begin{document}`; changing it
mid-picture rescales everything after that point, including elements you thought were finished.

**Adding anything moves other things onto each other, and only the render shows it.** One edit
produced three collisions, none visible in the source: a ground symbol landed where a new
inductor met a rail; a label collided with another because `l_=` puts a `to[L]` label at the
bipole *midpoint* on its left, which was the same spot; and a new caption ran through a ground
symbol. A later edit drew a pump-modulation label straight through a coupling arrow, because the
label was anchored to extend rightward across the arrow's whole vertical span. Anchor it to *end*
before the obstacle instead.

**Value labels crowd their own symbol.** A stacked `\substack` value under a capacitor sits on the
plates unless it is shifted; horizontal bipoles put `l=` labels above the symbol, close enough to
touch a coil. Nudge with `xshift`/`yshift`, or raise `label distance` in a local scope.

**`standalone` sizes the page to the bounding box**, so a stray label or an arrow that overshoots
silently changes the figure's aspect ratio and therefore its rendered height. Check the reported
`papersize` in the `pdflatex` output after any layout change — it is the fastest signal that
something moved.

**Render and look at it.** `pdftoppm -r 130 -png -singlefile circuit.pdf circuit_preview` gives a
PNG to inspect, and cropping with `-x -y -W -H` lets you look closely at one corner. A rail
overshooting its capacitor by 0.65 cm and a near-square aspect ratio both survived a careful
reading of the source and were obvious in the image. Build the PNG and look after *every* geometry
change, not once at the end.

**Keep the committed preview in step with the source, or drop it.** A stale raster beside a
current `.tex` is worse than none: it is the thing a reader opens.

**A shell heredoc can eat a literal `\\`.** Writing a `.tex` through one has silently destroyed
TeX line breaks, turning a two-line label into `match\$`. Build the sequence as `chr(92)*2` in the
patch script, or use an editor tool that does not go through a shell.
