# 6a Lernübungen — design system

A study app made by a student for their classmates. It should look
**professional and calm**, like a well-made tool, without looking like a
product that wants your money, and without the tells of generated design. The
**start screen** is a quiet "Heute" overview built from your real progress.
**Every other screen is minimal**, so studying stays focused. Gentle motion
makes it feel alive.

It must open quickly on a phone over slow internet, so it uses **no web fonts,
no images and no libraries**. Everything is the system font, CSS and a little
JavaScript.

> Direction note: this was decided from Apple's Human Interface Guidelines and
> the student's feedback (no orange or beige, nothing "AI-looking", nothing
> that looks paid, softer colours). No real reference sites were compared,
> because the UXKIN library wasn't connected.

Tokens live as CSS variables in `assets/style.css`. Pages use the names, never
raw values.

**Language:** the interface is in German, because the class and its study
material are German-speaking. Code and comments stay in English.

## What to avoid (looks generated or paid)

- Big dark marketing hero, centered headline with a gradient, glass effects
- Pill "Get started" buttons, sales copy, "for everyone, on any device" lines
- Emoji as icons, sparkle icons, purple or indigo by default
- Decoration that pretends to be personal (fake handwriting, stickers, tape)

Instead: left-aligned text, real numbers, plain words and one restrained accent.

## Color

Soft greys, **slate ink** for main actions and **sage green** as the one gentle
accent. Each subject also has its own muted **tint** (Spanish is a soft red).

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#F7F8FA` | `#111317` | Page background |
| `--surface` | `#FFFFFF` | `#181B21` | Cards, rows, flashcards |
| `--surface-2` | `#F0F2F5` | `#20242B` | Pressed rows, segmented control, tracks |
| `--border` / `--border-strong` | `#E4E7EC` / `#D0D5DD` | `#2A2F37` / `#3A404A` | Hairlines; hover edges |
| `--text` | `#1D2330` | `#ECEEF2` | Main text |
| `--text-2` | `#667085` | `#9AA1AD` | Secondary text and labels (≥ 4.5:1 on bg) |
| `--primary` | `#2E3646` | `#A9CDBD` | Main buttons, focus ring, selected state |
| `--on-primary` | `#FFFFFF` | `#12201A` | Text on primary |
| `--accent` | `#7BA696` | `#8DB8A6` | Sage: progress bars without a subject |
| `--accent-soft` / `--on-accent-soft` | `#EAF2EE` / `#2F5446` | `#1C2A25` / `#CFE5DA` | Chips (best scores), the Wort des Tages card |
| `--success` | `#3E8E66` | `#6CC497` | Correct answers |
| `--error` | `#C8564B` | `#E8877D` | Wrong answers, "Noch nicht" |
| `--success-bg` / `--error-bg` | 10% / 8% tints | 14% tints | Answer feedback backgrounds |
| subject `color` | set in `subjects/index.js` | same | Subject tile and progress (Spanish `#D46A6A`) |

There are no gradients anywhere. Colour always means something: slate means
"do this", green means right, red means wrong, and the tint shows the subject.

## Typography

One family, the device's system font (`-apple-system`, `Segoe UI`, `Roboto`,
`system-ui`): it looks native on every phone and downloads nothing. Headings
get weight 700 and tight letter-spacing (−0.02 to −0.03em).

| Token | Size / line height | Use |
|---|---|---|
| `--fs-xs` | 13 / 18 | Captions, labels, counts |
| `--fs-sm` | 15 / 22 | Secondary text |
| `--fs-md` | 17 / 26 | Body text and buttons (the iOS body size) |
| `--fs-lg` | 20 / 28 | Long flashcard text |
| `--fs-xl` | 26 / 32 | Quiz prompts, stat numbers |
| `--fs-2xl` | 34 / 40 | Page titles |
| `--fs-3xl` | 44 / 48 | Score on the results screen |
| home title | 36–48, fluid | "Heute" on the start screen |

Text stays at 16px or larger, and reading columns stay at or under 680px.

## Spacing and layout

- 4-based scale: `--s-1` 4, `--s-2` 8, `--s-3` 12, `--s-4` 16, `--s-5` 24,
  `--s-6` 32, `--s-7` 48, `--s-8` 64.
- 16px side gutter on phones and 24px from 640px up.
- Study screens use a 680px column. The start screen is 960px wide, in two
  columns from 800px.
- The safe areas on notched phones are respected at the top and bottom.

## Shape and depth

- Radius: `--r-sm` 12, `--r-md` 16 (rows, cards), `--r-lg` 22 (flashcard,
  Wort des Tages), and pill for buttons, chips and the segmented control.
- A single soft `--shadow-card`, used for flashcards and on hover. Everything
  else is flat with a 1px border.

## Components

- **Start screen** (`#/`):
  - top row with a small "6a" brand mark and "Lernübungen" on the left, today's
    date on the right
  - large "Heute" with the line "Vokabeln und Grammatik für die nächste
    Schularbeit."
  - a **stats strip** with three real numbers from this device: Themen geübt,
    Offene Fehler, Bestes Quiz
  - **Weiterlernen**, a card for the last topic with an "Öffnen" button (only
    once you've studied something)
  - **Fächer**, one row per subject with tile, description, progress bar and
    count
  - **Wort des Tages**, a sage card you can flip (the same word for everyone
    that day)
- **Top bar**: 52px tall and sticky, with a back button (chevron plus the
  parent's name). A small title fades in once you scroll. Study sessions show
  **Close (×)** instead.
- **List rows**: at least 72px tall and tappable across the whole row, with a
  tile or icon, title, description and chevron.
- **Buttons**: pill shaped and 52px tall. There's primary (slate), secondary
  (surface plus border) and "Noch nicht" (surface with red text). Press scales
  to 0.98, and focus shows a 3px primary ring.
- **Segmented control**: a pill track for the direction (Spanisch → Deutsch).
- **Flashcard**: a big card. Tap or press Space to flip; "Noch nicht" and
  "Gewusst" are pinned at the bottom.
- **Quiz options**: numbered rows 56px or taller. The right answer turns
  green, a wrong pick turns red, a short explanation appears, and "Weiter"
  is pinned at the bottom.
- **Empty and error states**: one plain sentence with what to do next.

## Icons and imagery

No emoji and no photos. Subjects use a two-letter tile in their tint, and
units show their number. There are a few inline SVG line icons (stroke 1.75,
`currentColor`).

## Motion

The easing is always `--ease` (`cubic-bezier(.2,.7,.2,1)`): it starts quick and
settles softly.

- **Start screen:** items rise 10px and fade in one after another, 70ms
  apart. Progress bars grow from the left, and stat numbers count up from 0.
- **Screens:** pushing slides 16px in and fades (240ms); going back slides
  the other way.
- **Flashcards:** each new card rises in (320ms), and flipping is a 3D turn
  (450ms).
- **Quiz:** answer options rise in 45ms apart. The right answer gives a small
  pop, a wrong pick gives a short shake, and the explanation fades up.
- **Results:** the score and list rise in.
- **Hover:** cards lift 1–2px with a soft shadow.
- With `prefers-reduced-motion`, every animation and transition is turned off.

---

## Screen flow (planned with the SwiftUI flows skill, built as a web app)

Goal: **from opening the app to studying in two taps.** It needs no account,
no permissions and no payment. Progress is saved on the device.

1. **Home: overview** (`#/`). See the start screen above. Tap a subject, or
   "Weiterlernen".
2. **Subject: choose a part** (`#/spanisch`)
   - Back to Home. Topics are listed under group headings ("Deine Trainer",
     "Vokabeln · Alegría 1"…), with word counts or best scores. Unit tiles
     show the unit number.
   - Empty state: "Hier gibt es noch keine Themen."
3. **Topic: choose how to study** (`#/spanisch/a1-u3`)
   - The modes are **Karteikarten** (rounds of 20 random words in big units),
     **Quiz**, and **Fehler üben** once there are missed words. The direction
     toggle sits below them.
   - A **saved study page** (one of the student's own trainers) skips this
     screen and opens full height inside the app, with a "Vollbild" link.
   - Error state: the topic file couldn't load, with which file to check.
4. **Session: study** (`#/spanisch/a1-u3/karten`, `/quiz` or `/fehler`)
   - Shown like a full-screen modal. **Close (×)** goes back and asks first
     if you're more than a few answers in. Progress sits at the top and
     actions at the bottom.
   - Keyboard: Space flips, 1 is "Noch nicht", 2 is "Gewusst", 1–4 answer
     the quiz, Enter continues, and Esc closes.
5. **Results** (inside the session)
   - Shows the score and what to review. Buttons are **Fehler üben** or
     **Neue Runde** plus **Fertig** for cards, and **Nochmal** plus
     **Fertig** for the quiz. The best score and missed words are saved on
     the device.

**Back behaviour.** Every screen has one parent. The browser or phone back
gesture and the on-screen back button both go up one level, even when a link
was opened directly (for example, shared with a classmate).
