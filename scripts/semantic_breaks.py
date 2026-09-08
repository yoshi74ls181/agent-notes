"""Reflow markdown and script comments to one sentence per line.

Unwraps hard-wrapped prose, then breaks after every sentence. Verbatim blocks
-- fenced code, tables, headings, indented code, HTML comments, display maths
-- are passed through untouched.

Run with --check to see every proposed break and the content-preservation
verdict without writing anything.
"""
import io
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# The only abbreviation in this corpus, plus the usual suspects, so that the
# tool stays correct if the corpus grows.
ABBREV = [
    "e.g.", "i.e.", "cf.", "et al.", "vs.", "etc.", "Fig.", "Eq.", "Ref.",
    "approx.", "incl.", "no.", "Dr.", "Mr.", "Ms.", "St.", "Phys.", "Rev.",
    "Appl.", "Lett.", "Nat.", "Commun.", "Sci.", "Ann.", "Condens.", "Mater.",
    "Res.", "Instrum.", "Technol.", "Supercond.", "Am.", "J.", "Sect.",
]
PROTECT = "\x00%d\x01"
NLCHAR = chr(10)
NLJOIN = chr(10)


def _protect(text):
    """Hide spans a sentence break must not fall inside."""
    keep = []

    def stash(m):
        keep.append(m.group(0))
        return PROTECT % (len(keep) - 1)

    # Inline code first: it can contain anything, including full stops.
    text = re.sub(r"`[^`]*`", stash, text)
    # Link and image destinations.
    text = re.sub(r"\]\([^)]*\)", stash, text)
    # Ellipses, then abbreviations.
    text = re.sub(r"\.\.\.", stash, text)
    for a in ABBREV:
        text = text.replace(a, stash(re.match(r"(?s).*", a)))
    return text, keep


def _restore(text, keep):
    for i, v in enumerate(keep):
        text = text.replace(PROTECT % i, v)
    return text


# A sentence ends at . ! or ?, optionally followed by closing markup, then
# whitespace, then something that can open a sentence.
SPLIT = re.compile(
    r"(?<=[.!?])([*_`'\")\]]*)[ \t]+(?=[A-Z\"'`(\[*_§“])")

# A bare section or version number -- "10.1." -- is not a sentence end.
NUMBERY = re.compile(r"(?:§|\b)\d+(?:\.\d+)*[*_`'\")\]]*$")


def _inside_quote(body, upto):
    """True if a double quote opened before `upto` and has not closed.

    A quotation can hold sentences of its own, and the sentence doing the
    quoting is still one sentence: `One chain read "A per gate. This is 3.2
    times B", whose product is C` must not be broken at the inner full stop,
    or the line holds a fragment with a dangling quote. Quotes inside inline
    code are already hidden by `_protect`.
    """
    seg = body[:upto]
    return (seg.count('"') % 2 == 1
            or seg.count("“") > seg.count("”"))


def split_sentences(text):
    """One sentence per element, on already-unwrapped text."""
    body, keep = _protect(" ".join(text.split()))
    out, last = [], 0
    for m in SPLIT.finditer(body):
        head = body[last:m.end(1)]
        if NUMBERY.search(head) or _inside_quote(body, m.end(1)):
            continue
        out.append(head)
        last = m.end()
    out.append(body[last:])
    return [_restore(p, keep) for p in out if p.strip()]


FENCE = re.compile(r"^\s*(```|~~~)")
HEADING = re.compile(r"^\s*#{1,6}\s")
TABLE = re.compile(r"^\s*\|")
HRULE = re.compile(r"^\s*([-*_])(\s*\1){2,}\s*$")
HTMLCOM = re.compile(r"^\s*<!--")
BULLET = re.compile(r"^(\s*)([-*+]|\d+\.)(\s+)(.*)$")

# CommonMark lets an ordered list interrupt a paragraph only when it starts at
# 1, so a mid-paragraph line beginning "81. And where ..." is prose that a hard
# wrap happened to break in front of a number -- which is exactly what one
# hard-wrapped paragraph of `report-editing-policy.md` did. Reading it as a
# list item indented the sentence after it and changed the block structure.
# Inside a list, a marker other than 1 is a real next item, so the test is on
# the enclosing block, not on the marker alone -- and it has to survive the
# blank line and indented continuation paragraphs between two items of a long
# list, which is what §10 of `report-editing-policy.md` is made of. A first
# version tested only "is a paragraph open", and swallowed items 2 to 8 of that
# list, each of which follows a continuation paragraph indented to the item's
# content column. A list ends at a heading, a rule, or a paragraph back at
# column zero.
ORDERED = re.compile(r"^\d+\.$")
QUOTE = re.compile(r"^(\s*>(?: |$))(.*)$")   # "> " or a bare ">", never ">="
INDENTED = re.compile(r"^ {4,}\S")
DISPLAY = re.compile(r"^\s*\$\$")


def reflow_markdown(src):
    lines = src.split("\n")
    out, breaks = [], []
    i, in_fence, fence_tok = 0, False, None
    in_list = False    # a list is open; see ORDERED
    para = []          # (kind, prefix, cont_prefix, [text lines])

    def flush():
        if not para:
            return
        kind, prefix, cont, buf = para[0]
        sents = split_sentences(" ".join(buf))
        if len(sents) != len(buf):
            breaks.append(sents)
        for n, s in enumerate(sents):
            out.append((prefix if n == 0 else cont) + s)
        del para[:]

    while i < len(lines):
        line = lines[i]
        if FENCE.match(line):
            tok = FENCE.match(line).group(1)
            if not in_fence:
                flush()
                in_fence, fence_tok = True, tok
            elif tok == fence_tok:
                in_fence = False
            out.append(line)
            i += 1
            continue
        if in_fence:
            out.append(line)
            i += 1
            continue
        if (not line.strip() or HEADING.match(line) or TABLE.match(line)
                or HRULE.match(line) or HTMLCOM.match(line)
                or DISPLAY.match(line) or INDENTED.match(line)):
            if line.strip() and not INDENTED.match(line):
                in_list = False
            flush()
            out.append(line)
            i += 1
            continue
        mq = QUOTE.match(line)
        if mq:
            if not (para and para[0][0] == "quote" and para[0][1] == mq.group(1)):
                flush()
                para.append(("quote", mq.group(1), mq.group(1), []))
            para[0][3].append(mq.group(2))
            i += 1
            continue
        mb = BULLET.match(line)
        if mb and ORDERED.match(mb.group(2)) and mb.group(2) != "1." \
                and para and para[0][0] == "para" and not in_list:
            mb = None      # a wrapped number, not a list; see ORDERED
        if mb:
            in_list = True
            flush()
            ind, mark, gap, rest = mb.groups()
            para.append(("item", ind + mark + gap,
                         ind + " " * (len(mark) + len(gap)), [rest]))
            i += 1
            continue
        if para:
            para[0][3].append(line.strip())
        else:
            if not line[:1].isspace():
                in_list = False
            # Keep the paragraph's own indent on every sentence of it. A
            # continuation paragraph of a list item sits at the item's content
            # column, which is 3 for a "1. " marker and so below INDENTED's
            # four; dropping it to column zero takes the paragraph out of the
            # item and ends the list.
            ind = line[:len(line) - len(line.lstrip())]
            para.append(("para", ind, ind, [line.strip()]))
        i += 1
    flush()
    return "\n".join(out), breaks


LINE_COMMENT = re.compile(r"^(\s*)//( ?)(.*)$")
BANNER = re.compile(r"^\s*//\s*[-=*]{3,}")


def reflow_js(src):
    """Reflow // runs and /* */ blocks; leave code alone."""
    lines = src.split("\n")
    out, breaks = [], []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = LINE_COMMENT.match(line)
        if m and not BANNER.match(line):
            ind, sp, _ = m.groups()
            buf = []
            while i < len(lines):
                mm = LINE_COMMENT.match(lines[i])
                if not mm or mm.group(1) != ind or BANNER.match(lines[i]):
                    break
                buf.append(mm.group(3).strip())
                i += 1
            sents = split_sentences(" ".join(buf))
            if len(sents) != len(buf):
                breaks.append(sents)
            for s in sents:
                out.append("%s//%s%s" % (ind, sp or " ", s))
            continue
        # A block comment, single or multi line.
        if "/*" in line and not line.strip().startswith("*"):
            start = i
            chunk = [line]
            while "*/" not in chunk[-1]:
                i += 1
                if i >= len(lines):
                    break
                chunk.append(lines[i])
            i += 1
            out.extend(reflow_block_comment(chunk, breaks))
            continue
        out.append(line)
        i += 1
    return "\n".join(out), breaks


def reflow_block_comment(chunk, breaks):
    """Reflow one /* */ comment, keeping everything about it that carries meaning.

    Three things inside a comment are not prose and must survive byte for
    byte: a blank line, which separates paragraphs; a line indented past the
    comment prefix, which in these scripts is aligned tabular material and
    becomes nonsense when joined into a sentence; and a single-line comment
    holding a single sentence, which is already compliant and only churns if
    it is expanded to three lines.

    An earlier version got all three wrong -- it merged a usage synopsis into
    the prose beneath it, flattened a two-row table of subscript examples into
    one run of words, and expanded every one-line JSDoc in the file.
    """
    raw = NLJOIN.join(chunk)
    m = re.match(r"^(\s*)(/\*+)(.*?)(\*/)\s*$", raw, re.S)
    if not m:
        return chunk
    ind, open_tok, inner, close_tok = m.groups()
    multiline = NLCHAR in raw

    # Strip the " * " prefix, but remember which lines were indented past it.
    rows = []
    for line in inner.split(NLCHAR):
        text = re.sub(r"^\s*\*+", "", line)
        verbatim = bool(re.match(r"^\s\s+\S", text))
        rows.append((verbatim, text.rstrip() if verbatim else text.strip()))

    # Group into runs: prose paragraphs, verbatim lines, and blank separators.
    runs, cur = [], None
    for verbatim, text in rows:
        kind = "blank" if not text.strip() else ("verb" if verbatim else "prose")
        if kind == "prose" and cur and cur[0] == "prose":
            cur[1].append(text)
            continue
        cur = [kind, [text]]
        runs.append(cur)

    while runs and runs[0][0] == "blank":
        runs.pop(0)
    while runs and runs[-1][0] == "blank":
        runs.pop()
    if not any(k == "prose" for k, _ in runs):
        return chunk

    out_rows, changed = [], False
    for kind, texts in runs:
        if kind == "blank":
            out_rows.append(None)
        elif kind == "verb":
            out_rows.extend(texts)
        else:
            sents = split_sentences(" ".join(texts))
            if len(sents) != len(texts):
                breaks.append(sents)
                changed = True
            out_rows.extend(sents)

    if not changed:
        return chunk
    if not multiline and len(out_rows) == 1:
        return chunk

    res = ["%s%s" % (ind, open_tok if multiline else "/**")]
    for r in out_rows:
        res.append("%s *" % ind if r is None
                   else ("%s *%s" % (ind, r) if r.startswith(" ")
                         else "%s * %s" % (ind, r)))
    res.append("%s %s" % (ind, close_tok))
    return res


def words(text):
    """Every visible word, for the content-preservation check on markdown.

    Line-leading blockquote markers are stripped first, because the number of
    them changes legitimately when a wrapped quote is reflowed to one sentence
    per line. Nothing else is stripped: an earlier version also stripped a
    leading run of asterisks, on the reasoning that block comments use them as
    a prefix, and it silently deleted the opening ** of every markdown line
    beginning in bold -- which in these notes is most paragraph leads, so the
    check reported content loss on files that were reflowed perfectly. The
    scripts get their own comparison in `js_parts`.

    Strip only a marker that markdown would read as one -- `>` followed by a
    space or the end of the line, matching `QUOTE`. An earlier version stripped
    any leading run of `>`, which ate the first character of a wrapped line
    beginning `>= 15, evaluated over ...` and so hid a real corruption: the
    reflow was reading that continuation line as a blockquote and the word
    check, having normalised `>=` to `=` on both sides, called it unchanged.
    """
    return re.findall(r"\S+", re.sub(r"(?m)^[ \t]*(?:>(?: |$))+", "", text))


def js_parts(text):
    """Split a script into (code lines, comment prose words).

    A global word list is the wrong check for a script: reflowing a comment
    legitimately moves the // and */ delimiters, which shifts every later
    token and reports a difference where there is none. Splitting the file
    instead proves the two things that matter separately -- that no code line
    moved at all, and that no comment word was lost.
    """
    code, prose, in_block = [], [], False
    for line in text.split("\n"):
        stripped = line.strip()
        if in_block:
            body = re.sub(r"\*/\s*$", "", stripped)
            body = re.sub(r"^\*+ ?", "", body)
            prose += re.findall(r"\S+", body)
            if "*/" in stripped:
                in_block = False
            continue
        if stripped.startswith("/*"):
            body = stripped
            if "*/" in stripped:
                body = re.sub(r"^/\*+|\*/$", "", stripped)
            else:
                body = re.sub(r"^/\*+", "", stripped)
                in_block = True
            prose += re.findall(r"\S+", body)
            continue
        if stripped.startswith("//"):
            prose += re.findall(r"\S+", stripped[2:])
            continue
        code.append(line)
    return code, prose


def main():
    check = "--check" in sys.argv
    targets = [a for a in sys.argv[1:] if not a.startswith("--")]
    total_breaks, failures = 0, []
    for path in targets:
        src = io.open(path, encoding="utf-8").read()
        fn = reflow_js if path.endswith(".js") else reflow_markdown
        new, breaks = fn(src)
        if path.endswith(".js"):
            ca, pa = js_parts(src)
            cb, pb = js_parts(new)
            if ca != cb:
                bad = next((k for k in range(min(len(ca), len(cb)))
                            if ca[k] != cb[k]), None)
                failures.append("%s: CODE CHANGED at code line %s: %r -> %r"
                                % (path, bad, ca[bad] if bad is not None else "",
                                   cb[bad] if bad is not None else ""))
                continue
            if pa != pb:
                bad = next((k for k in range(min(len(pa), len(pb)))
                            if pa[k] != pb[k]), min(len(pa), len(pb)))
                failures.append("%s: COMMENT PROSE CHANGED near %r / %r"
                                % (path, " ".join(pa[max(0, bad-4):bad+4]),
                                   " ".join(pb[max(0, bad-4):bad+4])))
                continue
            print("  %-34s %3d lines -> %3d, %3d blocks reflowed, "
                  "%d code lines byte-identical, %d comment words preserved"
                  % (os.path.basename(path), len(src.split("\n")),
                     len(new.split("\n")), len(breaks), len(ca), len(pa)))
            if not check:
                io.open(path, "w", encoding="utf-8", newline="\n").write(new)
            total_breaks += len(breaks)
            continue
        q_old = len(re.findall(r"(?m)^\s*>(?: |$)", src))
        q_new = len(re.findall(r"(?m)^\s*>(?: |$)", new))
        if q_new > q_old:
            failures.append("%s: gained %d blockquote line(s) -- a wrapped "
                            "line starting with '>' was read as a quote"
                            % (path, q_new - q_old))
            continue
        if words(src) != words(new):
            a, b = words(src), words(new)
            diff = next((k for k in range(min(len(a), len(b))) if a[k] != b[k]),
                        min(len(a), len(b)))
            failures.append("%s: CONTENT CHANGED (%d words -> %d) near %r / %r"
                            % (path, len(a), len(b),
                               " ".join(a[max(0, diff-4):diff+4]),
                               " ".join(b[max(0, diff-4):diff+4])))
            continue
        total_breaks += len(breaks)
        print("  %-34s %3d lines -> %3d, %3d blocks split, content preserved"
              % (os.path.basename(path), len(src.split("\n")),
                 len(new.split("\n")), len(breaks)))
        if check:
            for sents in breaks:
                for s in sents:
                    print("        | %s" % s[:110])
                print("        +")
        else:
            io.open(path, "w", encoding="utf-8", newline="\n").write(new)
    if failures:
        print("\n".join(failures))
        return 1
    print("\n%d blocks would be split" % total_breaks if check
          else "\n%d blocks split" % total_breaks)
    return 0


if __name__ == "__main__":
    sys.exit(main())
