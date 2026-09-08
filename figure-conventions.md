# Figure conventions

Plotting rules for web reports, manuscripts, and slides.

**Use one script to build every shipped figure from committed data into one output directory.**
This keeps regeneration straightforward.
Paths such as `scripts/` and `results/` below are relative to the study directory.

## GR font traps

**Unicode subscript digits (U+2080-2089) are not in GR's default font and are dropped silently**, taking the digit out of the label with no warning.
Write the digit on the baseline instead.

What *does* render reliably: Greek, operators (`∝ √ × ±`) and **superscript two and three, but no higher** (`² ³`).
In Julia source these are written as `\uXXXX` escapes.

**The superscript rule stops at three.** `²` and `³` are Latin-1 (U+00B2, U+00B3) and present in the font; `⁴` upwards (U+2074+) sit in Superscripts-and-Subscripts alongside the subscript digits and are dropped the same way.
GR prints `glyph missing from current font: 8308` on stderr, but it is a warning, not an error: the figure is written with a hole in its label and the script exits 0.
Use the caret form.

Word subscripts have no Unicode form at all, so use an underscore as on a whiteboard.
That is normal on a plot axis.

**Do not reach for LaTeXStrings.**
GR's TeX subset would give real subscripts but is partial and fails unpredictably; Unicode plus underscores is the lower-risk choice.

## Theme

```julia
const INK  = "#52514e"   # axes and frame: recessive
const TEXT = "#0b0b0b"   # labels

default(fontfamily = "Helvetica", framestyle = :box,
        grid = true, gridalpha = 0.10, gridlinewidth = 0.6,      # recessive grid
        foreground_color = INK, foreground_color_text = TEXT,
        legend_foreground_color = :transparent, legend_background_color = :white,
        background_color = :white, background_color_inside = :white,   # never transparent
        markerstrokewidth = 0)
```

Recessive grid and axes; data is the darkest thing in the frame.
A legend is always present for two or more series (identity is never colour-alone), and text wears text colours — never a series colour.

## Never ship a figure with a transparent background

**Every figure gets an opaque white background.**
Transparent canvases can make dark axes and text disappear in dark-themed viewers.

Set both `background_color` and `background_color_inside` in Plots.jl.
For a `standalone` LaTeX figure, use the background rectangle in [`circuit-figures.md`](circuit-figures.md); `\pagecolor` interferes with cropping.

**Inspect the file's background, not just its appearance.**
Viewers often composite transparency onto white, hiding the problem:

```bash
# PNG: colour type 6 or 4 carries an alpha channel, 2 or 0 does not
python -c "import struct,sys; d=open(sys.argv[1],'rb').read(26); print('colourtype',d[25])" fig.png
# SVG: there must be a filled path or rect covering the viewBox
grep -o 'rgb(100%,100%,100%)' fig.svg | head -1
```

A PNG alpha channel is acceptable if all pixels are opaque.
An SVG needs a filled shape covering the whole viewBox; finding a white fill somewhere is only an initial check.
