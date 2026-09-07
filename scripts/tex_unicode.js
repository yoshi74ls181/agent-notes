/*
 * Rewrite the Unicode maths in a formula as the LaTeX MathJax needs, and flag any character
 * that would reach it unconverted.  Why the conversion is necessary, and what each set of
 * characters is for, is in markdown-report-pipeline.md; this file is the implementation.
 *
 *   SUP, SUB   characters that are structure: converted to `^{...}` / `_{...}`
 *   MACRO      characters MathJax sets differently from the macro they stand for: converted
 *   SAFE       characters MathJax sets IDENTICALLY to their macro: passed through
 *   unmapped() the guard: a character in none of the three, which `md_to_html.js` refuses
 *
 * Anything that has to reason about the same maths imports this module rather than repeating
 * the tables.  Text-mode arguments are copied verbatim and are exempt from the guard.
 */
'use strict';

// Unicode superscripts and subscripts, to the token that goes inside ^{ } or _{ }.
const SUP = new Map(Object.entries({
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
  'ⁿ': 'n', 'ⁱ': 'i',
}));
const SUB = new Map(Object.entries({
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
  'ₐ': 'a', 'ₑ': 'e', 'ₒ': 'o', 'ₓ': 'x',
  'ₕ': 'h', 'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n',
  'ₚ': 'p', 'ₛ': 's', 'ₜ': 't',
}));

/*
 * Characters MathJax sets differently from the macro they stand for.  Every one was checked by
 * rendering the character and the macro and comparing the MathML; the differences are
 * tabulated in markdown-report-pipeline.md.  Two arrows are mapped despite rendering
 * identically or near-identically, so that the set needs no judgement call to read.
 */
const MACRO = new Map(Object.entries({
  '½': '\\tfrac12', '¼': '\\tfrac14', '¾': '\\tfrac34',
  '⅓': '\\tfrac13', '⅔': '\\tfrac23',
  '×': '\\times', '·': '\\cdot', '∂': '\\partial',
  '∞': '\\infty', '′': "'",
  '⟺': '\\iff', '⟹': '\\implies',
  '→': '\\to', '←': '\\leftarrow',
  '∑': '\\sum', '∫': '\\int', '∏': '\\prod',
  '⟨': '\\langle', '⟩': '\\rangle', '⌈': '\\lceil', '⌉': '\\rceil',
  '∇': '\\nabla', '∀': '\\forall', '∃': '\\exists', '∅': '\\emptyset',
  'ℏ': '\\hbar',
  'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta',
  'Λ': '\\Lambda', 'Ξ': '\\Xi', 'Π': '\\Pi',
  'Σ': '\\Sigma', 'Φ': '\\Phi', 'Ψ': '\\Psi',
  'Ω': '\\Omega', 'Υ': '\\Upsilon',
}));

/*
 * Characters MathJax sets IDENTICALLY to their macro, so there is nothing to convert.  Each
 * was measured: the character's MathML and the macro's MathML compared equal.  Do not add to
 * this set by inspection -- render the pair and compare.
 */
const SAFE = new Set([
  // lowercase Greek, including the variant forms
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ',
  'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω',
  'ϑ', 'ϕ', 'ϱ', 'ς', 'ϖ', 'ϵ',
  // relations
  '≈', '≡', '≃', '≅', '≤', '≥', '≠', '∝', '∼', '≪', '≫', '≲', '≳', '∈', '⊂',
  // arrows that need nothing
  '↔', '⇒', '⇐', '↦',
  // operators and misc
  '−', '±', '∓', '⋯', '…', '⋮', '√', 'ℓ', '∘', '⊗', '⊕',
  '†', '‡', '∥',
]);

// arguments of these are set as text, so their contents are left exactly as written
const TEXT_MACROS = new Set(['text', 'mathrm', 'mathbf', 'mathit', 'mathsf', 'mathtt',
                             'operatorname', 'textrm', 'textbf', 'textit', 'mbox']);

// a macro name would swallow a following ASCII letter, so it needs a separator; before any of
// these a space is unnecessary and would only clutter the generated LaTeX
const NO_SPACE = new Set([...'^_{}()[]|,;:/=+-*\'\\ \t\n', '']);

/** Copy `s[i]` onward through one balanced `{...}` group; returns [text, nextIndex]. */
function copyGroup(s, i) {
  if (s[i] !== '{') return ['', i];
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{' && s[j - 1] !== '\\') depth++;
    else if (s[j] === '}' && s[j - 1] !== '\\') {
      depth--;
      if (depth === 0) return [s.slice(i, j + 1), j + 1];
    }
  }
  return [s.slice(i), s.length];   // unbalanced; let MathJax report it
}

/*
 * One scanner, so that the converter and the guard cannot disagree about what is maths and
 * what is text.  Token kinds: verbatim (copy as-is, exempt from the guard), script, mapped,
 * char.
 */
function scan(tex) {
  const out = [];
  let i = 0;
  while (i < tex.length) {
    const c = tex[i];

    if (c === '\\') {
      const m = /^\\([a-zA-Z]+)/.exec(tex.slice(i));
      if (!m) { out.push({k: 'verbatim', raw: tex.slice(i, i + 2)}); i += 2; continue; }
      let raw = m[0];
      i += m[0].length;
      if (TEXT_MACROS.has(m[1])) {
        while (tex[i] === ' ') { raw += ' '; i++; }
        const [grp, next] = copyGroup(tex, i);
        raw += grp;
        i = next;
      }
      out.push({k: 'verbatim', raw});
      continue;
    }

    if (SUP.has(c) || SUB.has(c)) {
      const table = SUP.has(c) ? SUP : SUB;
      let body = '';
      while (i < tex.length && table.has(tex[i])) { body += table.get(tex[i]); i++; }
      out.push({k: 'script', mark: table === SUP ? '^' : '_', body, next: tex[i] || ''});
      continue;
    }

    if (MACRO.has(c)) {
      out.push({k: 'mapped', ch: c, mac: MACRO.get(c), next: tex[i + 1] || ''});
      i++;
      continue;
    }

    out.push({k: 'char', ch: c});
    i++;
  }
  return out;
}

/** Rewrite the Unicode maths in `tex` as LaTeX.  Idempotent on anything already in LaTeX. */
function normalise(tex) {
  let out = '';
  for (const t of scan(tex)) {
    if (t.k === 'verbatim') { out += t.raw; continue; }
    if (t.k === 'script') {
      out += t.mark + (t.body.length === 1 ? t.body : '{' + t.body + '}');
      continue;
    }
    if (t.k === 'mapped') {
      out += t.mac;
      // Only a macro name can swallow what follows; `'` cannot.  A following Unicode script
      // needs no separator either, because it is about to become `^` or `_`.
      const gap = /[a-zA-Z]$/.test(t.mac) && !NO_SPACE.has(t.next) &&
                  !SUP.has(t.next) && !SUB.has(t.next);
      out += gap ? ' ' : '';
      continue;
    }
    out += t.ch;
  }
  return out;
}

/**
 * THE GUARD.  Non-ASCII characters in `tex` that are in none of the three sets, so they would
 * reach MathJax raw and be set as glyphs.  Text-mode arguments are exempt.
 *
 * Returns `[{ch, cp}]`, deduplicated, in order of first appearance.
 */
function unmapped(tex) {
  const hits = new Map();
  for (const t of scan(tex)) {
    if (t.k !== 'char') continue;
    const cp = t.ch.codePointAt(0);
    if (cp < 128 || SAFE.has(t.ch) || hits.has(t.ch)) continue;
    hits.set(t.ch, {ch: t.ch, cp});
  }
  return [...hits.values()];
}

/** `U+03B8`, for an error message. */
function codepoint(ch) {
  return 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
}

/*
 * PROSE SUBSCRIPTS.  Separate concern from everything above, same subject.
 *
 * Inline maths is written as plain text rather than as `$...$`, so a subscripted symbol reaches
 * the source as `x_b` and the underscore reaches the reader as an underscore.  This turns those
 * into real subscripts in the generated HTML.  Unicode is not used for it: the subscript block
 * has no `b`, `c`, `d`, `f`, `g`, `q`, `w`, `y` or `z`, no uppercase at all and almost no Greek,
 * so a Unicode pass would set a real subscript beside a literal underscore in one sentence.
 * Subscripts already written in Unicode are left alone; they render correctly already.
 *
 * WHAT IS NOT A SUBSCRIPT.  `snake_case` in filenames, identifiers and paths must survive
 * untouched.  The guard is that the base is exactly ONE letter and the character before it is
 * not a letter, `_` or `.`:
 *
 *   x_b  E_J  2E_J  λ_threshold  |S_ab|  L_J/L_b            subscripts
 *   fig1_a_vs_b.png  low_EJ  md_to_html.js  20_plots.jl     left alone
 *
 * A single-letter code identifier in prose -- `g_form` -- is therefore indistinguishable from a
 * subscript and will be set as one.  Put code in backticks, which the builder never touches.
 */
const PROSE_SUB = /^([A-Za-zͰ-Ͽħℓ])_([A-Za-z0-9]{1,12}|Δ)(?![_A-Za-z0-9])/;

/*
 * The same for a CARET superscript: `a₃^eff`, `h^2.02`, `(z/2)^m`.  Unicode has a usable
 * superscript alphabet only for `n` and `i`, so a superscript LABEL has to be written with a
 * caret, and without this the caret would reach the reader as a caret.
 *
 * The base is whatever the caret is attached to -- a letter, a digit, a closing bracket, or a
 * Unicode subscript the preceding character already carried -- so unlike a subscript there is
 * no single-character rule to enforce; a caret in prose is never anything but a superscript.
 * What the guard does have to do is refuse a caret with a space in front of it.
 */
const PROSE_SUP = /^\^([A-Za-z0-9.-]{1,14})/;
/** What a caller passes as `prev` after consuming a subscript or superscript. */
const SCRIPT_JUST_CONSUMED = '\u0000';

/**
 * Match an inline prose subscript at the START of `s`.  Returns `{base, sub, length}` or null.
 *
 * `prev` is the guard, and its contract is narrow: it is the preceding character ONLY IF that
 * character was plain prose, and '' otherwise -- at the start of the string, and after anything
 * the caller consumed as a token of its own.  That distinction is the whole guard.  In `low_EJ`
 * the `w` is prose, so `w_EJ` is rejected; in `φ_aφ_b` the `a` was consumed as the first
 * subscript, so the caller passes '' and the second subscript is found.  Pass the raw preceding
 * character and adjacent subscripts break; pass '' always and every filename is mangled.
 */
function proseSubscript(s, prev) {
  if (prev && /[A-Za-z_.]/.test(prev)) return null;
  const m = PROSE_SUB.exec(s);
  return m ? {base: m[1], sub: m[2], length: m[0].length} : null;
}

/**
 * Match a caret superscript at the START of `s`, which must be `^`.  Returns `{sup, length}` or
 * null.  A trailing `.` or `-` is left out of the body, so a caret at the end of a sentence does
 * not swallow the full stop.
 *
 * `prev` is the character the caret is attached to, under the same contract as
 * `proseSubscript` -- with one addition, because this guard needs to distinguish two cases the
 * subscript guard does not care about.  A caret at the very start of a string is not a
 * superscript, but a caret straight after a script the caller just consumed is one: `P_1dB^2`.
 * So the caller passes `SCRIPT_JUST_CONSUMED` rather than '' in the second case.  It is not
 * whitespace and not a letter, so both guards accept it and neither needs a special case.
 */
function proseSuperscript(s, prev) {
  if (!prev || /\s/.test(prev)) return null;
  const m = PROSE_SUP.exec(s);
  if (!m) return null;
  const body = m[1].replace(/[.-]+$/, "");
  return body ? {sup: body, length: 1 + body.length} : null;
}

module.exports = {normalise, unmapped, codepoint, scan, proseSubscript, proseSuperscript,
                  SUP, SUB, MACRO, SAFE, TEXT_MACROS, PROSE_SUB, PROSE_SUP, SCRIPT_JUST_CONSUMED};
