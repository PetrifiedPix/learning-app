/*
  Everything the app shows comes from this list.

  Add a topic:   make its file, then add ONE line to that subject's "topics".
  Add a subject: copy the Spanish block below, paste it after it, and change it.

  A topic is either
    - a flashcard/quiz file:  file: "subjects/<subject>/<name>.js"  (see README.md)
    - a saved study page:     page: "subjects/<subject>/pages/<name>.html"
  Topics with the same "group" are listed together under that heading.
  "short" (optional) is what the topic's tile shows, e.g. a unit number.
*/
window.SUBJECTS = [
  {
    id: "spanisch",          // used in the web address: …/#/spanisch
    name: "Spanisch",
    short: "Es",             // two letters on the subject's tile
    color: "#D46A6A",        // the subject's colour
    blurb: "Grammatik und Vokabeln aus Alegría 1 und 2",
    topics: [
      { id: "grammatik", group: "Deine Trainer", name: "Grammatik-Training", blurb: "15 Themen: Lernen, Üben, Prüfung, Generator, E-Mail", page: "subjects/spanish/pages/grammatik-training.html" },
      { id: "vokabeltrainer", group: "Deine Trainer", name: "Vokabeltrainer", blurb: "Alle Wörter mit Tippen, Anhören und Fehlerliste", page: "subjects/spanish/pages/vokabeltrainer.html" },

      { id: "a1-u1", short: "1", group: "Vokabeln · Alegría 1", name: "Unidad 1", blurb: "Hola, ¿qué tal?", file: "subjects/spanish/vokabeln/a1-u1.js" },
      { id: "a1-u2", short: "2", group: "Vokabeln · Alegría 1", name: "Unidad 2", blurb: "Schule & Klasse", file: "subjects/spanish/vokabeln/a1-u2.js" },
      { id: "a1-u3", short: "3", group: "Vokabeln · Alegría 1", name: "Unidad 3", blurb: "¡Vamos de tapas!", file: "subjects/spanish/vokabeln/a1-u3.js" },
      { id: "a1-u4", short: "4", group: "Vokabeln · Alegría 1", name: "Unidad 4", blurb: "Esta es mi familia", file: "subjects/spanish/vokabeln/a1-u4.js" },
      { id: "a1-u5", short: "5", group: "Vokabeln · Alegría 1", name: "Unidad 5", blurb: "En mi tiempo libre", file: "subjects/spanish/vokabeln/a1-u5.js" },
      { id: "a1-u6", short: "6", group: "Vokabeln · Alegría 1", name: "Unidad 6", blurb: "Un día en mi vida", file: "subjects/spanish/vokabeln/a1-u6.js" },
      { id: "a1-u7", short: "7", group: "Vokabeln · Alegría 1", name: "Unidad 7", blurb: "En mi ciudad o pueblo", file: "subjects/spanish/vokabeln/a1-u7.js" },
      { id: "a1-u8", short: "8", group: "Vokabeln · Alegría 1", name: "Unidad 8", blurb: "¡A comer!", file: "subjects/spanish/vokabeln/a1-u8.js" },
      { id: "a1-u9", short: "9", group: "Vokabeln · Alegría 1", name: "Unidad 9", blurb: "Est@s son mis amig@s", file: "subjects/spanish/vokabeln/a1-u9.js" },
      { id: "a1-u10", short: "10", group: "Vokabeln · Alegría 1", name: "Unidad 10", blurb: "Así vivimos", file: "subjects/spanish/vokabeln/a1-u10.js" },
      { id: "a2-u1", short: "1", group: "Vokabeln · Alegría 2", name: "Unidad 1", blurb: "¿Qué hacemos?", file: "subjects/spanish/vokabeln/a2-u1.js" },
      { id: "a2-u2", short: "2", group: "Vokabeln · Alegría 2", name: "Unidad 2", blurb: "De viaje", file: "subjects/spanish/vokabeln/a2-u2.js" },
    ],
  },
  {
    id: "geschichte",
    name: "Geschichte",
    short: "Ge",
    color: "#6F8FB3",
    blurb: "Die frühe Neuzeit: Stoff aus Zeitbilder 5/6",
    topics: [
      { id: "trainer", group: "Trainer", name: "Geschichte-Trainer", blurb: "Prüfungsfragen, Zuordnen, Zeitleiste und Lückentexte", page: "subjects/geschichte/pages/geschichte-trainer.html" },

      { id: "humanismus", short: "1", group: "Stoffgebiete · Frühe Neuzeit", name: "Humanismus und Renaissance", blurb: "ZB S. 112–115", file: "subjects/geschichte/humanismus.js" },
      { id: "fruehkapitalismus", short: "2", group: "Stoffgebiete · Frühe Neuzeit", name: "Frühkapitalismus", blurb: "ZB S. 118–119", file: "subjects/geschichte/fruehkapitalismus.js" },
      { id: "reformation", short: "3", group: "Stoffgebiete · Frühe Neuzeit", name: "Reformation und Gegenreformation", blurb: "ZB S. 122–123 und 128–131", file: "subjects/geschichte/reformation.js" },
      { id: "entdeckungen", short: "4", group: "Stoffgebiete · Frühe Neuzeit", name: "Zeitalter der Entdeckungen", blurb: "ZB S. 164–166", file: "subjects/geschichte/entdeckungen.js" },
      { id: "bauernkriege", short: "5", group: "Stoffgebiete · Frühe Neuzeit", name: "Die Bauernkriege", blurb: "ZB S. 124–125", file: "subjects/geschichte/bauernkriege.js" },
      { id: "dreissigjaehriger-krieg", short: "6", group: "Stoffgebiete · Frühe Neuzeit", name: "Der Dreißigjährige Krieg", blurb: "ZB S. 132–133", file: "subjects/geschichte/dreissigjaehriger-krieg.js" },

      { id: "jahreszahlen", group: "Überblick", name: "Jahreszahlen", blurb: "Alle wichtigen Daten von 1309 bis 1781", file: "subjects/geschichte/jahreszahlen.js" },
    ],
  },
];
