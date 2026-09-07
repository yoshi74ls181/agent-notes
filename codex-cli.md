# Non-interactive Codex reviews

Use `codex exec` to run a review from a prompt and save the final response. Check the installed CLI before relying on an example:

```sh
codex --version
codex exec --help
```

The examples below use flags available in `codex-cli 0.153.4`. See the [official non-interactive guide](https://developers.openai.com/codex/noninteractive) for current behavior.

## Run and capture

From a shell with POSIX redirection:

```sh
codex exec -C /path/to/project -s read-only -o review.md - < prompt.txt
```

From PowerShell:

```powershell
Get-Content -Raw -Encoding utf8 prompt.txt | codex exec -C C:/path/to/project -s read-only -o review.md -
```

`-` reads the prompt from stdin; `-o` saves the final message. Use a separate output path for each review, check the process exit status, and confirm the file is non-empty. `--json` emits structured events when an automation needs progress or metadata. These output modes are described in the [official guide](https://developers.openai.com/codex/noninteractive).

## Define the review scope

State the audience, files or document version, questions to answer, and evidence expected for findings. Ask for coverage of the whole requested scope and distinguish confirmed errors from possible concerns.

For a review of supplied text, include the document in the prompt. An empty working directory outside the project reduces incidental project context; add `--skip-git-repo-check` there. **A working directory is not a read-access boundary.** Sandbox settings, configuration, instructions, and available tools determine access; consult the [security documentation](https://developers.openai.com/codex/security) when isolation is required.

## Optional controls

| Option | Purpose |
|---|---|
| `-m <MODEL>` | Choose a model available in the environment |
| `-c model_reasoning_effort=high` | Override effort when supported by that model |
| `-i figure.png` | Attach a figure for visual review |
| `--output-schema schema.json` | Constrain the final response to a schema |

Use rendered images when reviewing vector figures. Record the CLI version, input revision, and available runtime metadata with the findings; a model's self-description alone is not proof of its identity.

To continue a review, check `codex exec resume --help` and use the recorded session ID. Resume options can differ from those for a new run. Recheck findings against the current document after edits; quoted passages are more durable than line numbers alone.
