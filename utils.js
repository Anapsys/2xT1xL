function myArrayShuffle(array) {
    let currentIndex = array.length,  randomIndex;
    let arrayCopy = [...array];
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [arrayCopy[currentIndex], arrayCopy[randomIndex]] = [
        arrayCopy[randomIndex], arrayCopy[currentIndex]];
    }
  
    return arrayCopy;
}

module.exports = { myArrayShuffle };