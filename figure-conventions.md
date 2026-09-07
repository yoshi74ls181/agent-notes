# Figure conventions

The rules for every plot, and the traps in the toolchain. They apply to whatever the figures are
built for — a web report, a journal manuscript, a slide — which is why this note sits apart from
any one pipeline document.

**What is portable and what is not.** The colour rules and the honesty rules are
toolkit-independent: they hold equally in Plots.jl, matplotlib or D3. The GR font traps and the
Plots.jl snippets are Julia-specific and can be skipped if that is not the stack. The palettes
are validated values meant to be copied as they stand.

**The convention these assume**, and it is worth adopting even where none of the rest is: one
script builds every figure a study ships, from committed data files, and writes them to one
directory. Then a figure can always be regenerated, and a figure nobody can regenerate is a
figure nobody can correct. Paths below of the form `scripts/` and `results/` are relative to a
study's own directory.

---

## Choose the colour encoding from the data's job

**Ordered magnitudes get a single-hue ordinal ramp, light to dark.** A family of increasing
values is *ordered*, so a rainbow or a categorical palette misleads by implying the series are
unrelated categories.

```julia
const ORDINAL5 = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"]
```

Only one such context per panel. Two ordered families in one figure go in **separate panels**
rather than getting two hues.

**Identities get categorical hues in a fixed order.** Distinct entities are not a progression:

```julia
const CAT3 = ["#2a78d6", "#eb6834", "#1baf7a"]   # blue, orange, aqua
```

Assign slots in fixed order and never cycle. Colour follows the entity: if a filter drops a
series, the survivors keep their colours.

**Theory and reference curves are recessive dashed grey (`#9a9992`), never a series colour.** A
reference line also says in its legend what it is and that it is not a fit, and a closed form
quoted in the text says what it predicts *before* the measurement is given.

**One y-axis per panel.** Never a dual-axis chart. Two measures of different scale go in two
panels.

## Validate the palette, do not eyeball it

Colour-blind safety and contrast are computable, so compute them. The gates:

- **ordinal ramp**: monotone lightness, adjacent lightness gap >= 0.06, light end clears the
  surface at >= 2:1. When a ramp will not hold the number of series you have, cut a series or
  facet; do not squeeze the steps.
- **categorical set**: worst-pair CVD deltaE >= 8 (deutan and tritan) and normal-vision deltaE
  >= 15, evaluated over *all* pairs for scatter/marker charts. The `CAT3` above passes at CVD 9.2
  and normal-vision 24.0.

**A series dropped to fit the ramp is named in the caption.** A dropped curve that is not
mentioned reads as "we covered everything".

## Make both series visible

When two series coincide — often because the coincidence is the result — one is simply invisible
drawn as a second line. Draw the first as a line and the second as sparse markers (every 6th
point, white-outlined):

```julia
plot!(p, x1, y1; color = CAT3[1], linewidth = 2.5, label = "...")
scatter!(p, x2[1:6:end], y2[1:6:end]; color = CAT3[2], markersize = 4,
         markerstrokecolor = :white, markerstrokewidth = 1.0, label = "...")
```

**Say in the caption why the second series is drawn as markers**, or a reader who can see the two
traces apart will read the marker style as meaning something about the data. Where they separate
in one region and coincide in another, say which.

## Mark data you do not trust, rather than dropping it

Never drop a point that failed a validity check — in tables, parenthesise the number and give the
honest alternative alongside; in a figure, mark it as below.

Where a point fails a validity check, deleting it reads as "the curve ends here" and plotting it
normally asserts a value you do not have. Draw it as an **open, unconnected marker** in the series
hue (white fill, coloured stroke), stop the line at the last trustworthy point, and add a dotted
boundary and an annotation naming the reason:

```julia
ok = spread .<= 0.5                    # e.g. a branch-spread validity test, from the data file
plot!(p, P[ok], et[ok]; color = CAT3[2], marker = :diamond, label = "...")
scatter!(p, P[.!ok], et[.!ok]; color = :white, markershape = :diamond,
         markerstrokecolor = CAT3[2], markerstrokewidth = 1.6, label = "")
```

**Derive the validity test from the data, not from a threshold on the knob.** A fixed cutoff on
the independent variable — "everything below this drive is unresolved" — is a guess that ages
badly, and it will mark good points as noise. Test the quantity that actually goes flat or
degenerate: a leading run where the output-to-input ratio has collapsed, say. A note recording
this trap in one repository also recorded that a script and its own plotting code disagreed for
months about which points were floored, because one used the fixed threshold and the other the
measured one.

**Plot a family at a matched independent variable, not at each member's own optimum.** Where each
member's sweep stops at a different point, plotting each member's best value against the knob mixes
the knob's effect with how far each member could be pushed, and inflates the apparent lever.
Whenever the stopping point of a sweep is itself data-dependent, say what it was and hold it fixed
if you can.

**Say in the caption when a dashed grey reference curve is a prediction rather than a fit.** A
fitted curve and a predicted curve look identical on the page and mean opposite things; where a
prediction stops tracking the data, that gap is the finding, and it is legible only if the reader
knows it was never fitted.

## Two output sizes from one script

A figure for a web report and the same figure for print are not one figure at two zoom levels, so
build both from one script switched by an environment variable:

```julia
const STYLE  = get(ENV, "FIGSTYLE", "report")           # "report" | "manuscript"
const FSCALE = STYLE == "manuscript" ? 1.55 : 1.0       # font scale
const SSCALE = STYLE == "manuscript" ? 1.15 : 1.0       # canvas scale
```

Fonts grow faster than the canvas, so text is ~35% larger *relative* to the plot; DPI goes to
300; and panel titles are stripped to the leading `(a)`/`(b)`, since in journal style the caption
carries the description. Scale the canvas as well as the fonts, or the axis labels clip.

```bash
julia --project=. scripts/NN_plots.jl                      # -> results/figures/
FIGSTYLE=manuscript julia --project=. scripts/NN_plots.jl  # -> results/figures/manuscript/
```

**A single-panel figure needs its own title path.** A helper that keeps a leading `(a)` at print
size and truncates everything else is right for a faceted figure and silently wrong for a lone
panel — one shipped for several commits with a title reading `the`. Return an empty title when
there is no panel letter and let the caption carry the description.

## GR font traps

**Unicode subscript digits (U+2080-2089) are not in GR's default font and are dropped
silently**, taking the digit out of the label with no warning. Write the digit on the baseline
instead.

What *does* render reliably: Greek, operators (`∝ √ × ±`) and **superscript two and three, but no
higher** (`² ³`). In Julia source these are written as `\uXXXX` escapes.

**The superscript rule stops at three.** `²` and `³` are Latin-1 (U+00B2, U+00B3) and present in
the font; `⁴` upwards (U+2074+) sit in Superscripts-and-Subscripts alongside the subscript digits
and are dropped the same way. GR prints `glyph missing from current font: 8308` on stderr, but it
is a warning, not an error: the figure is written with a hole in its label and the script exits 0.
Use the caret form.

Word subscripts have no Unicode form at all, so use an underscore as on a whiteboard. That is
normal on a plot axis.

**Do not reach for LaTeXStrings.** GR's TeX subset would give real subscripts but is partial and
fails unpredictably; Unicode plus underscores is the lower-risk choice.

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

Recessive grid and axes; data is the darkest thing in the frame. A legend is always present for
two or more series (identity is never colour-alone), and text wears text colours — never a series
colour.

## Never ship a figure with a transparent background

**Every figure gets an opaque background, and it is white.** A transparent one takes the
background of whatever displays it, and half the things that display these are dark-themed — a
browser or viewer in dark mode, a chat message, a report someone reads at night. Dark axes, black
strokes and near-black text then sit on a dark background and the figure ranges from
low-contrast to invisible. The figure has no way to know, and nothing in a build warns.

**It is not the default in either toolchain covered here.** Plots.jl honours a theme, so put it
there — `background_color` *and* `background_color_inside`, since the outer canvas and the plot
area are separate keys. A `standalone` LaTeX figure has a transparent page, and so does every PDF
that comes out of it and every SVG converted from that PDF; the fix for that one is in
[`circuit-figures.md`](circuit-figures.md), and it is **not** `\pagecolor`.

**Checking it needs the right test, because a viewer will lie to you.** Almost every image viewer
composites transparency onto its own white canvas, so a transparent figure looks correct in the
one place you are most likely to look. Test the file, not the picture:

```bash
# PNG: colour type 6 or 4 carries an alpha channel, 2 or 0 does not
python -c "import struct,sys; d=open(sys.argv[1],'rb').read(26); print('colourtype',d[25])" fig.png
# SVG: there must be a filled path or rect covering the viewBox
grep -o 'rgb(100%,100%,100%)' fig.svg | head -1
```

Alpha in a PNG is not by itself a fault if every pixel is opaque, but it is the thing to look at
first. For an SVG the question is whether a background rectangle exists at all — a converted PDF
has none unless the source asked for one.

## Look at every figure before shipping — in both sizes

The validator checks colour, not layout. Rendering and inspecting is what catches a legend sitting
on the data, an annotation overlapping a legend, tick labels left in `10^-1.8` form where explicit
ticks were wanted (`xticks = (vals, labels)`), and silently dropped subscripts. None of these is
visible in the code.

**Check the print-sized render too.** Because text is larger *relative* to the canvas at print
size, anything placed in data coordinates can fit in one size and overflow in the other. Anchor an
in-panel annotation on the side of its reference line that keeps it inside the panel at both
scales, and scale its font with `FSCALE`:

```julia
annotate!(p, xb - 0.6, ylo + 4, text("multivalued →", round(Int, 7 * FSCALE), INK, :right))
```

**A figure whose result is a length needs an equal aspect ratio and one shared box.** Where the
finding is the distance between two points — a separation in a complex plane, say — autoscaling
each panel makes two such distances incomparable while the caption invites the comparison, and
symmetric limits about the origin can waste half the panel. Compute one box over every series,
widen it to include whatever the distance is measured from, and square it up so the equal aspect
is exact.

**Draw the comparison you are asserting.** A claim stated as holding across a family can hold
over a wide range for one member and a narrow one for another, with no individual number wrong.
The figure shows that overreach at a glance; the numbers do not.

**Check a quantified comment against the data like any other claim.** A comment justifying a
layout choice — why the aspect ratio is equal, why a limit is where it is — can carry a number,
and a wrong number there survives precisely because nothing computed depends on it. One claimed a
20× ratio between two panels where the truth was 2.04×.

`groupedbar` lives in StatsPlots, not Plots — dodged bars by hand are two `bar` calls with
`bar_width = 0.34` at `x ± 0.19`, with a white outline giving the 2 px gap between the pair.
