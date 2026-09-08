#!/usr/bin/env node
/*
 * Build a self-contained HTML report.
 * Usage: node scripts/md_to_html.js <report.md> [path/to/node_modules]
 *
 * GitHub renders Markdown; MathJax renders formulas locally before the request.
 * Prose scripts, figure captions, embedded images, and CSS are assembled here.
 * Building sends report text to GitHub; authentication is optional.
 * See markdown-report-pipeline.md for source conventions and validation.
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

// Try the supplied dependency path, then ancestor directories for vendored installs.
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

// Load MathJax components by path.
// Exclude bussproofs: it needs an output jax with getBBox(), while this pipeline only serialises MathML.
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
// ASCII placeholders protect formulas from Markdown parsing and HTML sanitisation.
const TOKEN = (i) => 'XMATHPLACEHOLDERX' + i + 'X';
const rendered = [];

// Decode non-ASCII numeric references for smaller, readable output; retain ASCII escapes.
function unentity(s) {
  return s.replace(/&#x([0-9A-Fa-f]+);/g, (m, hex) => {
    const cp = parseInt(hex, 16);
    return cp > 0x7f ? String.fromCodePoint(cp) : m;
  });
}

/** Render one formula to MathML now, and return the placeholder that stands in for it. */
function math(tex, display) {
  // Reject unknown Unicode before MathJax can render structural symbols as plain glyphs.
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
 * Extract formulas and prose scripts, skipping recognised code spans, links, and raw tags.
 * Leave headings, emphasis, lists, and tables to GitHub.
 */
function prose(text) {
  let out = '';
  let i = 0;
  // Track the preceding prose character; scripts use SCRIPT_JUST_CONSUMED, other tokens ''.
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

    // Preserve literal prose tildes; use <del> when strikethrough is intended.
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
/**
 * A token, if one can be had.
 * Optional: it only raises the rate limit.
 */
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
  // Normalise SVG line endings before base64 encoding; raster bytes stay unchanged.
  const raw = fs.readFileSync(full);
  const bytes = ext === '.svg'
    ? Buffer.from(raw.toString('utf8').replace(/\r\n?/g, '\n'), 'utf8')
    : raw;
  const b64 = bytes.toString('base64');
  stats.bytes += b64.length;
  stats.figures++;
  return 'data:' + mime + ';base64,' + b64;
}

// Reassemble standalone images and italic captions after GitHub sanitisation.
// Drop image links to local paths that would not travel with the exported HTML.
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

// Identify the editable source in the visible export as well as its HTML comment.
const mdName = path.basename(mdPath);
const exportNote = '*This is a shareable, self-contained export of `' + mdName + '` — every ' +
  'figure is embedded and every formula is pre-rendered, so it needs no network and no fonts ' +
  'beyond the ones already on the machine. `' + mdName + '` is the authored source; this file ' +
  'is generated from it and is overwritten on every build, so corrections belong in the ' +
  'markdown.*';

// Page layout around the embedded github-markdown-css content styles.
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
