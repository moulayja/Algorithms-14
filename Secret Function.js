
/*
Create a function based on the input and output. Look at the examples, there is a pattern.
*/

function secret(num) {
    let firstStep = (""+num).split("");
      return Math.pow(Number(firstStep[0]), Number(firstStep[1]))-(Number(firstStep[0])*Number(firstStep[1]))
  }
  