# Markdown-authored reports, self-contained HTML output

Write the report in markdown. One build step turns it into a single self-contained HTML file.

```
npm install --prefix <toolkit root>      # once: pulls mathjax-full
node scripts/md_to_html.js <report.md>
```

The builder looks for `mathjax-full` beside itself and then upward, so an install at the
toolkit root works, and so does one at the root of a repository that vendors the toolkit. If it
lives somewhere else, give the `node_modules` directory as a second argument.

Run the builder from wherever the markdown is; figure paths are resolved relative to the
markdown file.

`report.md` is the **authored source**. `report.html` is generated and will be overwritten, so
never edit it. This note covers the toolchain, not what belongs in a report.

## Why the HTML is one file

The HTML has to be movable and mailable: no CDN, no JavaScript, no web fonts. So the builder

* inlines every figure as a base64 `data:` URI, and
* pre-renders every formula to **MathML**, by MathJax's TeX input processor feeding its MathML
  serialiser.

Nothing of MathJax reaches the output. The file carries plain MathML, which is native in
current Chrome, Firefox and Safari, so it typesets with no script and no web font.
`mathjax-full` is the only dependency and only at build time.

Two MathJax specifics that are not obvious from its documentation:

* the `bussproofs` TeX package throws `requires an output jax with a getBBox() method` as soon
  as it loads, because there is no output jax here — only the MathML serialiser. The builder
  loads every package except that one.
* the serialiser writes every non-ASCII character as a numeric reference, `&#x3B8;`. That
  renders correctly but triples the size of a Greek-heavy equation and makes the generated file
  undiffable, so the builder folds references above ASCII back to the characters themselves.

## Unicode in, MathJax out: the conversion, the guard and the check

The source is written in Unicode because the markdown has to read in a plain viewer. That is a
content rule; what follows is the machinery that makes it safe, which an author does not have to
remember because the build enforces it.

**The renderer does not have to understand any of it.** MathJax reads a Unicode character as a
*glyph* and never as an instruction, so handed `θ²` it would set the two on the baseline as an
operator instead of raising the theta. Not every engine behaves this way — KaTeX reads such a
character as an instruction — so a source written for one engine is mis-set by the other,
silently. The build does not ask you to care: `scripts/tex_unicode.js` converts every character
in the table below back to its macro before MathJax sees it.

| written in the source | reaches MathJax as | why the conversion is needed |
|---|---|---|
| `θ²`, `ω₀`, `10⁻⁶`, `φ₁⁴` | `θ^2`, `ω_0`, `10^{-6}`, `φ_1^4` | a script is structure; the character is a baseline glyph |
| `½`, `¼`, `⅓` | `\tfrac12` … | an `<mo>` glyph, not a stacked fraction |
| `Λ`, `Δ`, `Σ`, `Ω` … | `\Lambda` … | a one-character `<mi>` is *italic* in MathML; the macro carries `mathvariant="normal"` |
| `∂`, `×`, `·`, `∞` | `\partial`, `\times` … | right glyph, wrong class, so the spacing goes — bare `×` is even parsed as an identifier |
| `′` | `'` | a prime is a superscript; the character is not |
| `⟺`, `⟹`, `→`, `←` | `\iff`, `\implies`, `\to`, `\leftarrow` | spacing, and one attribute |
| `∑`, `∫`, `∏` | `\sum` … | the character attaches its limits differently |
| `⟨`, `⟩`, `⌈`, `⌉` | `\langle` … | not stretchy, and the wrong class |
| `∇`, `∀`, `∃`, `∅`, `ℏ` | `\nabla` … | assorted class and variant differences |

Lowercase Greek, relations (`≈ ≤ ≥ ≠ ∝ ≡ ≃ ∼ ≪ ≫ ∈`), `↔ ⇒ ⇐ ↦`, `−`, `⋯`, `±`, `√`, `ℓ`, `⊗`
and `†` need no conversion: their markup is identical to their macros', so the module leaves
them alone.

**You do not have to remember any of this, because the build checks it.** A character in none of
the three sets — the scripts, the mapped ones, the measured-identical ones — reaches MathJax raw
and is set as a glyph, and *nothing in the output says so*: a mis-set superscript still looks
roughly like a superscript. So `md_to_html.js` refuses to build, naming the character and its
code point:

```
unmapped Unicode in: ℵ_0 = θ² + a⊥b
  ℵ  U+2135  -- not in SUP, SUB, MACRO or SAFE
  ⊥  U+22A5  -- not in SUP, SUB, MACRO or SAFE
```

The fix is to add it to `scripts/tex_unicode.js`: to `MACRO` if a macro is meant, or to `SAFE`
**only** after rendering the character and the macro and finding the MathML identical. Do not
add to `SAFE` by inspection — a difference of one attribute with no visible effect is still a
difference, and mapping the character costs nothing.

**Two things are dropped as a deliberate trade**, accepting a small change in the typesetting
to get a plainly readable source:

| dropped | costs |
|---|---|
| `\big(` → `(` | delimiters revert to their natural size |
| `\!` → nothing | a negative thin space of kerning |

At display size those differences are barely visible.

**Comparing a rewrite is a markup comparison, not a text one.** `κ_{\mathrm{tot}}` and `κ_tot`
have identical text content and different markup, because the second subscripts only the first
letter and drops the rest onto the baseline. Anything that checks a rewrite left the maths alone
has to compare the MathML, render it under the engine that will build the document, and
normalise through `scripts/tex_unicode.js` rather than reimplementing the tables.

## The source form is a policy, not a build setting

Markdown that carries **no raw HTML and no inline LaTeX** reads in any viewer. That is a rule
about what you write rather than about the toolchain, so it belongs with your project's content
rules. The builder supports more than that policy allows — it will render `$...$` and pass raw
HTML through, including `$...$` inside it — because an unavoidable layout should not be
impossible. Prefer the policy.

## Markdown conventions the builder understands

Ordinary markdown, plus a few conventions that produce the report furniture:

| write this | get that |
|---|---|
| `$$x$$` | a display equation, as MathML. Inline `$x$` also works, but prefer Unicode |
| `![alt](fig.png)` alone in a paragraph | a `<figure>` with the figure inlined |
| an all-italic paragraph straight after an image | its `<figcaption>` |
| `> **Note.** ...` | a recessive callout |
| `> ### Heading` then prose | the prominent verdict box |
| `\| a \| b \|` | a table; cells that look numeric get tabular figures and right-align |
| an italic paragraph right after the `#` title | the standfirst |
| `---` | a horizontal rule |

An underscore after a **single** letter is set as a subscript, and a caret as a superscript, so
`E_J` and `h^2` need no markup. `snake_case` in filenames and identifiers is left alone, and so
is anything in backticks — which is where a single-letter code name has to go, since bare
`g_form` in prose is indistinguishable from a subscript.

Raw HTML *is* passed through, and `$...$` inside it is still rendered, so an unavoidable layout
can fall back to it. That is a capability, not a licence.

Styling lives in `scripts/report.css` beside the builder and is inlined into the output, so
restyling every report is a one-file change. A document that needs different styling can put its
own `scripts/report.css` next to its markdown and that wins.

## Validation is part of the build, not a separate script

There is no verify step to forget. `md_to_html.js` fails the build rather than emitting a
broken report if

* the generated HTML has unbalanced or crossed tags,
* a figure path does not resolve to a real file,
* any formula fails to compile, or
* a formula contains a Unicode character `scripts/tex_unicode.js` does not know how to hand to
  MathJax — the one failure in this list that would otherwise be silent, since the formula
  compiles and merely renders wrongly.

It prints the element counts on success — math, display math, figures, tables — so a silent
regression in the parser shows up as a number that moved. Compare against the previous build
when changing the builder: the counts should not drift for an unchanged document.

## Traps

**Do not hand-edit the generated HTML.** It is regenerated from the markdown; edits are lost.
The generated file says so both in a comment and on its face.

**The figure paths in the markdown are relative to the markdown file**, and they stay as
`data-src` attributes in the output alongside the base64 payload, so a later build can find the
original again.

**Inline math is split out before any markdown rule runs.** Otherwise `$L_J$` gets eaten by the
emphasis rule at the underscore. If a formula renders as mangled prose, that ordering is the
first thing to check.

**A figure caption is the italic paragraph after the image**, and the builder tells it from an
ordinary paragraph by its *closing* delimiter: a caption ends with a lone `*`, whereas a
paragraph that merely happens to end bold ends with `**`. Testing the opening delimiter does not
work, because a caption with a bold lead-in opens with `***`.

**Text files are normalised to LF before they are inlined**, both the stylesheet and any SVG
figure, because base64 of CRLF is not base64 of LF and the output would otherwise depend on the
checkout rather than on its sources.

## Vendoring this toolkit

The pipeline is self-contained: `scripts/md_to_html.js`, `scripts/tex_unicode.js`,
`scripts/report.css` and this note. To use it from another repository, add this repository as a
submodule and run the builder by path.

```bash
git submodule add <this repo> <dir>
npm install --prefix <dir>
node <dir>/scripts/md_to_html.js report.md
```

An `npm install` at the host repository's root works too, since the builder searches upward for
`node_modules`.
