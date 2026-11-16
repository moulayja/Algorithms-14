// Registry that the lesson files and question files load into.
(function () {
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function question(topic, r, lesson) { return { id: topic + "-" + hash(r[0]), t: topic, q: r[0], a: r[1], e: r[2], l: lesson }; }
  window.NHIE = {
    bank: {},       // topic id -> every question for that chapter
    lessonBank: {}, // topic id -> lessons in book order
    questions: function (topic, rows) {
      this.bank[topic] = (this.bank[topic] || []).concat(rows.map(function (r) { return question(topic, r, null); }));
    },
    lessons: function (topic, list) {
      var qs = [];
      this.lessonBank[topic] = list.map(function (L, i) {
        var lesson = { i: i, topic: topic, t: L.t, p: L.p, goal: L.goal, teach: L.teach,
          cards: L.cards.map(function (c) { return { id: topic + "-c" + hash(c[0]), t: topic, l: i, f: c[0], b: c[1] }; }),
          qs: L.qs.map(function (r) { return question(topic, r, i); }) };
        qs = qs.concat(lesson.qs);
        return lesson;
      });
      this.bank[topic] = qs.concat(this.bank[topic] || []);
    }
  };
})();
