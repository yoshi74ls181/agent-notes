# Markdown-authored reports, self-contained HTML output

Write the report in markdown. One build step turns it into a single self-contained HTML file
that looks like a GitHub README.

```
npm install --prefix <toolkit root>      # once: mathjax-full, github-markdown-css
node scripts/md_to_html.js <report.md>
```

Run the builder from wherever the markdown is; figure paths are resolved relative to the
markdown file.

`report.md` is the **authored source**. `report.html` is generated and will be overwritten, so
never edit it. This note covers the toolchain, not what belongs in a report.

## GitHub converts the markdown; GitHub's stylesheet styles it

The prose goes to GitHub's [`POST /markdown`](https://docs.github.com/en/rest/markdown)
endpoint, so the HTML is exactly what GitHub would render, and
[`github-markdown-css`](https://github.com/sindresorhus/github-markdown-css) — the stylesheet
GitHub's own rendered markdown uses — is inlined over it inside an
`<article class="markdown-body">`. The result reads like a README, in light or dark according
to the reader's system setting.

**THE BUILD NEEDS THE NETWORK.** One request per report. A token in `$GITHUB_TOKEN` or
`$GH_TOKEN`, or one the builder gets from `gh auth token`, raises the rate limit from 60
requests an hour to 5000; the build works without one. **The report's full text is sent to
GitHub** — which for a repository already hosted there is not a new party, but it is worth
knowing before building a report that lives somewhere else.

### `mode=markdown`, not `mode=gfm`

Three reasons, and each of them bit:

* `gfm` autolinks `#123` as an issue and `@name` as a user. It rewrote `@someone` into a
  hovercard link to a real GitHub profile, **capitalisation and all**.
* `gfm` wraps every table in a `<markdown-accessiblity-table>` custom element, which is inert
  in a standalone file.
* `gfm` stamps each formula with a `data-run-id` that is **random per request**, so the same
  markdown would build to a different file every time and every rebuild would show all the
  committed artifacts as modified.

`markdown` mode has none of that and still renders tables.

## What the endpoint cannot do, and so what the builder still does

1. **MATHS.** The endpoint does not render it. In `gfm` mode it returns an inert
   `<math-renderer>` custom element wrapping the raw TeX, which needs GitHub's own client-side
   JavaScript; in `markdown` mode it returns the `$$...$$` as literal text. Either way a
   standalone file would show raw TeX. So every formula is pulled out **before** the request,
   rendered to MathML locally by MathJax, and spliced back over an opaque placeholder
   afterwards. The placeholder is bare uppercase ASCII so that neither the markdown renderer
   nor the HTML sanitiser can touch it, and the build fails if one survives into the output.
2. **The Unicode-maths guard**, below.
3. **Prose subscripts and superscripts.** `E_J` and `h^2` in running prose become `<sub>` and
   `<sup>`. These *do* survive the endpoint, which passes inline HTML through.
4. **Figures.** `<figure>` and `<figcaption>` are **stripped by the endpoint's sanitiser**, so
   the house form cannot be assembled before the request. It is assembled afterwards out of
   the two paragraphs the endpoint returns. The endpoint also wraps every image in a link to
   its own path, which in a mailed single file points at a file the reader does not have, so
   the link is dropped and the image kept.
5. **The self-contained file.** The endpoint returns a *fragment* with the figure paths
   untouched, so the document, the inlined stylesheet and the base64 figures are assembled
   here.

## Why the HTML is one file

The HTML has to be movable and mailable: no CDN, no JavaScript, no web fonts. So the builder

* inlines every figure as a base64 `data:` URI,
* pre-renders every formula to **MathML**, by MathJax's TeX input processor feeding its MathML
  serialiser, and
* inlines the stylesheet.

Nothing of MathJax reaches the output, and neither does anything of GitHub's front end. The
file carries plain MathML, which is native in current Chrome, Firefox and Safari, so it
typesets with no script and no web font.

Two MathJax specifics that are not obvious from its documentation:

* the `bussproofs` TeX package throws `requires an output jax with a getBBox() method` as soon
  as it loads, because there is no output jax here — only the MathML serialiser. The builder
  loads every package except that one.
* the serialiser writes every non-ASCII character as a numeric reference, `&#x3B8;`. That
  renders correctly but triples the size of a Greek-heavy equation and makes the generated file
  undiffable, so the builder folds references above ASCII back to the characters themselves.

**The build is deterministic**, and worth keeping so: the same markdown gives a byte-identical
file, which is what makes a committed artifact reviewable. Text files are normalised to LF
before they are inlined — SVG figures especially, because base64 of CRLF is not base64 of LF
and the output would otherwise depend on the checkout rather than on its sources. A host
repository should also pin the artifacts themselves:

```
*/figs/*.svg    text eol=lf
*-report.html   text eol=lf
```

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
them alone. Every member of that set was admitted by rendering the character and its macro
under MathJax and comparing the MathML, which is evidence about MathJax specifically — so it
holds only as long as MathJax is the renderer.

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
rules. The builder supports more than that policy allows — it renders `$...$` and passes inline
HTML through. Prefer the policy.

## Markdown conventions the builder understands

Whatever GitHub understands, plus two house conventions:

| write this | get that |
|---|---|
| `$$x$$` | a display equation, as MathML. Inline `$x$` also works, but prefer Unicode |
| `![alt](fig.png)` alone, then an all-italic paragraph | a `<figure>` with the figure inlined and that paragraph as its `<figcaption>`. The alt text stays an accessibility description and is *not* used as the caption |

An underscore after a **single** letter is set as a subscript, and a caret as a superscript, so
`E_J` and `h^2` need no markup. `snake_case` in filenames and identifiers is left alone, and so
is anything in backticks — which is where a single-letter code name has to go, since bare
`g_form` in prose is indistinguishable from a subscript.

Everything else is GitHub's markdown: headings, lists, tables, code fences, block quotes,
horizontal rules, emphasis.

## Validation is part of the build, not a separate script

There is no verify step to forget. `md_to_html.js` fails the build rather than emitting a
broken report if

* the generated HTML has unbalanced or crossed tags,
* a figure path does not resolve to a real file,
* any formula fails to compile,
* a formula placeholder survives into the output, meaning GitHub rewrote or removed it and the
  maths could not be spliced back, or
* a formula contains a Unicode character `scripts/tex_unicode.js` does not know how to hand to
  MathJax — the one failure in this list that would otherwise be silent, since the formula
  compiles and merely renders wrongly.

It prints the element counts on success — math, display math, figures, tables — so a silent
regression shows up as a number that moved. Compare against the previous build when changing
the builder: the counts should not drift for an unchanged document.

## Traps

**Do not hand-edit the generated HTML.** It is regenerated from the markdown; edits are lost.
The generated file says so both in a comment and on its face.

**A single `~` is STRIKETHROUGH to GitHub.** Physics prose uses it for "of order", and two of
them in one paragraph — `J₃~δf³/48 against J₁~δf/2` — came back as
`J₃<del>δf³/48 against J₁</del>δf/2`. That is a corruption of the text and not a formatting
difference, and nothing in the output announces it. The builder escapes every prose tilde, so
the character survives; anything that really wants strikethrough has to write `<del>`.

**The figure paths in the markdown are relative to the markdown file.**

**A figure caption is the italic paragraph after the image**, and the builder tells it from an
ordinary paragraph by its *closing* delimiter: a caption ends with a lone `*`, whereas a
paragraph that merely happens to end bold ends with `**`. Testing the opening delimiter does not
work, because a caption with a bold lead-in opens with `***`.

**A caption broken across a blank line is not a caption.** Each half is then an incomplete
emphasis run, so neither is recognised, the image loses its `<figure>` and a literal `*` reaches
the reader. Keep a caption in one paragraph.

**Formulas are pulled out before any markdown rule runs.** Otherwise `$L_J$` gets eaten at the
underscore. If a formula renders as mangled prose, that ordering is the first thing to check.

## Vendoring this toolkit

The pipeline is `scripts/md_to_html.js`, `scripts/tex_unicode.js` and this note. To use it from
another repository, add this repository as a submodule and run the builder by path.

```bash
git submodule add <this repo> <dir>
npm install --prefix <dir>
node <dir>/scripts/md_to_html.js report.md
```

An `npm install` at the host repository's root works too, since the builder searches upward for
`node_modules`. Pin the host repository's SVG line endings as above.
