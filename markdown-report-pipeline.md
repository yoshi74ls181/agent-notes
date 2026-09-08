# Markdown-authored reports, self-contained HTML output

Write the report in markdown.
One build step turns it into a single self-contained HTML file that looks like a GitHub README.

```
npm install --prefix <toolkit root>      # once: mathjax-full, github-markdown-css
node scripts/md_to_html.js <report.md>
```

Run the builder from wherever the markdown is; figure paths are resolved relative to the markdown file.

`report.md` is the **authored source**. `report.html` is generated and will be overwritten, so never edit it.
This note covers the toolchain, not what belongs in a report.

## GitHub converts the markdown; GitHub's stylesheet styles it

GitHub's [`POST /markdown`](https://docs.github.com/en/rest/markdown) endpoint renders the prose.
The builder inlines [`github-markdown-css`](https://github.com/sindresorhus/github-markdown-css) inside an `<article class="markdown-body">`, with light or dark styling from the reader's system setting.

**The build needs the network and sends the report text to GitHub**, one request per report.
Authentication is optional: the builder checks `GITHUB_TOKEN`, `GH_TOKEN`, then `gh auth token`.
Authenticated requests generally have higher rate limits.

### `mode=markdown`, not `mode=gfm`

The builder uses `markdown` mode to avoid these `gfm` behaviors:

* Issue and user autolinks for `#123` and `@name`.
* Table wrappers using the `<markdown-accessiblity-table>` custom element.
* Random `data-run-id` attributes on formulas, which create unnecessary rebuild diffs.

`markdown` mode has none of that and still renders tables.

## What the endpoint cannot do, and so what the builder still does

1. **Maths:** extract formulas before Markdown parsing, render them locally to MathML, then restore them over ASCII placeholders.
   The API's raw TeX or inert `<math-renderer>` output would require client-side processing.
2. **Unicode:** normalise symbols and reject unmapped characters, as described below.
3. **Prose scripts:** convert `E_J` and `h^2` to inline `<sub>` and `<sup>` HTML.
4. **Figures:** reconstruct image paragraphs and italic captions as `<figure>` elements after sanitisation, which strips `<figure>` and `<figcaption>`.
   Remove links to the image's local path.
5. **Packaging:** assemble the document, embedded stylesheet, and base64 images.

## Why the HTML is one file

The HTML has to be movable and mailable: no CDN, no JavaScript, no web fonts.
So the builder

* inlines every figure as a base64 `data:` URI,
* pre-renders every formula to **MathML**, by MathJax's TeX input processor feeding its MathML serialiser, and
* inlines the stylesheet.

The output carries plain MathML, with no MathJax or GitHub front-end code.
Use a browser with native MathML support.

Two implementation details:

* Exclude `bussproofs`: it requires an output jax with `getBBox()`, while this build uses only the MathML serialiser.
* Decode non-ASCII numeric references such as `&#x3B8;` for smaller, readable output; preserve ASCII escapes.

**Keep rebuilds reproducible.**
Normalise text files to LF before embedding them, especially SVGs: base64 differs between LF and CRLF.
Pin dependencies in the host project and use these artifact line-ending rules.
Output also depends on GitHub's renderer, so service updates can change the generated HTML.

```
*/figs/*.svg    text eol=lf
*-report.html   text eol=lf
```

## Unicode in, MathJax out: the conversion, the guard and the check

Unicode keeps the source readable in a plain viewer.
The conversion layer translates notation that MathJax would otherwise treat as a glyph.

For example, Unicode superscripts need TeX structure to render correctly in MathJax. `scripts/tex_unicode.js` applies the following mappings before compilation; do not assume another renderer's Unicode behavior transfers to MathJax.

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

Lowercase Greek, relations (`≈ ≤ ≥ ≠ ∝ ≡ ≃ ∼ ≪ ≫ ∈`), `↔ ⇒ ⇐ ↦`, `−`, `⋯`, `±`, `√`, `ℓ`, `⊗` and `†` pass through.
Their MathML was compared with the corresponding macros under MathJax.
Recheck that equivalence if changing the renderer.

**The build rejects unknown Unicode**, reporting the character and code point.
Otherwise a formula could compile while rendering the character with the wrong structure:

```
unmapped Unicode in: ℵ_0 = θ² + a⊥b
  ℵ  U+2135  -- not in SUP, SUB, MACRO or SAFE
  ⊥  U+22A5  -- not in SUP, SUB, MACRO or SAFE
```

Add missing characters to `scripts/tex_unicode.js`: use `MACRO` for a TeX mapping, or `SAFE` only after rendering both forms and comparing their MathML, including attributes.

**Two things are dropped as a deliberate trade**, accepting a small change in the typesetting to get a plainly readable source:

| dropped | costs |
|---|---|
| `\big(` → `(` | delimiters revert to their natural size |
| `\!` → nothing | a negative thin space of kerning |

At display size those differences are barely visible.

**Compare markup, not text.** `κ_{\mathrm{tot}}` and `κ_tot` have the same text content but different subscript structure.
Validate rewrites with the build's MathJax renderer and `scripts/tex_unicode.js` rather than reimplementing the conversion tables.

## The source form is a policy, not a build setting

The no-HTML, no-inline-LaTeX rule belongs to [`report-editing-policy.md`](report-editing-policy.md).
The builder is deliberately more permissive: it accepts `$...$` and inline HTML.
Use the project's source checks to enforce the policy.

## Markdown conventions the builder understands

Whatever GitHub understands, plus two house conventions:

| write this | get that |
|---|---|
| `$$x$$` | a display equation, as MathML. Inline `$x$` also works, but prefer Unicode |
| `![alt](fig.png)` alone, then an all-italic paragraph | a `<figure>` with the figure inlined and that paragraph as its `<figcaption>`. The alt text stays an accessibility description and is *not* used as the caption |

An underscore after a **single** letter is set as a subscript, and a caret as a superscript, so `E_J` and `h^2` need no markup. `snake_case` in filenames and identifiers is left alone, and so is anything in backticks — which is where a single-letter code name has to go, since bare `g_form` in prose is indistinguishable from a subscript.

Everything else is GitHub's markdown: headings, lists, tables, code fences, block quotes, horizontal rules, emphasis.

## Validation is part of the build, not a separate script

There is no verify step to forget. `md_to_html.js` fails the build rather than emitting a broken report if

* the generated HTML has unbalanced or crossed tags,
* a figure path does not resolve to a real file,
* any formula fails to compile,
* a formula placeholder survives into the output, meaning GitHub rewrote or removed it and the maths could not be spliced back, or
* a formula contains a Unicode character `scripts/tex_unicode.js` does not know how to hand to MathJax — the one failure in this list that would otherwise be silent, since the formula compiles and merely renders wrongly.

On success, compare the math, display-math, figure, and table counts against the previous build.
For unchanged input, a count change needs explanation.

## Traps

**Prose tildes are literal.**
The builder escapes `~` to prevent accidental strikethrough.
Write `<del>` when strikethrough is intended.

**A figure caption is the italic paragraph after the image.**
Keep the whole caption italic: a bold lead-in opens with `***`, but the paragraph still closes with a lone `*`.

**Keep captions in one paragraph.**
A blank line splits the emphasis run, preventing caption recognition and leaving literal asterisks in the output.

**Formulas are pulled out before any markdown rule runs.**
Otherwise `$L_J$` gets eaten at the underscore.
If a formula renders as mangled prose, that ordering is the first thing to check.

## Vendoring this toolkit

The pipeline is `scripts/md_to_html.js`, `scripts/tex_unicode.js` and this note.
To use it from another repository, add this repository as a submodule and run the builder by path.

```bash
git submodule add <this repo> <dir>
npm install --prefix <dir>
node <dir>/scripts/md_to_html.js report.md
```

An `npm install` at the host repository's root works too, since the builder searches upward for `node_modules`.
Pin the host repository's SVG line endings as above.
