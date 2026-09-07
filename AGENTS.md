---
ward:
  workflow: pull-request-and-merge
---
# Agent instructions

Workspace conventions load globally via `~/.claude/CLAUDE.md` -> `agentic-os-kai/AGENTS.md`. This file covers only what is specific to this repo.

---

`src/about.njk` is one of the sync targets for `src/pages/resume.md`'s intro
paragraphs (see the parent `AGENTS.md` for the full sync list). Direct-to-main
per the workspace git workflow, no PR.

---

## Post-push follow-up (auto-schedule)

Per the workspace "Default to proactive scheduling" rule: after pushing to
`main`, schedule a wake-up to verify the test workflow passed. The site itself
is built and served externally (Eleventy plus static hosts). Forgejo Actions
cover tests, image publication, mirroring, and trufflehog. They do not own the
Netlify or Kubernetes rollout.

- **Cadence**: 300s after push.
- **Verify CI**: `aosguard ops forgejo tasks list coilysiren website --limit 2`
  should show `completed/success` for the test and staging-image publish jobs.
  Re-schedule once at +180s if either is in progress. Surface and stop on
  failure.
- **Skip** for trivia (typo fixes, content-only edits where Cypress smoke is irrelevant).
- **Site deploy verification** is out of scope here. Netlify and the deploy
  repository own their respective rollout health. This repository proves the
  Eleventy output and staging image contract before the push.
- **Production is not `main`.** Netlify builds the GitHub `release` branch,
  fast-forwarded from `main` once a day at 12:00 UTC, so a merge is not live
  for up to a day and that lag is deliberate cost control rather than a stall.
  Two seats once spent an hour treating it as an incident. Before filing one,
  read [docs/deploy.md](docs/deploy.md); the early-publish verb lives in
  infrastructure.

## Commands

Route every dev command through the [`justfile`](justfile) (run verbs with `just <verb>`). The lockdown denies bare invocations of the underlying tools (`npm`, `npx`, etc.). Add new verbs to that file before invoking them.

## Checkout residency

This repo is resident under `~/projects/coilyco-flight-deck/website`, selected by the
frontend role in agentic-os-kai's `.agents/roles.kdl`, so the fleet pass keeps
the checkout pulled. Work it in a native session shadow like any other resident
repo, and commit and push before pausing, switching tasks, or ending a session.
The remote is the durable artifact.

## See also

- [README.md](README.md) - human-facing intro.
- [docs/FEATURES.md](docs/FEATURES.md) - inventory of what ships today.
- [justfile](justfile) - dev verbs.
- [.ward/ward.yaml](.ward/ward.yaml) - catalog metadata only. Agents route through ward, not bare `make` / `uv` / `python` / `npm` / `cargo` / `dotnet`.

Cross-reference convention from [coilyco-bridge/agentic-os-kai#313](https://github.com/coilyco-bridge/agentic-os-kai/issues/313).

<!-- BEGIN managed by agentic-os/scripts/apply-git-workflow.py -->
### Git workflow

**This repo runs the `pull-request-and-merge` lane**, declared as `ward.workflow` in this file's frontmatter. The agent commits to a task branch, pushes it, opens a Forgejo pull request, and **merges that pull request itself** once it is green. The author of the code is the one who merges it. Opening the pull request is a step, never the stopping point.

The fleet runs two lanes, and both authorize the same core actions:

* `merge-remote-main` - the agent commits, pushes to `main`, and closes the issue. No branch and no pull request.
* `pull-request-and-merge` - the agent commits to a task branch, pushes it, opens a pull request, and merges that pull request itself once it is green.

**Every lane slug names what the AGENT does, never what someone else does.** `pull-request-and-merge` carries the merge because the agent that authored the code merges its own pull request. `pull-request` drops `-and-merge` because the author stops at the pull request and the director merge lane takes over. Reading `pull-request-and-merge` as "someone else merges it later" inverts the two lanes and leaves finished work sitting unmerged.

**These actions are pre-authorized on every lane, and the agent MUST take them without asking first.** Committing, creating a branch, pushing a branch, pushing the lane's own destination, and opening a pull request are ordinary reversible work, not the destructive wall that earns a question. Stopping to ask is how a turn ends with the work stranded in a dirty worktree.

* **ALWAYS commit** in-scope work and **ALWAYS push** it to the canonical remote before pausing, reporting a checkpoint, handing off, or ending a turn. A local-only commit is not a checkpoint.
* **ALWAYS open the pull request** in the same turn as the branch's first push, on every lane except `remote-branch-only`. A pushed branch with no pull request is litter nobody reviews.
* **NEVER `--no-verify`** and **NEVER force-push**. Those two are the real walls, and they stay closed.
* **ALWAYS merge your own pull request on `pull-request-and-merge`**, in the same turn, as soon as it is green. Reporting it as open and awaiting someone is the failure this lane exists to prevent.
* **NEVER merge on `pull-request` or `remote-branch-only`.** Those two stop where they stop, and the director merge lane carries a `pull-request` from there.
<!-- END managed by agentic-os/scripts/apply-git-workflow.py -->
