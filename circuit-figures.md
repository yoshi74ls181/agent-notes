# Circuit schematics with CircuiTikZ

Draw circuit figures as hand-written `standalone` LaTeX sources so geometry is reviewable
and symbols and fonts match the surrounding maths. Keep circuit-specific reasoning in each
figure's `.tex` file.

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

A `standalone` page and its converted SVG need an explicit background. Otherwise dark strokes
can disappear in dark-themed viewers; a viewer's white canvas can hide the transparency.

**Avoid `\pagecolor{white}`:** it can defeat `standalone` cropping and emit a full page.
Use a TikZ background rectangle and put the padding inside it:

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

* **The aspect ratio controls the displayed height.** Aim near 1.6:1; a square schematic at
  full column width is tall.
* **A small drawing magnifies its labels when expanded to column width.** Enlarge the geometry
  while keeping fonts at `footnotesize`. For example, changing to `x=1.75cm, y=1.75cm` scales
  coordinates; multiply absolute bipole lengths, node sizes, line widths, arrows, and decoration
  dimensions by 1.75 separately.

**There is no Josephson-junction bipole in CircuiTikZ.** The JJ is a *node* style drawing the
standard crossed box, filled white so the wire appears to terminate on it:

```latex
jj/.style={draw, line width=0.9pt, fill=white, inner sep=0pt, minimum size=4.4mm,
  path picture={\draw[line width=0.9pt]
    (path picture bounding box.south west) -- (path picture bounding box.north east)
    (path picture bounding box.north west) -- (path picture bounding box.south east);}}
```

**Label mutual-inductance signs explicitly when winding sense is ambiguous.** For perpendicular
coils, write `+M_p` and `-M_p` beside the couplings. Opposite-sign mutuals into two loops can
thread same-sign flux; the labels make the schematic checkable against the netlist.

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

Draw the simulated netlist element for element, including solver-required parasitic inductances,
port resistors, and DC ground paths. These can explain results that an idealised drawing hides.

Three consequences worth planning for:

* **State parasitic values.** For example, label a 0.1 pH loop inductance beside a 100 pH main
  inductor, and draw it short.
* **Name omitted elements in the caption.** An inactive port may be omitted for space; record
  how to restore it in the `.tex` source.
* **Explain drawn elements absent from the netlist.** If a component is removed at an exact
  open-circuit bias point, say that it carries no current.

## Traps

**`\ctikzset{bipoles/length=...}` is global** and set before `\begin{document}`; changing it
mid-picture rescales everything after that point, including elements you thought were finished.

**Check collisions after geometry changes.** Inspect ground symbols, rail junctions, component
labels, and coupling arrows. Remember that `l_=` anchors a label at a bipole's midpoint; anchor
annotations to end before an obstacle rather than extend across it.

**Value labels crowd their own symbol.** A stacked `\substack` value under a capacitor sits on the
plates unless it is shifted; horizontal bipoles put `l=` labels above the symbol, close enough to
touch a coil. Nudge with `xshift`/`yshift`, or raise `label distance` in a local scope.

**`standalone` sizes the page to the bounding box**, so a stray label or an arrow that overshoots
silently changes the figure's aspect ratio and therefore its rendered height. Check the reported
`papersize` in the `pdflatex` output after any layout change — it is the fastest signal that
something moved.

**Render after every geometry change.** Use
`pdftoppm -r 130 -png -singlefile circuit.pdf circuit_preview`, then inspect the PNG.
Crop with `-x -y -W -H` for close checks of crowded regions.

**Keep the committed preview in step with the source, or drop it.** A stale raster beside a
current `.tex` is worse than none: it is the thing a reader opens.

**Preserve literal backslashes when writing TeX.** Prefer an editor tool to shell interpolation.
If using a patch script, `chr(92)*2` constructs a literal `\\` without shell escaping.
