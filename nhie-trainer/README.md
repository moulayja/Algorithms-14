# NHIE School

A daily-lesson study app for the National Home Inspector Examination, following
the two NHIE manuals (Volume 1 and Volume 2) chapter by chapter.

Each lesson: read the plain-words teaching, answer recall cards, then pass a
check quiz (80%). Passed lessons feed a spaced daily warm-up. A practice bank
and a timed exam simulator cover every chapter.

- `src/lessons/*.js` – lessons, one file per chapter, in book order.
- `src/questions/*.js` – extra practice questions per chapter.
- `src/app.js`, `src/styles.css`, `src/core.js` – the app.
- `tools/build.js` – bundles everything into `dist/nhie-trainer.html`.

```
node tools/build.js
```
