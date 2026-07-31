# Working on this repo

## Git: commit to `main`, always, without being asked

There are no feature branches and no pull requests here. Work goes onto `main`
and gets pushed. Do not open a PR, do not ask whether to open one, and do not
park finished work on a branch waiting for approval.

Do not wait to be told to commit, either. Finish a change, check it, commit it,
push it. "Push?" should never need to be asked.

If a session starts you on a `claude/*` branch, that is the harness's default,
not an instruction: fast-forward `main` onto the work and push `main`.

## Every push deploys

Pushing `main` does NOT update the live site. GitHub Pages serves
https://type37.github.io/a-billion-suns-shipyard/ from the `gh-pages` branch,
which only moves when somebody publishes a build. Source on `main` and a stale
site is the failure mode this rule exists to prevent: a change that is committed
but not deployed has not shipped, and the person who asked for it will look at
the site and correctly say they cannot see it.

So deploying is part of pushing, not a separate errand and not something to ask
about. Every time work lands on `main`, publish it (see "Deploying" in
README.md). Then say so.

## Before pushing

- `npm run typecheck`
- `npm test`
- `npm run build` if anything under `web/` changed

## Don't ask, decide

Questions that end "want me to?" are not wanted. If something is clearly part of
finishing the job - deploying, updating docs a change made wrong, cleaning up a
branch - do it and report it. Ask only when proceeding either way would be
genuinely unsafe or would waste real work if the guess is wrong.

## House style

The code carries long explanatory comments about *why* a thing is the way it is
- measured numbers, rulebook page references, approaches that were tried and
abandoned. Match that when you change something with a reason behind it; a
change that alters a documented decision should update the documentation of it
rather than leaving the old rationale sitting above new code.
