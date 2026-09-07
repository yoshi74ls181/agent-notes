# Driving the Codex CLI as a non-interactive reader

Run an OpenAI model as a reader in the
[`report-editing-policy.md`](report-editing-policy.md) three-reader pass. Readers 2 and 3 must
come from a different model family than reader 1. Any runner accepting stdin and saving a
final response can serve the same role.

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

**`-o, --output-last-message <FILE>` saves the final message.** Progress normally goes to stderr
and the final message to stdout; `--json` changes stdout to an event stream.
See the [official non-interactive guide](https://developers.openai.com/codex/noninteractive).

- **Request the full review in one invocation**, but check that it covers the requested scope;
  writing to a file does not remove model output limits.
- **`-o` overwrites rather than appends.** Use separate paths for separate calls. If joining
  outputs, use a byte copy (`cat`) rather than a shell heredoc that can alter backslashes.

`--json` streams events as JSONL if you need to watch progress; `--output-schema <FILE>` takes a
JSON Schema and constrains the shape of the final reply.

## Restricting what the reader can see

For a reader that is supposed to hold one document and nothing else:

- **`-C, --cd <DIR>`** sets the working root. An empty scratch directory outside the repository
  avoids incidental project context, but does not enforce a read-access boundary.
- **`--skip-git-repo-check`** allows that non-repository working directory.
- **`-s read-only`** restricts model-generated shell writes; it does not restrict reads to the
  working directory. Use environment access controls if strict isolation is required.
- **Inline the document in the prompt**, wrapped in `<document>` tags, and number the lines
  with `cat -n` so the reader can cite them:

```bash
{ cat brief.txt; echo '<document>'; cat -n report.md; echo '</document>'; } > prompt.txt
```

## Images

**`-i, --image <FILE>`** attaches an image and is repeatable. Supply raster renders of vector
figures so review does not depend on the reader's conversion tools:

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

**Set reasoning effort explicitly** rather than inheriting an unintended `config.toml` default.
`-c` accepts dotted config keys, parsing values as TOML with a literal-string fallback.

## Continuing a session

```bash
codex exec resume <SESSION_ID> -c model_reasoning_effort=high -o out.md - < followup.txt
codex exec resume --last  ...                    # most recent session instead
```

Capture the session ID from runtime output or JSONL events on the first call, even when using
`-o` for the final message.

**`resume` does not take the same flags as `exec`.** It rejects `-C` and `-s` with
`unexpected argument '-C' found`, because the working root and the sandbox belong to the session
and are inherited. `-c`, `-m`, `-i` and `-o` are accepted. Run `codex exec resume --help` rather
than assuming any of this.

## Verify which model actually answered

Check runtime provenance when using a different model family; wrappers may route requests.
Use both checks:

- **The banner** prints `model:`, `provider:`, `sandbox:`, `reasoning effort:` and the session id
  before the reply. Keep it.
- **Ask the reader, in the first line of the brief, to name its own model and runtime.** The
  give-away is a reader describing tools of its own rather than the foreign runtime.

Record provenance at the head of the findings. Treat the model's self-description as a
cross-check, not proof of identity.

## Traps

- **Allow time for long reviews.** High-effort reads can take minutes; use the runner's background
  or wait mechanism.
- **Check completion, and wait on the process rather than polling for the file.** `-o` writes
  the output only when the run finishes, so an absent file means "not done yet" and never
  "nothing came back". Wait for the runner to exit and read its exit status; a review was
  once abandoned as having produced nothing, and three substitute runs were launched, when
  the original had in fact completed and written its whole reply. A failed run does leave no
  output file, so check the file exists and is non-empty **after** the process has exited.
- **Ask for whole-document coverage.** A reader may exhaust its response on the opening pages.
- **Read configuration warnings.** Managed settings can override requested values.
- **Cite section numbers and quote passages; record the input version.** Include line numbers
  for the reviewed version, but expect them to change as findings are applied.
