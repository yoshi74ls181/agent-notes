/*
 * Normalise Unicode math for MathJax and report unmapped characters.
 * SUP/SUB encode scripts, MACRO rewrites symbols, and SAFE permits passthrough.
 * The scanner preserves recognised text-style arguments for both conversion and validation.
 * See markdown-report-pipeline.md for authoring conventions.
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

// Map symbols to TeX for the intended structure, spacing, and math variant.
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

// Add passthrough symbols only after comparing their MathML with the intended TeX macro.
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

// Separate macro names from following letters without adding unnecessary spaces.
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

// Shared tokens keep normalisation and validation aligned: verbatim, script, mapped, char.
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
      // A prime or a following script needs no separator.
      const gap = /[a-zA-Z]$/.test(t.mac) && !NO_SPACE.has(t.next) &&
                  !SUP.has(t.next) && !SUB.has(t.next);
      out += gap ? ' ' : '';
      continue;
    }
    out += t.ch;
  }
  return out;
}

/** Return unknown non-ASCII characters as deduplicated {ch, cp} entries in source order. */
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

// Recognise a single-letter base: x_b and E_J qualify; snake_case and filenames do not.
// A code identifier such as g_form is ambiguous; callers should protect code spans.
const PROSE_SUB = /^([A-Za-zͰ-Ͽħℓ])_([A-Za-z0-9]{1,12}|Δ)(?![_A-Za-z0-9])/;

// Caret scripts accept short labels or numbers; the caller supplies attachment context.
const PROSE_SUP = /^\^([A-Za-z0-9.-]{1,14})/;
/** What a caller passes as `prev` after consuming a subscript or superscript. */
const SCRIPT_JUST_CONSUMED = '\u0000';

/**
 * Match {base, sub, length} at the start of s, or return null.
 * prev is the preceding plain-prose character, '' after other tokens or at the start,
 * and SCRIPT_JUST_CONSUMED after a script. This preserves identifiers and adjacent scripts.
 */
function proseSubscript(s, prev) {
  if (prev && /[A-Za-z_.]/.test(prev)) return null;
  const m = PROSE_SUB.exec(s);
  return m ? {base: m[1], sub: m[2], length: m[0].length} : null;
}

/**
 * Match {sup, length} at the start of s, or return null; exclude trailing '.' and '-'.
 * Use the same prev contract as proseSubscript. SCRIPT_JUST_CONSUMED allows x_a^2,
 * while an empty or whitespace prev rejects an unattached caret.
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
