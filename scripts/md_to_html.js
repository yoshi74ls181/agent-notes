#!/usr/bin/env node
/*
 * Build a self-contained HTML report from a markdown source.
 *
 *     node scripts/md_to_html.js <report.md> [/path/to/node_modules]
 *
 * GITHUB CONVERTS THE MARKDOWN AND GITHUB'S OWN STYLESHEET STYLES IT.  The prose goes to
 * GitHub's `POST /markdown` endpoint, so the HTML is exactly what GitHub would render, and
 * `github-markdown-css` -- the stylesheet GitHub's own rendered markdown uses -- is inlined
 * over it inside an `<article class="markdown-body">`.  The result looks like a README.
 *
 * WHAT THE API CANNOT DO, and therefore what this file still does:
 *
 *   1. MATHS.  The endpoint does not render it.  In `gfm` mode it returns an inert
 *      `<math-renderer>` custom element wrapping the raw TeX, which needs GitHub's own
 *      client-side JavaScript; in `markdown` mode it returns the `$$...$$` as literal text.
 *      Either way a standalone file would show raw TeX.  So every formula is pulled out
 *      BEFORE the request, rendered to MathML locally by MathJax, and spliced back over an
 *      opaque placeholder afterwards.
 *   2. THE UNICODE-MATHS GUARD.  Reports are authored with Unicode maths -- `χ`, `κ_a`,
 *      `10⁻¹⁵` -- because `check_report_source.py` requires it and forbids inline LaTeX.
 *      `tex_unicode.js` rewrites that as the LaTeX MathJax needs and REFUSES a character it
 *      has no mapping for, rather than letting it through to be set as a glyph.
 *   3. PROSE SUBSCRIPTS AND SUPERSCRIPTS.  `E_J` and `h^2` in running prose become `<sub>`
 *      and `<sup>`.  A house convention, so no converter does it.  These DO survive the
 *      endpoint, which passes inline HTML through.
 *   4. FIGURES.  `<figure>` and `<figcaption>` are STRIPPED by the endpoint's sanitiser, so
 *      the house form -- an image alone, then an all-italic caption paragraph, with the alt
 *      text an accessibility description rather than the caption -- cannot be assembled
 *      before the request.  It is assembled afterwards, out of the two paragraphs the
 *      endpoint returns.
 *   5. THE SELF-CONTAINED FILE.  The endpoint returns a FRAGMENT with the figure paths
 *      untouched, so the document, the inlined stylesheet and the base64 figures are all
 *      assembled here.
 *
 * `mode=markdown`, NOT `mode=gfm`, and the difference matters.  `gfm` autolinks `#123` as an
 * issue and `@name` as a user -- it rewrote `@someone` to a hovercard link to a real GitHub
 * profile, capitalisation and all -- wraps every table in a `<markdown-accessiblity-table>`
 * custom element, and stamps each formula with a `data-run-id` that is RANDOM PER REQUEST, so
 * the build would not be reproducible.  `markdown` mode has none of that and still renders
 * tables.
 *
 * THE BUILD NEEDS THE NETWORK.  A token in `$GITHUB_TOKEN` or `$GH_TOKEN`, or one from
 * `gh auth token`, raises the rate limit from 60 requests an hour to 5000; the build works
 * without one.  One request per report.
 *
 * The markdown is the authored source.  The HTML is generated and is overwritten on every
 * build, so never edit it.
 *
 * The markdown conventions this recognises and the checks the build refuses to skip are
 * documented in markdown-report-pipeline.md.  What is commented below is only what the code
 * does that the note does not say.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');
const {normalise, unmapped, codepoint, proseSubscript, proseSuperscript,
       SCRIPT_JUST_CONSUMED} = require('./tex_unicode.js');

const [, , mdPath, modPath] = process.argv;
if (!mdPath) {
  console.error('usage: node md_to_html.js <report.md> [path/to/node_modules]');
  process.exit(2);
}

// Look where the caller says first, then walk up from this script: that finds an install
// beside the toolkit and, when the toolkit is a submodule of another repository, one at that
// repository's root.
const MODULES = (function () {
  const tries = [];
  if (modPath) tries.push(path.resolve(modPath));
  for (let d = __dirname; ; d = path.dirname(d)) {
    tries.push(path.join(d, 'node_modules'));
    if (path.dirname(d) === d) break;
  }
  for (const t of tries) {
    if (fs.existsSync(path.join(t, 'mathjax-full', 'js', 'mathjax.js')) &&
        fs.existsSync(path.join(t, 'github-markdown-css', 'github-markdown.css'))) return t;
  }
  return null;
})();
if (!MODULES) {
  console.error('cannot find mathjax-full and github-markdown-css.  Install them beside this\n' +
    'script or at the root of the repository that vendors it\n' +
    '  npm install --prefix <dir> mathjax-full github-markdown-css\n' +
    'or pass the node_modules directory that holds them\n' +
    '  node scripts/md_to_html.js report.md <dir>/node_modules');
  process.exit(3);
}

// mathjax-full has no single entry point worth using from Node, so the component files are
// required by path.  Every TeX package except bussproofs, which throws `requires an output jax
// with a getBBox() method` the moment it loads -- there is no output jax here, only the MathML
// serialiser, and no report needs proof trees.
const mjReq = (rel) => require(path.join(MODULES, 'mathjax-full', rel));
const {mathjax} = mjReq('js/mathjax.js');
const {TeX} = mjReq('js/input/tex.js');
const {liteAdaptor} = mjReq('js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler} = mjReq('js/handlers/html.js');
const {SerializedMmlVisitor} = mjReq('js/core/MmlTree/SerializedMmlVisitor.js');
const {AllPackages} = mjReq('js/input/tex/AllPackages.js');
const {STATE} = mjReq('js/core/MathItem.js');
mjReq('js/util/entities/all.js');
RegisterHTMLHandler(liteAdaptor());
const mjDoc = mathjax.document('', {
  InputJax: new TeX({packages: AllPackages.filter((p) => p !== 'bussproofs')}),
});
const mjVisitor = new SerializedMmlVisitor();

const ROOT = path.dirname(path.resolve(mdPath));
const src = fs.readFileSync(mdPath, 'utf8').replace(/\r\n?/g, '\n');
const stats = {math: 0, display: 0, figures: 0, tables: 0, bytes: 0};

// ---------------------------------------------------------------- maths
/*
 * Formulas are replaced by these before the request and put back after it.  The token has to
 * survive a markdown renderer and an HTML sanitiser untouched, so it is bare uppercase ASCII
 * with no character markdown gives a meaning to, and long enough not to occur in prose.
 */
const TOKEN = (i) => 'XMATHPLACEHOLDERX' + i + 'X';
const rendered = [];

// The serialiser writes every non-ASCII character as a numeric reference.  That renders
// correctly but triples the size of a Greek-heavy equation and makes the generated file
// undiffable, so references above ASCII are folded back to the characters themselves.  The
// named escapes for `<`, `>` and `&` are left alone, which is why only `&#x...;` is matched.
function unentity(s) {
  return s.replace(/&#x([0-9A-Fa-f]+);/g, (m, hex) => {
    const cp = parseInt(hex, 16);
    return cp > 0x7f ? String.fromCodePoint(cp) : m;
  });
}

/** Render one formula to MathML now, and return the placeholder that stands in for it. */
function math(tex, display) {
  // A character tex_unicode.js does not know reaches MathJax raw and is set as a glyph, and
  // nothing in the output says so, so the build refuses it rather than shipping a formula
  // that is quietly wrong.
  const strays = unmapped(tex);
  if (strays.length) {
    console.error('unmapped Unicode in: ' + tex);
    for (const h of strays) {
      console.error('  ' + h.ch + '  ' + codepoint(h.ch) +
                    '  -- not in SUP, SUB, MACRO or SAFE');
    }
    console.error('  MathJax would set these as glyphs, not as what they mean.  Add them to' +
                  '\n  scripts/tex_unicode.js: MACRO if a macro is meant, SAFE only after' +
                  '\n  rendering the character and the macro and finding the MathML identical.');
    process.exit(1);
  }
  const norm = normalise(tex);
  let mml;
  try {
    const node = mjDoc.convert(norm, {display: !!display, end: STATE.CONVERT});
    mml = unentity(mjVisitor.visitTree(node, mjDoc));
  } catch (e) {
    console.error('LaTeX error in: ' + tex +
                  (norm === tex ? '' : '\n  normalised to: ' + norm) +
                  '\n  ' + String(e.message).split('\n')[0]);
    process.exit(1);
  }
  stats.math++;
  if (display) stats.display++;
  const i = rendered.length;
  rendered.push(display ? '<div class="display-math">' + mml + '</div>' : mml);
  return TOKEN(i);
}

// ---------------------------------------------------------------- prose
/**
 * Walk the source, pull every formula out to a placeholder, and apply the prose scripts,
 * stepping over everything whose contents are not prose: code spans, link destinations and
 * raw HTML tags.  Emphasis, headings, lists and tables are deliberately NOT recognised --
 * they are GitHub's.
 */
function prose(text) {
  let out = '';
  let i = 0;
  // The character before `i`, but only when it was plain prose -- '' after any consumed
  // token.  proseSubscript() needs exactly that; see its contract in tex_unicode.js.
  let plainPrev = '';
  while (i < text.length) {
    const rest = text.slice(i);

    const tick = /^(`+)/.exec(rest);
    if (tick) {
      const end = text.indexOf(tick[1], i + tick[1].length);
      if (end > 0) {
        out += text.slice(i, end + tick[1].length);
        i = end + tick[1].length;
        plainPrev = '';
        continue;
      }
    }

    if (text[i] === '$') {
      const display = text.startsWith('$$', i);
      const delim = display ? '$$' : '$';
      const end = text.indexOf(delim, i + delim.length);
      if (end > 0) {
        out += math(text.slice(i + delim.length, end), display);
        i = end + delim.length;
        plainPrev = '';
        continue;
      }
    }

    const link = /^(!?\[)([^\]]*)(\]\()([^)\s]+)(\))/.exec(rest);
    if (link) {
      out += link[1] + prose(link[2]) + link[3] + link[4] + link[5];
      i += link[0].length;
      plainPrev = '';
      continue;
    }

    const raw = /^<\/?[a-zA-Z][^<>]*>/.exec(rest);
    if (raw) {
      out += raw[0];
      i += raw[0].length;
      plainPrev = '';
      continue;
    }

    const sub = proseSubscript(rest, plainPrev);
    if (sub) {
      out += sub.base + '<sub>' + sub.sub + '</sub>';
      i += sub.length;
      plainPrev = SCRIPT_JUST_CONSUMED;
      continue;
    }
    const sup = proseSuperscript(rest, plainPrev);
    if (sup) {
      out += '<sup>' + sup.sup + '</sup>';
      i += sup.length;
      plainPrev = SCRIPT_JUST_CONSUMED;
      continue;
    }

    // GITHUB READS A SINGLE `~` AS STRIKETHROUGH, and physics prose uses it for "of order".
    // Two of them in one paragraph -- `J₃~δf³/48 against J₁~δf/2` -- came back as
    // `J₃<del>δf³/48 against J₁</del>δf/2`, which is a silent corruption of the text rather
    // than a formatting difference.  Escaped, GitHub emits the character.  Anything that
    // really wants strikethrough can write `<del>`.
    if (text[i] === '~') {
      out += '\\~';
      plainPrev = '~';
      i++;
      continue;
    }

    out += text[i];
    plainPrev = text[i];
    i++;
  }
  return out;
}

// ---------------------------------------------------------------- the request
/** A token, if one can be had.  Optional: it only raises the rate limit. */
function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    const t = execFileSync('gh', ['auth', 'token'], {encoding: 'utf8'}).trim();
    if (t) return t;
  } catch (e) { /* gh absent or not logged in; anonymous is fine */ }
  return null;
}

async function convert(text) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'md_to_html.js',
  };
  const token = githubToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  let res;
  try {
    res = await fetch('https://api.github.com/markdown', {
      method: 'POST',
      headers,
      body: JSON.stringify({text, mode: 'markdown'}),
    });
  } catch (e) {
    console.error('FAIL cannot reach api.github.com: ' + e.message +
                  '\n  This build converts the markdown through GitHub, so it needs the ' +
                  'network.');
    process.exit(1);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('FAIL GitHub /markdown returned ' + res.status + ' ' + res.statusText +
                  (body ? '\n  ' + body.slice(0, 300) : '') +
                  (res.status === 403 || res.status === 429
                    ? '\n  Rate limited.  Set $GITHUB_TOKEN, or run `gh auth login`, for ' +
                      '5000 requests an hour instead of 60.'
                    : ''));
    process.exit(1);
  }
  return res.text();
}

// ---------------------------------------------------------------- figures
function dataURI(rel) {
  const full = path.normalize(path.join(ROOT, decodeURIComponent(rel)));
  if (!fs.existsSync(full)) {
    console.error('MISSING figure: ' + rel);
    process.exit(1);
  }
  const ext = path.extname(full).toLowerCase();
  const mime = ext === '.svg' ? 'image/svg+xml'
             : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
             : ext === '.gif' ? 'image/gif' : 'image/png';
  // An SVG is TEXT, so the checkout's line endings reach it and base64 of CRLF is not base64
  // of LF.  Normalise, or the output depends on `core.autocrlf` rather than on its sources.
  // Raster formats are binary and are left exactly as they are.
  const raw = fs.readFileSync(full);
  const bytes = ext === '.svg'
    ? Buffer.from(raw.toString('utf8').replace(/\r\n?/g, '\n'), 'utf8')
    : raw;
  const b64 = bytes.toString('base64');
  stats.bytes += b64.length;
  stats.figures++;
  return 'data:' + mime + ';base64,' + b64;
}

/*
 * Put the house figure back together, and inline every image.
 *
 * The endpoint returns an image as `<p><a ...><img ...></a></p>`: it wraps the image in a
 * link to the file, which in a mailed single file points at a path the reader does not have,
 * so the link is dropped and the image kept.  A following all-italic paragraph is the
 * caption, and the pair becomes a `<figure>`; `<figure>` could not be sent in the source
 * because the sanitiser strips it.
 */
const IMG_P = /<p>(?:<a\b[^>]*>)?\s*<img\b([^>]*)>\s*(?:<\/a>)?<\/p>/g;

function figuresAndImages(html) {
  return html.replace(IMG_P, (whole, attrs, offset, all) => {
    const srcM = /\ssrc="([^"]*)"/.exec(attrs);
    if (!srcM) return whole;
    const img = '<img' + attrs.replace(/\ssrc="[^"]*"/, '') +
                ' src="' + dataURI(srcM[1]) + '">';
    // an all-italic paragraph immediately after is this figure's caption
    const after = all.slice(offset + whole.length);
    const cap = /^\s*<p><em>([\s\S]*?)<\/em><\/p>/.exec(after);
    if (cap) {
      capsConsumed.push(cap[0]);
      return '<figure>\n' + img + '\n<figcaption>' + cap[1] + '</figcaption>\n</figure>';
    }
    return '<p>' + img + '</p>';
  });
}
const capsConsumed = [];

// ---------------------------------------------------------------- validate
const VOID = new Set(['img', 'br', 'hr', 'meta', 'link', 'input', 'source', 'area',
                      'base', 'col', 'embed', 'param', 'track', 'wbr']);
function balanced(html) {
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g;
  const stack = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, close, tag, selfClose] = m;
    if (VOID.has(tag.toLowerCase()) || selfClose) continue;
    if (!close) stack.push(tag);
    else if (!stack.length) return 'stray </' + tag + '>';
    else if (stack[stack.length - 1] !== tag)
      return '</' + tag + '> closes <' + stack[stack.length - 1] + '>';
    else stack.pop();
  }
  return stack.length ? 'unclosed <' + stack.join('>, <') + '>' : null;
}

// ---------------------------------------------------------------- go
const title = (/^#\s+(.*)$/m.exec(src) || [, 'Report'])[1]
  .replace(/\$[^$]*\$/g, '').replace(/[*`]/g, '').trim();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The generated file is meant to be sent to people, so it says on its face -- not only in an
// HTML comment -- that the markdown is the original.
const mdName = path.basename(mdPath);
const exportNote = '*This is a shareable, self-contained export of `' + mdName + '` — every ' +
  'figure is embedded and every formula is pre-rendered, so it needs no network and no fonts ' +
  'beyond the ones already on the machine. `' + mdName + '` is the authored source; this file ' +
  'is generated from it and is overwritten on every build, so corrections belong in the ' +
  'markdown.*';

// github-markdown-css styles the CONTENTS of `.markdown-body` and takes no view on the page
// around it.  These are the wrapper rules its own readme prescribes, and the only styling
// this repository still owns.
const WRAPPER_CSS = `
.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
  padding: 45px;
}
@media (max-width: 767px) {
  .markdown-body { padding: 15px; }
}
.markdown-body .display-math {
  display: block;
  overflow-x: auto;
  margin: 1em 0;
  text-align: center;
}
`;

(async function main() {
  const fragment = await convert(exportNote + '\n\n' + prose(src));

  let body = figuresAndImages(fragment);
  for (const c of capsConsumed) body = body.replace(c, '');
  // put the formulas back
  body = body.replace(/<p>\s*(XMATHPLACEHOLDERX\d+X)\s*<\/p>/g, (m, t) => byToken(t) || m)
             .replace(/XMATHPLACEHOLDERX\d+X/g, (t) => byToken(t) || t);
  stats.tables = (body.match(/<table\b/g) || []).length;

  const left = /XMATHPLACEHOLDERX\d+X/.exec(body);
  if (left) {
    console.error('FAIL a formula placeholder survived into the output: ' + left[0] +
                  '\n  GitHub rewrote or removed it, so the splice-back could not find it.');
    process.exit(1);
  }

  const css = fs.readFileSync(
    path.join(MODULES, 'github-markdown-css', 'github-markdown.css'), 'utf8')
    .replace(/\r\n?/g, '\n');

  const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<!-- Generated from ' + mdName + ' by scripts/md_to_html.js.\n' +
    '     Markdown converted by GitHub\'s /markdown API; styled with github-markdown-css.\n' +
    '     Do not edit this file: edit the markdown and rebuild. -->\n' +
    '<title>' + esc(title) + '</title>\n<style>\n' + css + WRAPPER_CSS +
    '</style>\n</head>\n<body>\n<article class="markdown-body">\n\n' +
    body.trim() + '\n\n</article>\n</body>\n</html>\n';

  const err = balanced(html);
  if (err) { console.error('FAIL structure: ' + err); process.exit(1); }

  const outPath = path.join(ROOT, mdName.replace(/\.md$/, '') + '.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(path.basename(outPath) + ': ' + stats.math + ' math (' + stats.display +
    ' display), ' + stats.figures + ' figures, ' + stats.tables +
    ' tables, tags balanced, converted by GitHub');
  console.log('  ' + (stats.bytes / 1024).toFixed(0) + ' kB of image data, file is ' +
    (fs.statSync(outPath).size / 1024).toFixed(0) + ' kB');
})();

function byToken(t) {
  const m = /^XMATHPLACEHOLDERX(\d+)X$/.exec(t);
  return m ? rendered[Number(m[1])] : null;
}
