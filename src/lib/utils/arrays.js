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

export function aggregateTiedTeams(uniqueScores, scores) {
    return uniqueScores.slice().map(score => {
        const tiedTeams = Object.keys(scores).filter(tid => scores[tid] === score);
        const shuffledTiedTeams = shuffle(tiedTeams);
        return { score, teams: shuffledTiedTeams };
    });
}

export function findNextAvailableChooser(chooserIdx, chooserOrder, canceled) {
    const canceledSet = new Set(canceled); // Convert canceled array to a Set for faster lookups

    let newChooserIdx = chooserIdx
    let newChooserTeamId = chooserOrder[chooserIdx]

    do {
        newChooserIdx = getNextCyclicIndex(newChooserIdx, chooserOrder.length)
        newChooserTeamId = chooserOrder[newChooserIdx]
    } while (canceledSet.has(newChooserTeamId))

    return { newChooserIdx, newChooserTeamId };
}