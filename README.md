# 6a Lernübungen

A free study website for class: pick a subject, then a topic, then study with
flashcards or a quiz. It's a plain website with nothing to install, so it works
on any phone or computer.

## Try it on your computer

Double-click `index.html`. That's it.

## Add a new topic (for example, Spanish Unidad 3 of Alegría 2)

1. Make a file such as `subjects/spanish/vokabeln/a2-u3.js`:

   ```js
   addTopic({
     labels: ["Spanisch", "Deutsch"],
     cards: [
       ["el perro", "der Hund"],
       ["la casa", "das Haus", "a note shown on the back (optional)"],
     ],
   });
   ```

2. Add one line to that subject's `topics` in `subjects/index.js`:

   ```js
   { id: "a2-u3", group: "Vokabeln · Alegría 2", name: "Unidad 3", blurb: "…", file: "subjects/spanish/vokabeln/a2-u3.js" },
   ```

A quiz gets built from the cards automatically. To write your own quiz questions
with explanations, add `questions` to the file:

```js
questions: [
  { q: "Mi madre ___ profesora.", options: ["es", "está", "hay"], answer: "es", explain: "Beruf → ser." },
],
```

## Add a saved study page (for example, a Claude artifact)

Save the page as an `.html` file in `subjects/<subject>/pages/`, then add a line
with `page:` instead of `file:`:

```js
{ id: "mein-quiz", group: "Deine Trainer", name: "Mein Quiz", blurb: "…", page: "subjects/spanish/pages/mein-quiz.html" },
```

## Add a new subject

In `subjects/index.js`, copy the whole Spanish block (from `{` to `},`), paste it
below, and change `id`, `name`, `short` (two letters), `color` and `topics`. Put
its files in a new folder such as `subjects/englisch/`.

The design rules are in `DESIGN.md`.
