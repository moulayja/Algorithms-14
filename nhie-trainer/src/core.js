// Registry that the question files and the book data load into.
window.NHIE = {
  bank: {},
  books: null,
  questions: function (topic, rows) {
    this.bank[topic] = rows.map(function (r) {
      var h = 5381, s = r[0];
      for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
      return { id: topic + "-" + h.toString(36), t: topic, q: r[0], a: r[1], e: r[2] };
    });
  }
};
