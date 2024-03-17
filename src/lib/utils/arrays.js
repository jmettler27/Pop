export function arrayToCommaSeparatedString(array) {
    if (array.length === 0) {
        return ''
    }
    return array.slice(0, array.length).join(', ')
}

export function getNextCyclicIndex(currentIndex, listLength) {
    return (currentIndex + 1) % listLength;
}

// Fisher-Yates Sorting Algorithm
export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array.slice();
}

export function range(n) {
    return Array.from({ length: n }, (_, i) => i)
}

export function getRandomElement(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

export function getRandomIndex(array) {
    return Math.floor(Math.random() * array.length);
}

export function moveToHead(elem, array) {
    const index = array.indexOf(elem);
    if (index > -1) {
        array.splice(index, 1);
    }
    array.unshift(elem);
    return array;
}

export function isEmpty(array) {
    return array.length === 0;
}