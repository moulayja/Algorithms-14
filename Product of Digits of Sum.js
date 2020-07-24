
/*
Create a function that takes numbers as arguments, adds them together,
and returns the product of digits until the answer is only 1 digit long.
*/

let prod = n => n < 10 ? n : prod(+String(n).split('').reduce((a,b)=>a*b));
let sumDigProd = (...arr) => prod(arr.reduce((a,b)=>a+b));