# Figure conventions

Make figures reproducible, legible at their intended size, and explicit about what the data supports. Keep data sources, transformations, and export commands with the code that produces each figure.

## Encode the data consistently

- Use sequential colour scales for ordered magnitudes, diverging scales around a meaningful reference, and categorical colours for identities.
- Keep each entity's colour consistent across panels and filtered views. Add labels, marker shapes, or line styles so colour is not the only identifier.
- Check contrast against the actual background and inspect colour-vision-deficiency simulations. No palette is universally safe across sizes, backgrounds, and encodings.
- Distinguish reference curves, predictions, and fits in the legend or caption. Subdued dashed lines often work for references.
- Prefer separate panels to dual y-axes. Match limits where direct comparison requires them, and use equal aspect ratios when geometric distances matter.

## Show the evidence honestly

- Make overlapping series distinguishable, for example with a line for one and sparse markers for another.
- Mark invalid or unresolved samples distinctly and explain the validity test. Break lines across invalid regions; filtering points alone can connect across a gap.
- Explain omissions and selection criteria in the caption. Derive validity from the measurement or method rather than an unexplained cutoff on the independent variable.
- Compare series under matched conditions, or state how those conditions differ. Values taken at each series' own optimum answer a different question from values at a shared setting.
- Label units, baselines, uncertainty, and any corrections that affect interpretation. See [report editing](report-editing-policy.md).

## Design for the output

Set canvas dimensions, fonts, strokes, and marker sizes for the final display size. If both web and print versions are needed, generate both from the same data and check each layout. Use vector output for line art where supported and sufficient raster resolution for the intended physical size.

Choose an explicit background. An opaque light background is a useful default for dark axes and text; transparency needs testing against every intended surface. Inspect actual alpha values or vector background coverage, since viewers may hide transparency by compositing onto white.

Captions should identify what is shown, explain visual encodings and qualifications, and state the useful conclusion. Keep edit history in the project record.

## Check the rendered figure

- Inspect labels, symbols, legends, annotations, clipping, and whitespace at the final size.
- Confirm that every series and any validity boundary are visible.
- Check all exported formats and sizes after layout changes.
- Keep distributed previews current, or omit them if they are unnecessary.

Font coverage depends on the renderer and installed fonts. In particular, inspect Unicode subscripts and superscripts in GR/Plots.jl output and read missing-glyph warnings. Use a verified font, supported math rendering, or an unambiguous plain-text label when a glyph is unavailable.

For circuit schematics, see [circuit figures](circuit-figures.md).
