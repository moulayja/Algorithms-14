#!/usr/bin/env node
// Bundles the trainer into one self-contained page: dist/nhie-trainer.html
//   node tools/build.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const qdir = path.join(root, "src/questions");
const questions = fs.existsSync(qdir) ? fs.readdirSync(qdir).filter((f) => f.endsWith(".js")).sort().map((f) => read("src/questions/" + f)).join("\n") : "";
const ldir = path.join(root, "src/lessons");
const lessons = fs.readdirSync(ldir).filter((f) => f.endsWith(".js")).sort().map((f) => read("src/lessons/" + f)).join("\n");
const privFile = path.join(root, "src/private/scores.js");
const scores = fs.existsSync(privFile) ? fs.readFileSync(privFile, "utf8") : "";
const xdir = path.join(root, "src/extra");
const extra = fs.existsSync(xdir) ? fs.readdirSync(xdir).filter((f) => f.endsWith(".js")).sort().map((f) => read("src/extra/" + f)).join("\n") : "";
const html = `<meta charset="utf-8">
<title>NHIE School</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@500;600;700;800&display=swap">
<style>
${read("src/styles.css")}</style>
<main id="app"><div id="view"></div></main>
<nav class="tabs" aria-label="Sections"><div id="tabs"></div></nav>
<script>
${scores}
${read("src/core.js")}
${questions}
${lessons}
${extra}
${read("src/app.js").replace("  // ---------- actions ----------", read("src/teacher.js") + "\n  // ---------- actions ----------")}</script>
`;
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist/nhie-trainer.html"), html);
console.log("dist/nhie-trainer.html", Math.round(html.length / 1024) + " KB", "");
