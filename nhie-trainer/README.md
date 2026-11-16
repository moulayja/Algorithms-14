# NHIE Trainer

A study app for the National Home Inspector Examination: lessons, flashcards,
438 practice questions with explanations, spaced review, and a timed exam simulator.

- `src/questions/*.js` – the question bank, one file per subject. Each entry is
  `[question, [correct, wrong, wrong, wrong], explanation]`.
- `src/app.js`, `src/styles.css` – the app.
- `tools/extract_books.py` – turns your own study books into `data/books.json`
  (lesson text and flashcards). That file is personal study material and is not
  committed.
- `tools/build.js` – bundles everything into `dist/nhie-trainer.html`.

```
python3 tools/extract_books.py <folder with the books> data/books.json   # optional
node tools/build.js
```

Open `dist/nhie-trainer.html` in a browser. Without `data/books.json` the page
still has every practice question and the exam simulator.
