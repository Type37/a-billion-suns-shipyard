# Working on this repo

## Git: commit to `main`, always, without being asked

There are no feature branches and no pull requests here. Work goes onto `main`
and gets pushed. Do not open a PR, do not ask whether to open one, and do not
park finished work on a branch waiting for approval.

Do not wait to be told to commit, either. Finish a change, check it, commit it,
push it. "Push?" should never need to be asked.

If a session starts you on a `claude/*` branch, that is the harness's default,
not an instruction: fast-forward `main` onto the work and push `main`.

## Before pushing

- `npm run typecheck`
- `npm test`
- `npm run build` if anything under `web/` changed

## House style

The code carries long explanatory comments about *why* a thing is the way it is
- measured numbers, rulebook page references, approaches that were tried and
abandoned. Match that when you change something with a reason behind it; a
change that alters a documented decision should update the documentation of it
rather than leaving the old rationale sitting above new code.
