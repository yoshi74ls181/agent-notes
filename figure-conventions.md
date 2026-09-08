# Figure conventions

Plotting rules for web reports, manuscripts, and slides.

Colour and data-validity rules are toolkit-independent.
The Plots.jl examples and GR font notes are Julia-specific; skip those if using another stack.
Copy the validated palettes as given.

**Use one script to build every shipped figure from committed data into one output directory.**
This keeps regeneration straightforward.
Paths such as `scripts/` and `results/` below are relative to the study directory.

---

## Choose the colour encoding from the data's job

**Ordered magnitudes get a single-hue ordinal ramp, light to dark.**
A family of increasing values is *ordered*, so a rainbow or a categorical palette misleads by implying the series are unrelated categories.

```julia
const ORDINAL5 = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"]
```

Only one such context per panel.
Two ordered families in one figure go in **separate panels** rather than getting two hues.

**Identities get categorical hues in a fixed order.**
Distinct entities are not a progression:

```julia
const CAT3 = ["#2a78d6", "#eb6834", "#1baf7a"]   # blue, orange, aqua
```

Assign slots in fixed order and never cycle.
Colour follows the entity: if a filter drops a series, the survivors keep their colours.

**Theory and reference curves are recessive dashed grey (`#9a9992`), never a series colour.**
A reference line also says in its legend what it is and that it is not a fit, and a closed form quoted in the text says what it predicts *before* the measurement is given.

**One y-axis per panel.**
Never a dual-axis chart.
Two measures of different scale go in two panels.

## Validate the palette, do not eyeball it

Colour-blind safety and contrast are computable, so compute them.
The gates:

- **ordinal ramp**: monotone lightness, adjacent lightness gap >= 0.06, light end clears the surface at >= 2:1.
  When a ramp will not hold the number of series you have, cut a series or facet; do not squeeze the steps.
- **categorical set**: worst-pair CVD deltaE >= 8 (deutan and tritan) and normal-vision deltaE >= 15, evaluated over *all* pairs for scatter/marker charts.
  The `CAT3` above passes at CVD 9.2 and normal-vision 24.0.

**A series dropped to fit the ramp is named in the caption.**
A dropped curve that is not mentioned reads as "we covered everything".

## Make both series visible

For coincident series, draw one as a line and the other as sparse, white-outlined markers (every sixth point in this example):

```julia
plot!(p, x1, y1; color = CAT3[1], linewidth = 2.5, label = "...")
scatter!(p, x2[1:6:end], y2[1:6:end]; color = CAT3[2], markersize = 4,
         markerstrokecolor = :white, markerstrokewidth = 1.0, label = "...")
```

**Explain the marker choice in the caption**, including where the series coincide or separate.

## Mark data you do not trust, rather than dropping it

Never drop a point that failed a validity check — in tables, parenthesise the number and give the honest alternative alongside; in a figure, mark it as below.

Where a point fails a validity check, deleting it reads as "the curve ends here" and plotting it normally asserts a value you do not have.
Draw it as an **open, unconnected marker** in the series hue (white fill, coloured stroke), stop the line at the last trustworthy point, and add a dotted boundary and an annotation naming the reason:

```julia
ok = spread .<= 0.5                    # e.g. a branch-spread validity test, from the data file
plot!(p, P[ok], et[ok]; color = CAT3[2], marker = :diamond, label = "...")
scatter!(p, P[.!ok], et[.!ok]; color = :white, markershape = :diamond,
         markerstrokecolor = CAT3[2], markerstrokewidth = 1.6, label = "")
```

**Derive validity from the data, not a cutoff on the independent variable.**
Test the measured quantity that becomes unresolved or degenerate, and use the same test in the analysis and plot.

**Compare a family at a matched independent variable, not at each member's optimum.**
Otherwise the comparison mixes the parameter's effect with different sweep endpoints.
State data-dependent stopping conditions and hold them fixed where possible.

**Label a reference curve as a prediction or a fit.**
A prediction's disagreement with data is interpretable only when the reader knows it was not fitted.

## Two output sizes from one script

A figure for a web report and the same figure for print are not one figure at two zoom levels, so build both from one script switched by an environment variable:

```julia
const STYLE  = get(ENV, "FIGSTYLE", "report")           # "report" | "manuscript"
const FSCALE = STYLE == "manuscript" ? 1.55 : 1.0       # font scale
const SSCALE = STYLE == "manuscript" ? 1.15 : 1.0       # canvas scale
```

Fonts grow faster than the canvas, so text is ~35% larger *relative* to the plot; DPI goes to 300; and panel titles are stripped to the leading `(a)`/`(b)`, since in journal style the caption carries the description.
Scale the canvas as well as the fonts, or the axis labels clip.

```bash
julia --project=. scripts/NN_plots.jl                      # -> results/figures/
FIGSTYLE=manuscript julia --project=. scripts/NN_plots.jl  # -> results/figures/manuscript/
```

**Handle single-panel titles separately.**
In print mode, retain a leading `(a)` or `(b)` only when present; otherwise return an empty title and leave the description to the caption.

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

## A panel's own definitions agree with its axis label and its caption

A plotted derivative says whether it is signed or an absolute value.
A curve drawn from the magnitude of a logarithmic derivative, under a caption calling it "the logarithmic derivative", is a sign the reader has to guess at, and the guess is wrong.

Where curves of different quantities share an axis, the axis label must not hand one quantity's normalisation to all of them.
Say in the caption which curves it applies to and which it does not, or label the axis for what the panel actually shares.

A caption names every marked point on the panel.
An annotated operating point the caption never mentions leaves the reader with an unexplained vertical line and a number, and no way to tell whether that number should match the tables — on one figure it did not match, because the panel and the table referred the same ratio to two different frequencies.

## Look at every figure before shipping — in both sizes

Inspect renders for obscured data, overlapping legends and annotations, missing subscripts, and unintended tick formatting.
Use `xticks = (vals, labels)` where explicit ticks are needed.

**Check the print-sized render too.**
Because text is larger *relative* to the canvas at print size, anything placed in data coordinates can fit in one size and overflow in the other.
Anchor an in-panel annotation on the side of its reference line that keeps it inside the panel at both scales, and scale its font with `FSCALE`:

```julia
annotate!(p, xb - 0.6, ylo + 4, text("multivalued →", round(Int, 7 * FSCALE), INK, :right))
```

**Distance comparisons need an equal aspect ratio and shared limits.**
Compute one bounding box across the compared series, include the reference points, and square it up.
Independent panel autoscaling makes distances incomparable; symmetry about the origin may waste space.

**Draw the comparison the claim makes.**
A claim across a family needs to show the relevant range for each member.

**Check numbers in comments against the data too.**
Layout justifications can contain stale ratios or limits even when the executable calculation is correct.

`groupedbar` lives in StatsPlots, not Plots — dodged bars by hand are two `bar` calls with `bar_width = 0.34` at `x ± 0.19`, with a white outline giving the 2 px gap between the pair.
