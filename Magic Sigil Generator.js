
/*

A magic sigil is a glyph which represents a desire one wishes to manifest in their lives. There are many ways to create a sigil, but the most common is to write out a specific desire (e.g. "I HAVE WONDERFUL FRIENDS WHO LOVE ME"), remove all vowels, remove any duplicate letters and then design a glyph from what remains.

Using the sentence above as an example, we would remove duplicate letters:

AUFRINDSWHLOVME
And then remove all vowels, leaving us with:

FRNDSWHLVM

*/

function sigilize(str) {
	str = [...str].reverse().join("").toUpperCase();
  return [...new Set(str.replace(/[aeiou ]/ig,""))].reverse().join("");
}

