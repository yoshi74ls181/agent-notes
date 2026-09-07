# Circuit figures with CircuiTikZ

Use a small LaTeX source when a schematic benefits from versionable geometry and mathematical labels. Keep circuit-specific explanations beside that source. Apply the readability and export checks in [figure conventions](figure-conventions.md).

## Source and build

A minimal example with an explicit white background:

```latex
\documentclass[border=0pt]{standalone}
\usepackage{circuitikz}
\usetikzlibrary{backgrounds}
\begin{document}
\begin{circuitikz}[
  show background rectangle,
  inner frame sep=5pt,
  background rectangle/.style={fill=white}]
  \draw (0,0) to[R, l=$R$] (3,0);
\end{circuitikz}
\end{document}
```

Run these commands in the figure's directory:

```sh
pdflatex -interaction=nonstopmode -halt-on-error circuit.tex
pdftocairo -svg circuit.pdf circuit.svg
pdftoppm -r 150 -png -singlefile circuit.pdf circuit-preview
```

The build needs a TeX installation with `standalone` and `circuitikz`; the conversion commands need Poppler. Install them through the environment's package manager as needed. Consult the [CircuiTikZ manual](https://ctan.org/pkg/circuitikz) for symbols and options supported by your version.

## Layout and meaning

- Draw for the intended output width and check label sizes after scaling. Aspect ratio should follow the content and destination.
- Check component sizes, line widths, and label offsets when changing coordinate scale; absolute dimensions may need separate adjustment.
- Use standard symbols where available. Define reusable local styles for custom symbols.
- Make connections, grounds, current directions, and coupling signs unambiguous. Define the reference directions behind sign labels.
- If the figure documents a simulation, match its topology to the netlist. Identify omitted, idealised, or solver-only elements in the caption when they affect interpretation.
- Keep secondary elements visually subordinate while preserving legibility.

## Export checks

Inspect a render after geometry changes. Look for collisions between labels, wires, symbols, and arrows; verify the cropped bounds and background coverage. A TikZ background rectangle keeps the fill tied to the drawing's bounds; check the resulting SVG rather than relying on the viewer's background.

Keep the `.tex` source and the outputs required by the consuming document under version control according to the host project's policy. Ignore auxiliary build files and unnecessary previews. Regenerate retained outputs whenever the source changes.
