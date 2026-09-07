# Driving the Codex CLI as a non-interactive reader

How to run an OpenAI model from the command line as one of the readers in
[`report-editing-policy.md`](report-editing-policy.md)'s three-reader pass. The pass needs readers
2 and 3 to come from a **different model family** than reader 1, and this is one way to get one.
Nothing here is specific to any repository, and nothing here is the only way — any runner that can
take a prompt on stdin and write a reply to a file will do.

Verified against `codex-cli` **0.153.4**. Check `codex exec --help` before trusting a flag; this
CLI moves.

## Install and where its settings live

```bash
npm i -g @openai/codex        # provides `codex`
codex login                   # once, interactively
codex --version
```

Settings live in `$CODEX_HOME`, defaulting to `~/.codex`. Two files there matter:

- **`config.toml`** — sets `model` and `model_reasoning_effort` among others. These become your
  defaults, so an invocation that does not override them inherits whatever is in the file.
  `--ignore-user-config` skips it.
- **`$CODEX_HOME/AGENTS.md`** — read **regardless of the working root**, so it can leak
  instructions into a reader you meant to restrict. Check it is empty before relying on a
  restricted view. `--ignore-user-config` does *not* cover it.

## The shape you want

One invocation, prompt on stdin, reply into a file:

```bash
codex exec \
  -C /path/to/scratch --skip-git-repo-check -s read-only \
  -c model_reasoning_effort=high \
  -o /path/to/reader-output.md \
  - < /path/to/prompt.txt
```

`codex exec` is the non-interactive entry point (alias `codex e`). `-` reads the prompt from
stdin, which is what to use for anything long; passing a prompt argument *and* piping stdin
appends the stdin as a `<stdin>` block instead of replacing it.

## `-o` is the flag that matters

**`-o, --output-last-message <FILE>` writes the model's final message, and only that, to a file.**
Redirecting stdout instead gives you the startup banner, the reasoning stream and a token count
wrapped around the answer. In one run the final message was 3.6 kB and stdout was 77 kB.

Two consequences:

- **A file has no output limit, so ask for everything in one invocation.** Splitting a long
  answer into batches is only necessary when the reply comes back as a chat message.
- **`-o` overwrites and does not append.** For genuinely separate calls, write each to its own
  path and join them with a plain byte copy (`cat`) — never a shell heredoc, which mangles
  backslashes in whatever LaTeX the reader wrote.

`--json` streams events as JSONL if you need to watch progress; `--output-schema <FILE>` takes a
JSON Schema and constrains the shape of the final reply.

## Restricting what the reader can see

For a reader that is supposed to hold one document and nothing else:

- **`-C, --cd <DIR>`** sets the working root. Point it at an empty scratch directory *outside* the
  repository and the reader finds no `AGENTS.md` and no source to wander into. This is the part
  that actually enforces the restriction.
- **`--skip-git-repo-check`** is then required, because the scratch directory is not a git
  repository and `exec` refuses to start in one by default.
- **`-s read-only`** stops it writing anything even if it tries. The other values are
  `workspace-write` and `danger-full-access`.
- **Inline the document in the prompt** rather than naming a path, so the restriction holds over
  the content and not merely over the filesystem. Wrap it in `<document>` tags and number the
  lines with `cat -n` so the reader can cite them:

```bash
{ cat brief.txt; echo '<document>'; cat -n report.md; echo '</document>'; } > prompt.txt
```

Pointing a *repository-rooted* sandbox at a path outside itself is the thing that hangs. Moving
the reader's root with `-C` is a different operation and works.

## Images

**`-i, --image <FILE>`** attaches an image to the prompt, repeatable. Send raster renders of any
figure that exists only as vector art, since the reader cannot rasterise an SVG or a PDF itself:

```bash
pdftocairo -png -r 200 -singlefile figure.pdf figure     # -> figure.png
codex exec ... -i figure.png -i other.png - < prompt.txt
```

Attached images survive into a resumed session, so a session is worth continuing rather than
restarting.

## Model and reasoning effort

```bash
-m, --model <MODEL>                     # e.g. -m gpt-5.1-codex-max
-c model_reasoning_effort=high          # low | medium | high
```

**Set the reasoning effort explicitly.** It defaults from `config.toml`, and a config left at
`low` will quietly give you a shallow read. `-c` takes any dotted config key and parses the value
as TOML, falling back to a literal string.

## Continuing a session

```bash
codex exec resume <SESSION_ID> -c model_reasoning_effort=high -o out.md - < followup.txt
codex exec resume --last  ...                    # most recent session instead
```

The session id is printed in the startup banner (`session id: 01a0...`), so capture stdout on the
first call even when using `-o`.

**`resume` does not take the same flags as `exec`.** It rejects `-C` and `-s` with
`unexpected argument '-C' found`, because the working root and the sandbox belong to the session
and are inherited. `-c`, `-m`, `-i` and `-o` are accepted. Run `codex exec resume --help` rather
than assuming any of this.

## Verify which model actually answered

A wrapper or plugin can route a request meant for a foreign model back through the local family,
which silently destroys the point of having a second family read the document. Two checks, and do
both:

- **The banner** prints `model:`, `provider:`, `sandbox:`, `reasoning effort:` and the session id
  before the reply. Keep it.
- **Ask the reader, in the first line of the brief, to name its own model and runtime.** The
  give-away is a reader describing tools of its own rather than the foreign runtime.

Have the reader put that answer at the head of the document it writes, so the provenance travels
with the findings.

## Traps

- **It is slow.** A high-effort read of a long document runs for minutes. Start it in the
  background and do something else; do not poll it.
- **`-o` is silent about failure.** If the run dies the file may simply not appear, so check that
  it exists and is non-empty before treating the absence of findings as a clean bill of health.
- **The reply can be shorter than you asked for.** A reader told to review a long document may
  treat the first page or two exhaustively and stop. Say how much ground the reply must cover and
  that reaching the end matters more than completeness inside any one part.
- **Enterprise-managed settings can override what you pass.** An `approval_policy` of `never` was
  refused and replaced with `on-request`, with a warning on stderr and no failure. Read the
  warnings.
- **Line numbers in the reply go stale immediately**, because the document changes as findings are
  applied. Have the reader state which version it read, and cite the section number and the
  quoted sentence as well as the line.
