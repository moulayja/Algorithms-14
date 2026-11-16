#!/usr/bin/env node
// Bundles the trainer into one self-contained page: dist/nhie-trainer.html
//   node tools/build.js
// data/books.json (lesson text and flashcards, made by tools/extract_books.py) is
// bundled when present; without it the page still has every practice question.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const qdir = path.join(root, "src/questions");
const questions = fs.readdirSync(qdir).filter((f) => f.endsWith(".js")).sort().map((f) => read("src/questions/" + f)).join("\n");
const booksPath = path.join(root, "data/books.json");
const books = fs.existsSync(booksPath) ? "NHIE.books = " + read("data/books.json").replace(/<\/script/gi, "<\\/script") + ";" : "";
const html = `<meta charset="utf-8">
<title>NHIE Trainer</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap">
<style>
${read("src/styles.css")}</style>
<main id="app"><div id="view"></div></main>
<nav class="tabs" aria-label="Sections"><div id="tabs"></div></nav>
<script>
${read("src/core.js")}
${questions}
${books}
${read("src/app.js")}</script>
`;
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist/nhie-trainer.html"), html);
console.log("dist/nhie-trainer.html", Math.round(html.length / 1024) + " KB", books ? "(with lessons)" : "(questions only)");
