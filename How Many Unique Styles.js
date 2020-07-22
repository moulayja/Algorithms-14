
/*
There are many different styles of music and many albums exhibit multiple styles.
Create a function that takes an array of musical styles from albums and returns how many 
styles are unique.
*/

const uniqueStyles = array => {
    const flat = array.flatMap(stylesSet => stylesSet.split(','))
    return flat.reduce((acc, curr) => {
        if (acc.indexOf(curr) === -1) acc.push(curr)
        return acc
    }, []).length
}


