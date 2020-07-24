
/*

The additive persistence of an integer, n, is the number of times you have to replace n with the sum of its digits until n becomes a single digit integer.

The multiplicative persistence of an integer, n, is the number of times you have to replace n with the product of its digits until n becomes a single digit integer.

Create two functions that take an integer as an argument and:

Return its additive persistence.
Return its multiplicative persistence

*/

function additivePersistence(n) {
	let count=0;
	while(String(n).length>1){
		n=[...String(n)].reduce((a, b)=>+a + +b);
		count++;
	}
	return count;
}

function multiplicativePersistence(n) {
	let count=0;
	while(String(n).length>1){
		n=[...String(n)].reduce((a, b)=>+a * +b);
		count++;
	}
	return count;
}