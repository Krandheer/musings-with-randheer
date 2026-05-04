# Setting up ESLint + Prettier + Husky + lint-staged in a TypeScript repo

A complete, repeatable recipe for adding **automated code quality** to a Node/TypeScript project. By the end, every commit will be auto-formatted and lint-checked before it can land in your repo.

This guide assumes you have **never set this up before**. Read it once, follow the steps, and you'll have a working setup. Bookmark it for the next repo.

---

## 1. Why are we doing this?

When several people work on a codebase, two problems show up quickly:

1. **Style drift** — one dev uses tabs, another uses 2-space indent, a third uses 4-space. PRs become a mess of formatting noise.
2. **Quality drift** — unused variables, accidental `any` types, `let` where `const` would do, missing returns. Each one is small; together they rot the codebase.

We solve both with four tools, each with a single job:

| Tool | Job | Runs when |
|---|---|---|
| **ESLint** | Catches code-quality bugs (unused vars, `prefer-const`, type misuses) | On demand + pre-commit |
| **Prettier** | Auto-formats code so style is mechanical, not debated | On demand + pre-commit |
| **Husky** | Lets us hook into Git events (e.g. "before commit, run X") | Every `git commit` |
| **lint-staged** | Runs tools only on the files you're actually committing (fast) | Inside the husky hook |

The flow we're building:

```
git commit
   │
   ▼
husky pre-commit hook fires
   │
   ▼
lint-staged finds your staged files
   │
   ▼
runs prettier --write   (auto-format)
runs eslint --fix       (auto-fix safe issues; fail on the rest)
   │
   ▼
if everything passes → commit succeeds
if anything fails    → commit blocked, you fix it, retry
```

---

## 2. Prerequisites

- Node.js 18+ and npm
- A git repository (`git init` if you haven't)
- An existing `package.json` (`npm init -y` if you haven't)
- TypeScript already configured (the recipe also works for plain JS — skip the TS-specific bits)

---

## 3. Install ESLint (modern flat config, ESLint v9+)

ESLint v9 uses a new "flat config" format (`eslint.config.mts` / `.js` / `.mjs`). Older repos may have `.eslintrc.json` — that's the legacy format. We use the new one because the official getting-started guide does.

### Install

```bash
npm init @eslint/config@latest
```

This is an interactive installer. Answer:

- **How would you like to use ESLint?** → "To check syntax, find problems"
- **What type of modules?** → "JavaScript modules (import/export)"
- **Which framework?** → "None of these" (or React/Vue if applicable)
- **Does your project use TypeScript?** → Yes
- **Where does your code run?** → Node (and Browser if applicable)
- **Install now?** → Yes

It creates `eslint.config.mts` and adds dev dependencies: `eslint`, `@eslint/js`, `globals`, `typescript-eslint`.

### Add npm scripts

In `package.json`, under `"scripts"`:

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix"
```

### Sanity check the generated config

Here's what a **correct** minimal config looks like:

```ts
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    // 1) Global ignores — must be its own object with ONLY `ignores`.
    //    If you put `ignores` inside another config block, it only filters that block.
    { ignores: ["node_modules/**", "dist/**", "build/**", "test/**"] },

    // 2) Main config block
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: {
            // Globals must be nested under `languageOptions.globals`.
            // A common mistake is spreading them directly into `languageOptions`.
            globals: { ...globals.node, ...globals.jest },
        },
        rules: {
            // Tweak rules to taste. Off / warn / error.
            "@typescript-eslint/no-explicit-any": "off",
        },
    },

    // 3) TypeScript recommended rules
    tseslint.configs.recommended,
]);
```

### Verify

```bash
npm run lint
```

You'll likely see lots of errors on existing code — that's normal. We'll deal with them in §7.

---

## 4. Install Prettier and integrate with ESLint

Prettier and ESLint overlap on **formatting** rules (indentation, quotes, semicolons). If both try to enforce style, they fight. The clean separation:

- **Prettier owns formatting** (how code looks)
- **ESLint owns code quality** (what code does)

Three packages do this:

| Package | Purpose |
|---|---|
| `prettier` | The actual formatter |
| `eslint-config-prettier` | Disables every ESLint rule that conflicts with Prettier |
| `eslint-plugin-prettier` | Runs Prettier *as an ESLint rule* so violations show up in `npm run lint` |

### Install

```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

### Configure Prettier — `.prettierrc.json`

Create at repo root:

```json
{
    "printWidth": 120,
    "tabWidth": 4,
    "useTabs": false,
    "semi": true,
    "singleQuote": false,
    "trailingComma": "es5",
    "bracketSpacing": true,
    "arrowParens": "always",
    "endOfLine": "lf"
}
```

These match the dominant style of this repo (4-space indent, double quotes, semicolons, 120-char lines). Adjust for yours — the important thing is that **everyone agrees and it's enforced by tooling, not humans**.

### Tell Prettier what to skip — `.prettierignore`

```
node_modules
dist
build
test
package-lock.json
*.md
```

### Wire Prettier into ESLint — update `eslint.config.mts`

```ts
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
    { ignores: ["node_modules/**", "dist/**", "build/**", "test/**"] },
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: {
            globals: { ...globals.node, ...globals.jest },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
    tseslint.configs.recommended,

    // Order matters! prettierConfig must come AFTER tseslint so it can disable
    // any conflicting rules tseslint enabled.
    prettierConfig,

    // Then enable the prettier-as-a-rule plugin so violations show up in lint.
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { prettier: prettierPlugin },
        rules: {
            "prettier/prettier": "error",
        },
    },
]);
```

**Why the order matters:** `prettierConfig` turns off ESLint's stylistic rules. If you put it before `tseslint.configs.recommended`, the typescript rules might re-enable some of them. Prettier-config goes last among the rule blocks.

### Add format scripts

In `package.json` `"scripts"`:

```json
"format": "prettier --write \"**/*.{ts,mts,cts,js,mjs,cjs,json}\"",
"format:check": "prettier --check \"**/*.{ts,mts,cts,js,mjs,cjs,json}\""
```

### Verify

```bash
npm run format:check    # should report which files need formatting
npm run lint            # prettier violations now show up here too
```

---

## 5. Install Husky (Git hooks)

Husky lets you run scripts on Git events. We only care about `pre-commit` here.

### Install

```bash
npm install --save-dev husky
npx husky init
```

`husky init` does three things:

1. Creates `.husky/` directory with a sample `pre-commit` hook
2. Adds `"prepare": "husky"` to `package.json` scripts
3. Sets `git config core.hooksPath .husky/_` so Git looks in this folder for hooks

The `prepare` script is important — it re-runs `husky` automatically after `npm install`, so a teammate who clones your repo gets the hooks set up without doing anything special.

### Verify it's wired up

```bash
git config core.hooksPath
# should print: .husky/_
```

If it prints nothing or a different path, run `npx husky init` again.

---

## 6. Install lint-staged and wire everything together

`lint-staged` runs commands only on **staged** files (the ones in `git add`). Without it, every commit would re-lint your entire codebase — slow and pointless.

### Install

```bash
npm install --save-dev lint-staged
```

### Configure — add to `package.json` (top level, NOT under `scripts`)

```json
"lint-staged": {
    "*.{ts,mts,cts,js,mjs,cjs}": [
        "prettier --write",
        "eslint --fix"
    ],
    "*.json": "prettier --write"
}
```

Things to know:

- An array means **run in order**. Prettier first (formats), then ESLint (catches quality issues on the now-clean code).
- Use the **top level** of `package.json`, not nested inside `"scripts"`. A common mistake is misspelling the key (`"lint-stages"`) or putting it in the wrong place — both will silently do nothing.
- The glob is matched against staged file paths, not run as a shell command, so don't use shell wildcards.

### Wire husky's pre-commit hook to call lint-staged

Edit `.husky/pre-commit` so it contains exactly:

```sh
npx lint-staged
```

**Common mistake:** writing `npm lint-staged` (not a real command) or `npm run lint-staged` (no such script). Use `npx lint-staged`.

### Verify the full pipeline

```bash
# 1. Make a deliberately ugly change to a TS file (bad indent, missing semi, etc.)
# 2. Stage it:
git add path/to/file.ts

# 3. Try to commit:
git commit -m "test"

# What should happen:
#   - lint-staged runs prettier --write (file gets reformatted, re-staged)
#   - lint-staged runs eslint --fix (auto-fixes safe issues)
#   - if any unfixable error remains → commit blocked
#   - otherwise → commit succeeds with the cleaned-up file
```

---

## 7. What to do about the existing mess

The first time you turn this on in an established repo, `npm run lint` will explode with hundreds of errors. Don't panic — they were always there, you just couldn't see them.

You have two options:

### Option A — clean baseline (recommended)

Format and auto-fix everything in one pass, commit the result, then move on.

```bash
npm run format        # reformats everything per .prettierrc.json
npm run lint:fix      # auto-fixes safe ESLint issues (prefer-const, etc.)
npm run lint          # shows what's left
```

Manually fix the rest, or downgrade specific noisy rules to `"warn"` for now and tighten them later. Commit as one big "lint baseline" PR — reviewers can skim it because the diff is mechanical.

### Option B — soft baseline

Downgrade noisy rules to `"warn"` in `eslint.config.mts`. New code gets held to the standard via `lint-staged` (because `eslint --fix` only touches staged files), and existing legacy code stays as-is.

Either way, **the pre-commit hook only checks files you're staging**, so legacy errors never block your day-to-day commits.

---

## 8. Will this break my build or deploy?

No. Lint and build are independent pipelines:

- **Build** (`tsup`, `tsc`, `webpack`, etc.) cares about *type and syntax* correctness. It does not run ESLint.
- **Deploy** (`cdk deploy`, `serverless`, etc.) runs the build artifact. It does not run ESLint.
- **Pre-commit hook** (lint-staged) only runs on `git commit` and only on staged files.

The only ways lint can block you:

1. You explicitly add `npm run lint` to your build/CI pipeline (you should, eventually — see §10).
2. You stage a file with errors and try to commit it.

---

## 9. Final file checklist

After all the steps, your repo should have:

```
.husky/
    pre-commit              # contains: npx lint-staged
.prettierrc.json            # Prettier config
.prettierignore             # Prettier ignore list
eslint.config.mts           # ESLint config (flat config, v9+)
package.json                # has scripts + lint-staged + devDependencies
```

And in `package.json`:

```json
{
    "scripts": {
        "lint": "eslint .",
        "lint:fix": "eslint . --fix",
        "format": "prettier --write \"**/*.{ts,mts,cts,js,mjs,cjs,json}\"",
        "format:check": "prettier --check \"**/*.{ts,mts,cts,js,mjs,cjs,json}\"",
        "prepare": "husky"
    },
    "lint-staged": {
        "*.{ts,mts,cts,js,mjs,cjs}": [
            "prettier --write",
            "eslint --fix"
        ],
        "*.json": "prettier --write"
    },
    "devDependencies": {
        "@eslint/js": "...",
        "eslint": "...",
        "eslint-config-prettier": "...",
        "eslint-plugin-prettier": "...",
        "globals": "...",
        "husky": "...",
        "lint-staged": "...",
        "prettier": "...",
        "typescript-eslint": "..."
    }
}
```

---

## 10. Going further (optional)

Once the basics are stable, consider:

- **CI gate** — add `npm run lint && npm run format:check` to your GitHub Actions workflow so PRs that bypass the local hook still get caught.
- **`commit-msg` hook with commitlint** — enforce conventional commit messages.
- **`pre-push` hook** — run `npm test` before pushing so you don't push a broken branch.
- **Editor integration** — install the Prettier + ESLint extensions in VS Code and enable "format on save". Now formatting happens as you type, not at commit time.
- **Tighten rules over time** — start permissive, tighten after each cleanup pass. Going strict on day one will frustrate the team.

---

## 11. Quick troubleshooting

| Symptom | Likely cause |
|---|---|
| Commit goes through with no checks | husky not installed (`npx husky init`), or `core.hooksPath` not set |
| `npx lint-staged` says "no staged files matching configured tasks" | The `lint-staged` config is missing or in the wrong place in `package.json` |
| ESLint errors out on `globals` not being registered | Globals nested incorrectly — must be `languageOptions.globals` |
| `eslint .` walks into `node_modules` or `dist` | `ignores` is inside another config block instead of its own top-level object, or has leading `/` in patterns |
| Prettier and ESLint disagree on indentation | `eslint-config-prettier` not loaded, or loaded before `tseslint.configs.recommended` |
| Hook runs but does nothing | `.husky/pre-commit` contains `npm lint-staged` instead of `npx lint-staged` |

---

## 12. Recap — replicating this in a new repo

A condensed sequence to copy/paste:

```bash
# 1. ESLint
npm init @eslint/config@latest        # follow prompts

# 2. Prettier
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
# create .prettierrc.json + .prettierignore (copy from §4)
# update eslint.config.mts to add prettierConfig + prettier plugin (copy from §4)

# 3. Husky
npm install --save-dev husky
npx husky init

# 4. lint-staged
npm install --save-dev lint-staged
# add lint-staged config to package.json (copy from §6)
# replace .husky/pre-commit contents with: npx lint-staged

# 5. Add npm scripts (copy from §9)

# 6. Verify
npm run lint
npm run format:check
git commit --allow-empty -m "test hook"   # should run lint-staged
```

That's it. Same recipe, every repo.
