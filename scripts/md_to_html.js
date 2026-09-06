#!/usr/bin/env node
/*
 * Build a self-contained HTML report from a markdown source.
 *
 *     node scripts/md_to_html.js <report.md> [/path/to/node_modules]
 *
 * The markdown is the authored source.  The HTML is generated and is overwritten on every
 * build, so never edit it.  Figures are inlined as base64 and formulas are pre-rendered to
 * MathML, so the output needs no network, no JavaScript and no web fonts; `mathjax-full` is
 * the only dependency and only at build time.
 *
 * The markdown conventions this recognises, the Unicode-to-LaTeX conversion, and the checks
 * the build refuses to skip are documented in markdown-report-pipeline.md.  What is
 * commented below is only what the code does that the note does not say.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {normalise, unmapped, codepoint, proseSubscript, proseSuperscript,
       SCRIPT_JUST_CONSUMED} = require('./tex_unicode.js');

const [, , mdPath, modPath] = process.argv;
if (!mdPath) {
  console.error('usage: node md_to_html.js <report.md> [path/to/node_modules]');
  process.exit(2);
}

// mathjax-full has no single entry point worth using from Node, so the component files are
// required by path.  Look where the caller says first, then walk up from this script: that
// finds an install beside the toolkit and, when the toolkit is vendored into another
// repository, one at that repository's root.
const MJ_DIR = (function () {
  const tries = [];
  if (modPath) {
    tries.push(path.resolve(modPath, 'mathjax-full'), path.resolve(modPath));
  }
  for (let d = __dirname; ; d = path.dirname(d)) {
    tries.push(path.join(d, 'node_modules', 'mathjax-full'));
    if (path.dirname(d) === d) break;
  }
  for (const t of tries) {
    if (fs.existsSync(path.join(t, 'js', 'mathjax.js'))) return t;
  }
  return null;
})();
if (!MJ_DIR) {
  console.error('cannot find mathjax-full.  Either install it beside this script\n' +
    '  npm install --prefix <toolkit root> mathjax-full\n' +
    'or pass the node_modules directory that holds it\n' +
    '  node scripts/md_to_html.js report.md <dir>/node_modules');
  process.exit(3);
}
const mjReq = (rel) => require(path.join(MJ_DIR, rel));
const {mathjax} = mjReq('js/mathjax.js');
const {TeX} = mjReq('js/input/tex.js');
const {liteAdaptor} = mjReq('js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler} = mjReq('js/handlers/html.js');
const {SerializedMmlVisitor} = mjReq('js/core/MmlTree/SerializedMmlVisitor.js');
const {AllPackages} = mjReq('js/input/tex/AllPackages.js');
const {STATE} = mjReq('js/core/MathItem.js');
mjReq('js/util/entities/all.js');

// Every TeX package except bussproofs, which throws `requires an output jax with a
// getBBox() method` the moment it loads -- there is no output jax here, only the MathML
// serialiser, and no report needs proof trees.
const mjAdaptor = liteAdaptor();
RegisterHTMLHandler(mjAdaptor);
const mjDoc = mathjax.document('', {
  InputJax: new TeX({packages: AllPackages.filter((p) => p !== 'bussproofs')}),
});
const mjVisitor = new SerializedMmlVisitor();


const ROOT = path.dirname(path.resolve(mdPath));
const src = fs.readFileSync(mdPath, 'utf8');
const stats = {math: 0, display: 0, figures: 0, tables: 0, bytes: 0};

// The default stylesheet sits beside this script.  A document that needs different styling
// can drop its own scripts/report.css next to its markdown and that wins.
const CSS_LOCAL = path.join(ROOT, 'scripts', 'report.css');
const CSS_PATH = fs.existsSync(CSS_LOCAL) ? CSS_LOCAL : path.join(__dirname, 'report.css');
// Normalise the stylesheet's line endings before inlining it.  Otherwise the generated HTML
// inherits whatever the checkout has -- git hands text files over with CRLF on Windows under
// `* text=auto` -- and the build becomes platform-dependent.
const CSS = fs.readFileSync(CSS_PATH, 'utf8').replace(/\r\n?/g, '\n');

// ---------------------------------------------------------------- inline
const esc = (s) => s.replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, '&amp;')
                    .replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Split on inline math first, so $...$ contents are never touched by markdown rules. */
function inline(text) {
  let out = '';
  let i = 0;
  // The character before `i`, but only when it was plain prose -- '' after any consumed token.
  // proseSubscript() needs exactly that; see its contract in tex_unicode.js.
  let plainPrev = '';
  while (i < text.length) {
    // raw HTML passthrough: <tag ...> or </tag>
    const raw = /^<\/?[a-zA-Z][^<>]*>/.exec(text.slice(i));
    if (raw) { out += raw[0]; i += raw[0].length; plainPrev = ''; continue; }
    if (text[i] === '$') {
      const end = text.indexOf('$', i + 1);
      if (end > i) {
        out += mathml(text.slice(i + 1, end), false);
        i = end + 1;
        plainPrev = ''; continue;
      }
    }
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) {
        out += '<code>' + esc(text.slice(i + 1, end)) + '</code>';
        i = end + 1;
        plainPrev = ''; continue;
      }
    }
    // link
    const link = /^\[([^\]]*)\]\(([^)\s]+)\)/.exec(text.slice(i));
    if (link) {
      out += '<a href="' + link[2] + '">' + inline(link[1]) + '</a>';
      i += link[0].length;
      plainPrev = ''; continue;
    }
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end > i) {
        out += '<b>' + inline(text.slice(i + 2, end)) + '</b>';
        i = end + 2;
        plainPrev = ''; continue;
      }
    }
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1);
      if (end > i) {
        out += '<em>' + inline(text.slice(i + 1, end)) + '</em>';
        i = end + 1;
        plainPrev = ''; continue;
      }
    }
    if (text[i] === '\\' && i + 1 < text.length && '*_`$'.includes(text[i + 1])) {
      out += esc(text[i + 1]); i += 2; plainPrev = ''; continue;
    }
    // last, so that everything above -- code, math, links, emphasis -- has had its say first
    const sub = proseSubscript(text.slice(i), plainPrev);
    if (sub) {
      out += esc(sub.base) + '<sub>' + esc(sub.sub) + '</sub>';
      i += sub.length;
      plainPrev = SCRIPT_JUST_CONSUMED;
      continue;
    }
    const sup = proseSuperscript(text.slice(i), plainPrev);
    if (sup) {
      out += '<sup>' + esc(sup.sup) + '</sup>';
      i += sup.length;
      plainPrev = SCRIPT_JUST_CONSUMED;
      continue;
    }
    out += esc(text[i]);
    plainPrev = text[i];
    i++;
  }
  return out;
}

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

function mathml(tex, display) {
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
  const src = normalise(tex);
  let r;
  try {
    const node = mjDoc.convert(src, {display: !!display, end: STATE.CONVERT});
    r = unentity(mjVisitor.visitTree(node, mjDoc));
  } catch (e) {
    console.error('LaTeX error in: ' + tex +
                  (src === tex ? '' : '\n  normalised to: ' + src) +
                  '\n  ' + String(e.message).split('\n')[0]);
    process.exit(1);
  }
  stats.math++;
  if (display) stats.display++;
  const cls = display ? 'md' : 'm';
  const tag = display ? 'div' : 'span';
  return '<' + tag + ' class="' + cls + '">' + r + '</' + tag + '>';
}

// ---------------------------------------------------------------- figures
function dataURI(rel) {
  const full = path.normalize(path.join(ROOT, rel));
  if (!fs.existsSync(full)) {
    console.error('MISSING figure: ' + rel);
    process.exit(1);
  }
  const ext = path.extname(full).toLowerCase();
  const mime = ext === '.svg' ? 'image/svg+xml'
             : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
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

// ---------------------------------------------------------------- blocks
const IMG_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

/**
 * If `s` is exactly one `*...*` emphasis run spanning the whole string, return its inside;
 * otherwise null.  Used to spot standfirsts, figure captions and footnotes.
 */
function soleEmphasis(s) {
  if (s.length < 3 || !s.startsWith('*')) return null;
  // The discriminator is the CLOSING delimiter, not the opening one.  A caption with a bold
  // lead-in, `***Bold lead.** the rest*`, opens with `***` and cannot be told from bold by
  // its first characters, but it ends with a lone `*`; a paragraph that merely happens to
  // end bold ends with `**`.
  if (!s.endsWith('*') || s.endsWith('**')) return null;
  return s.slice(1, -1);
}

/** Split into blocks on blank lines, but keep fenced code and tables intact. */
function split(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let cur = [];
  let fence = false;
  const flush = () => { if (cur.join('').trim()) blocks.push(cur.join('\n')); cur = []; };
  for (const ln of lines) {
    if (/^```/.test(ln)) {
      if (!fence) { flush(); cur.push(ln); fence = true; }
      else { cur.push(ln); fence = false; flush(); }
      continue;
    }
    if (fence) { cur.push(ln); continue; }
    if (ln.trim() === '') { flush(); continue; }
    cur.push(ln);
  }
  flush();
  return blocks;
}

function tableHTML(block) {
  const rows = block.split('\n').filter((l) => l.trim().startsWith('|'));
  const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '')
                        .split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
  const isSep = (l) => /^\|[\s:|-]+\|?$/.test(l.trim()) && l.includes('-');
  const sep = rows.findIndex(isSep);
  if (sep < 0) return null;
  const head = rows.slice(0, sep).map(cells);
  const body = rows.slice(sep + 1).map(cells);
  // A cell is "numeric" if it is a number, possibly signed/decorated -- those get
  // tabular figures and right alignment, which is what makes the ledgers readable.
  const num = (c) => c === '' || c === '—' || c === '--' ||
    /^[*_`]*[+\-−(]?\s*[\d.]+\s*(?:[a-zA-Zµ%×x°]|dB|GHz|MHz|pH|pF|uA|rad|dBm)*\s*[)]?[*_`]*$/
      .test(c.replace(/&[a-z]+;/g, ''));
  let h = '<table>\n';
  if (head.length) {
    h += '<thead>' + head.map((r) =>
      '<tr>' + r.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr>').join('\n') +
      '</thead>\n';
  }
  h += '<tbody>\n' + body.map((r) =>
    '<tr>' + r.map((c, j) =>
      '<td' + (j > 0 && num(c) ? ' class="num"' : '') + '>' + inline(c) + '</td>')
      .join('') + '</tr>').join('\n') + '\n</tbody>\n</table>';
  stats.tables++;
  return h;
}

function listHTML(block) {
  const lines = block.split('\n');
  const ordered = /^\s*\d+\.\s/.test(lines[0]);
  const items = [];
  for (const ln of lines) {
    const m = /^\s*(?:[-*+]|\d+\.)\s+(.*)$/.exec(ln);
    if (m) items.push(m[1]);
    else if (items.length) items[items.length - 1] += ' ' + ln.trim();
  }
  const tag = ordered ? 'ol' : 'ul';
  return '<' + tag + '>\n' + items.map((t) => '<li>' + inline(t) + '</li>').join('\n') +
         '\n</' + tag + '>';
}

function render(blocks) {
  const out = [];
  let seenH1 = false;
  for (let i = 0; i < blocks.length; i++) {
    let b = blocks[i].trim();

    if (/^<!--/.test(b)) continue;                        // comments are not output

    if (/^```/.test(b)) {
      const body = b.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '');
      out.push('<pre><code>' + esc(body) + '</code></pre>');
      continue;
    }

    if (/^\$\$/.test(b) && /\$\$$/.test(b)) {
      out.push(mathml(b.replace(/^\$\$\s*/, '').replace(/\s*\$\$$/, ''), true));
      continue;
    }

    if (b.split('\n').every((l) => l.trim().startsWith('>'))) {
      const inner = b.split('\n').map((l) => l.replace(/^>\s?/, '')).join('\n');
      const kind = /^\s*#{1,6}\s/.test(inner) ? 'verdict' : 'note';
      out.push('<div class="' + kind + '">\n' + render(split(inner)).join('\n') + '\n</div>');
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(b);
    if (h) {
      const lvl = h[1].length;
      out.push('<h' + lvl + '>' + inline(h[2]) + '</h' + lvl + '>');
      if (lvl === 1) seenH1 = true;
      continue;
    }

    if (b.split('\n').filter((l) => l.trim()).every((l) => l.trim().startsWith('|'))) {
      const t = tableHTML(b);
      if (t) { out.push(t); continue; }
    }

    if (/^\s*(?:[-*+]|\d+\.)\s+/.test(b)) { out.push(listHTML(b)); continue; }

    // a figure: an image alone, optionally followed by an all-italic caption paragraph
    const oneLine = b.replace(/\n/g, ' ').trim();
    const img = IMG_ONLY.exec(oneLine);
    if (img) {
      let fig = '<figure>\n<img data-src="' + img[2] + '" alt="' + img[1] +
                '" src="' + dataURI(img[2]) + '">';
      const nxt = (blocks[i + 1] || '').trim().replace(/\n/g, ' ');
      const cap = soleEmphasis(nxt);
      if (cap && !IMG_ONLY.test(nxt)) {
        fig += '\n<figcaption>' + inline(cap) + '</figcaption>';
        i++;
      }
      out.push(fig + '\n</figure>');
      continue;
    }

    if (/^---+$/.test(b)) { out.push('<hr>'); continue; }

    // A raw HTML block passes through verbatim, EXCEPT that $...$ inside it is still
    // rendered.  Without that, any layout that markdown cannot express -- a two-column
    // grid, a headed card -- could not contain a formula, which in practice is most of
    // them.  So raw HTML buys layout without giving up math.
    if (/^<(?:div|table|figure|p|ul|ol|pre|hr|h[1-6])\b/.test(b)) {
      out.push(b.replace(/\$([^$]+)\$/g, (_, tex) => mathml(tex, false)));
      continue;
    }

    // standfirst: the italic paragraph immediately after the H1 or an H2 -- the CSS
    // selector is `h1+p.sub, h2+p.sub`, so both positions are meaningful
    const it = soleEmphasis(oneLine);
    const prevIsHead = out.length && /^<h[12]>/.test(out[out.length - 1]);
    if (it && prevIsHead && seenH1) {
      out.push('<p class="sub">' + inline(it) + '</p>');
      continue;
    }
    // a lone italic paragraph elsewhere: a footnote or an aside
    if (it) { out.push('<p class="kv">' + inline(it) + '</p>'); continue; }

    out.push('<p>' + inline(oneLine) + '</p>');
  }
  return out;
}

// ---------------------------------------------------------------- validate
const VOID = new Set(['img', 'br', 'hr', 'meta', 'link', 'input', 'source', 'area',
                      'base', 'col', 'embed', 'param', 'track', 'wbr']);
function balanced(html) {
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
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
const body = render(split(src)).join('\n\n');
// The generated file is meant to be sent to people, so it says on its face -- not only in an
// HTML comment -- that the markdown is the original.
function exportNote(mdName) {
  return '<p class="export">This is a shareable, self-contained export of <code>' +
    esc(mdName) + '</code> \u2014 every figure is embedded and every formula is pre-rendered, ' +
    'so it needs no network and no fonts beyond the ones already on the machine. ' +
    '<code>' + esc(mdName) + '</code> is the authored source; this file is generated from it ' +
    'and is overwritten on every build, so corrections belong in the markdown.</p>';
}

const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  '<!-- Generated from ' + path.basename(mdPath) + ' by scripts/md_to_html.js.\n' +
  '     Do not edit this file: edit the markdown and rebuild. -->\n' +
  '<title>' + esc(title) + '</title>\n' + CSS + '\n</head>\n<body>\n<div class="wrap">\n\n' +
  exportNote(path.basename(mdPath)) + '\n\n' +
  body + '\n\n</div>\n</body>\n</html>\n';

const err = balanced(html);
if (err) { console.error('FAIL structure: ' + err); process.exit(1); }

const outPath = path.join(ROOT, path.basename(mdPath).replace(/\.md$/, '') + '.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(path.basename(outPath) + ': ' + stats.math + ' math (' + stats.display +
  ' display), ' + stats.figures + ' figures, ' + stats.tables + ' tables, tags balanced');
console.log('  ' + (stats.bytes / 1024).toFixed(0) + ' kB of image data, file is ' +
  (fs.statSync(outPath).size / 1024).toFixed(0) + ' kB');
