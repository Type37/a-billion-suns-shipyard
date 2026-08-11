# A Billion Suns 2e Shipyard

A fleet builder for **A Billion Suns, 2nd Edition** (Mike Hutchinson / Osprey Games).

**Live:** https://type37.github.io/a-billion-suns-shipyard/

Pick an era and a faction, build a legal Fleet List or stock a Shipyard, give it
an emblem, then play from it, print it or share it. Static site: everything runs
in the browser and your lists are stored locally.

## What's in it

- Three eras: Armageddon, Age of Unity, Hypergrowth
- Twelve factions, and a Foundry for your own
- Rules validation
- Play Mode
- Printable roster
- Share links
- Fleet Sync
- Learn to Play, and the Rules
- Solo play: Junkspace
- Ship Compendium
- Quick Reference PDF

## Running locally

Node ≥ 22.6.

```bash
npm install
npm run dev       # http://localhost:5731
```

Before pushing:

```bash
npm run typecheck
npm test
npm run build     # if anything under web/ changed
```

## Layout

```
src/            Rules engine. Framework-free, tested, no DOM.
  types.ts        Domain model
  validation.ts   validateFleet() — the list-building rules
  data/           Faction rosters, HVP, training fleets, solo content
test/           node --test suites for the engine

web/            The browser app (Vite root). One store, one render(),
                no framework — see HANDOFF.md before changing it.
```

## Deploying

Pushing `main` does **not** update the live site. GitHub Pages serves from the
**`gh-pages`** branch and only moves when a build is published:

```bash
npm run build
cd dist
touch .nojekyll
git init && git checkout -b gh-pages
git add -A && git commit -m "Deploy"
git push -f https://github.com/Type37/a-billion-suns-shipyard.git gh-pages
rm -rf .git
```

`base: "./"` in `vite.config.ts` keeps asset paths relative so the site works
from the Pages subpath. The CDN can take a few minutes to flip.

## Contributing

[HANDOFF.md](HANDOFF.md) is the working document: architecture, the house rules
about naming and verbatim rules text, and what has recently changed.

---

*A Billion Suns is © Mike Hutchinson, published by Osprey Games. This is an
unofficial fan-made tool. Shipyard by [WarLore](https://linktr.ee/warlore).*
