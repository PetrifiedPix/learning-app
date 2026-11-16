# 6a Lernübungen

A static study site for a class (6a), hosted free on GitHub Pages:
https://petrifiedpix.github.io/learning-app (repo `PetrifiedPix/learning-app`, branch `main`).
Plain HTML/CSS/JS with **no build step**. The interface is **German**, but talk to
the user in **English** and keep explanations beginner-friendly. The user is a
student on slow internet, not a developer.

- `index.html` loads `subjects/index.js` (the list of subjects and topics) and `assets/app.js`.
- Design rules: `DESIGN.md` (calm, professional, soft colours, no "AI-looking" or paid-product tropes).
- How topics work: `README.md`.

## When the user sends an artifact (claude.ai link or .html file)

They'll usually just paste one or more links. Do all of this without asking,
unless the subject or topic is genuinely unclear:

1. **Read it** with the Artifact tool (`action: "read"`), then save the page
   file with `action: "read", path: "index.html"` and copy it into the repo.
   For a dropped `.html` file, read it before using it.
2. **Decide where it goes** from its content: which subject (Spanish,
   English, Maths…) and a short German name.
   - Existing subject: put it in `subjects/<subject-folder>/pages/<slug>.html`.
   - New subject: add a block to `subjects/index.js` (copy the Spanish block)
     with a new `id`, `name`, two-letter `short`, a soft muted `color` (no
     orange), a `blurb`, and a folder `subjects/<id>/pages/`.
3. **Add one line** to that subject's `topics` in `subjects/index.js`:
   ```js
   { id: "<slug>", group: "Übungsseiten", name: "<German name>", blurb: "<what it practises, one line>", page: "subjects/<folder>/pages/<slug>.html" },
   ```
   The `id` must be unique within the subject (it's part of the URL).
   Use the group "Deine Trainer" for Spanish to match the existing ones.
4. **Optional, when the artifact holds a clean word list:** also add native
   flashcard topics (`subjects/<folder>/<name>.js` with
   `addTopic({ labels: [...], cards: [[front, back, note?], ...] })`). This is
   how the Alegría units in `subjects/spanish/vokabeln/` were made.
5. **Check it** in the preview (`.claude/launch.json` → "site", port 8791;
   the browser pane can't load scripts over `file://`). Open
   `#/<subject>/<id>` at phone width.
6. **Publish:** commit only the files you added or changed, then `git push`.
   GitHub Pages updates in about a minute, and phones may cache the old
   version for up to 10 minutes. Tell the user the direct link:
   `https://petrifiedpix.github.io/learning-app/#/<subject>/<id>`.

Artifacts often use `window.claude` (AI features). Those only work on
claude.ai, so check that the page still works without them and tell the user
if a feature won't work on the site.

## Commands

- GitHub CLI: `gh` (or `~/.local/bin/gh`), logged in as PetrifiedPix.
- Preview server: `python3 -m http.server 8791` from the repo root.
- There are no tests or build. Check in the browser at 375px and desktop, in light and dark.
