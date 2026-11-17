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

## Teacher

A Teacher tab is a chat tutor. It asks Claude through the artifact's `sample` capability, so it only works when the page is opened in Claude by a signed-in user. Each question is sent with the matching lesson notes from `src/lessons`. Answers come back in plain words and can include a labeled SVG diagram, which is cleaned before it is shown. Lessons also have "Explain it simpler", "Draw me a picture" and "Read it to me" (text to speech) buttons, and a missed quiz question has an "Ask the teacher why" button. The code is in `src/teacher.js`; the build script inserts it into `app.js`.

## Focus mode

If `src/private/scores.js` exists (it is git-ignored, so personal score data never reaches the public repo), the build includes it as `window.NHIE_SCORES`: one entry per exam attempt with the 19 exam-area percentages from the score report. The app then ranks chapters (top priority: an area under 60% on the last exam or on the weighted average; next: under 70%), puts top-priority lessons first in Today's class, weights the smart session toward weak chapters, adds a Focus session (about 70% top priority, 30% next), marks Focus chapters on the Study page, and shows the score history on the Progress page. Focus can be turned off from Today.
