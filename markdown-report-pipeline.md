# Markdown report pipeline

[`scripts/md_to_html.js`](scripts/md_to_html.js) builds a Markdown report into an HTML file with embedded CSS, local figure images, and pre-rendered MathML. Edit the Markdown source and rebuild the HTML.

## Run

Use Node.js with built-in `fetch` support (18 or later):

```sh
npm install
node scripts/md_to_html.js report.md
node scripts/md_to_html.js report.md /path/to/node_modules
```

The output is written beside the source as `report.html`. Image paths are relative to the Markdown file. Dependencies are resolved from the optional second argument, then by searching upward from the script; a host repository can install them at its root.

**Building requires network access and sends report text to GitHub's [Markdown API](https://docs.github.com/en/rest/markdown/markdown).** The builder makes one request in `markdown` mode. Authentication is optional: it checks `GITHUB_TOKEN`, `GH_TOKEN`, then `gh auth token`. Authenticated requests may have higher rate limits.

The output embeds the local `github-markdown-css` stylesheet and uses MathJax at build time. Supported figures and formulas need no runtime JavaScript or CDN. Viewing equations requires a browser with MathML support.

## Source conventions

| Source | Output |
|---|---|
| `$x$` | Inline MathML |
| `$$x$$` | Display MathML |
| `E_J`, `h^2` in prose | Subscript and superscript HTML |
| An image paragraph followed by an all-italic paragraph | Embedded image and figure caption |

Example:

```markdown
![Description of the plotted data](figures/result.svg)

*Measured response. Error bars show the stated uncertainty.*
```

Keep the caption in one paragraph. Use alt text to describe the image and the caption to explain its meaning. Supported local image formats are SVG, PNG, JPEG, and GIF; use standalone image paragraphs for embedding. Remote images and images embedded inside other structures are outside the supported embedding convention.

Prose scripts are a report convention: a single-letter base followed by an underscore can become a subscript. Put identifiers and paths in backticks; `snake_case` is preserved, but a bare `g_form` looks like a mathematical symbol. Prose tildes are escaped to preserve their literal meaning; use `<del>` if strikethrough is needed.

The preprocessor is a lightweight scanner, not a full Markdown parser. Check output for unusual code fences, escaped dollar signs, complex links, or raw HTML. The builder accepts inline TeX and HTML; any stricter authoring policy belongs to the host project.

## Unicode mathematics

[`scripts/tex_unicode.js`](scripts/tex_unicode.js) normalises Unicode inside math delimiters before MathJax compiles it:

- `SUP` and `SUB` turn Unicode scripts into TeX structure, such as `θ²` into `θ^2` and `10⁻⁶` into `10^{-6}`.
- `MACRO` maps symbols whose TeX form supplies the intended structure, spacing, or variant.
- `SAFE` allows symbols intended to pass through unchanged.
- Recognised text-style macro arguments are copied verbatim and excluded from the Unicode guard.

Unrecognised non-ASCII characters fail the build. Add a mapping when needed; extend `SAFE` only after comparing the character's MathML with its intended TeX equivalent. Import this module when checking formulas rather than duplicating its tables.

Retain TeX for structure and upright names, such as `\frac`, `\sin`, and `κ_{\mathrm{total}}`. Compare rendered MathML after notation changes: equal text content does not prove equal subscript structure.

## Validation and reproducibility

The builder checks recognised local image paths, unmapped Unicode, thrown math-conversion errors, remaining math placeholders, and tag balance. Success prints math, image, and table counts. These checks do not establish scientific correctness or cover every Markdown construct; inspect the resulting document.

Keep dependency versions and figure sources reproducible in the host project. The builder normalises text line endings and adds no timestamp, but output also depends on GitHub's renderer, so byte-identical results across service updates are not guaranteed.

When changing the builder, compare representative output and element counts. Keep parsing contracts and implementation-specific reasons in the scripts; keep authoring guidance here.
