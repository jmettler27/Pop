import { range, shuffle } from "../arrays";

// Matching

export const MATCHING_TITLE_EXAMPLE = "Link these houses of Westeros to their seat"
export const MATCHING_TITLE_MAX_LENGTH = 75

export const MATCHING_NOTE_EXAMPLE = ""
export const MATCHING_NOTE_MAX_LENGTH = 500

export const MATCHING_ANSWER_EXAMPLE_2 = [
    { 0: "Targaryen", 1: "Dragonstone" },
    { 0: "Stark", 1: "Winterfell" },
    { 0: "Lannister", 1: "Casterly Rock" },
    { 0: "Arryn", 1: "Eyrie" },
    { 0: "Tully", 1: "Riverrun" },
    { 0: "Greyjoy", 1: "Pyke" },
    { 0: "Baratheon", 1: "Storm's End" },
    { 0: "Tyrrell", 1: "Highgarden" },
    { 0: "Martell", 1: "Sunspear" },
]

export const MATCHING_ANSWER_EXAMPLE_3 = [
    { 0: "Tom Hardy", 1: "Bane", 2: "The Dark Knight Rises (2012)" },
    { 0: "Aaron Eckhart", 1: "Harvey Dent", 2: "The Dark Knight (2008)" },
    { 0: "Katie Holmes", 1: "Rachel Dawes", 2: "Batman Begins (2005)" },
    { 0: "Kim Basinger", 1: "Vicki Vale", 2: "Batman (1989)" },
    { 0: "Joaquin Phoenix", 1: "Arthur Fleck", 2: "Joker (2019)" },
    { 0: "George Clooney", 1: "Bruce Wayne", 2: "Batman & Robin (1997)" },
    { 0: "Danny DeVito", 1: "The Penguin", 2: "Batman Returns (1992)" },
    { 0: "Jim Carrey", 1: "Edward Nigma/Sphinx", 2: "Batman Forever (1995)" },
    { 0: "Zoe Kravitz", 1: "Selina Kyle", 2: "The Batman (2022)" },
    { 0: "Jeremy Irons", 1: "Alfred Pennyworth", 2: "Batman v Superman (2016)" }
]


export const MATCHING_MIN_NUM_COLS = 2;
export const MATCHING_MAX_NUM_COLS = 3;

export const MATCHING_MIN_NUM_ROWS = 5;
export const MATCHING_MAX_NUM_ROWS = 10;

export const MATCHING_ITEM_MAX_LENGTH = 30;

export const MATCHING_DEFAULT_MISTAKE_PENALTY = 1;
export const MATCHING_MAX_NUM_MISTAKES = 3;

export const MATCHING_THINKING_TIME = 40


/* In-game logic */
export function shuffleMatching(numCols, numRows) {
    const rowIndices = range(numRows); // [0, 1, 2, ..., numRows - 1]
    return new Array(numCols).fill(0).map(() =>
        shuffle(rowIndices)
    )
}

export function randomMatch(numCols, numRows) {
    return Array.from({ length: numCols }, () => Math.floor(Math.random() * numRows));
}

export function generateMatch(numRows, numCols, incorrectMatches, correctMatchIndices) {
    // Convert to a Set for efficient lookup
    const incorrectMatchesSet = new Set(incorrectMatches.map(match => match.join(',')));
    const correctMatchIndicesSet = new Set(correctMatchIndices);

    let newMatch;

    do {
        newMatch = randomMatch(numCols, numRows);
    } while (
        newMatch.some(index => correctMatchIndicesSet.has(index)) ||
        incorrectMatchesSet.has(newMatch.join(',')));

    return newMatch;
}


// From a JS array of 3 elements, I want to calculate the largest sub-sequence of same values and return
//-  the array of indices of those values
// - The value itself
// For instance, if the array is [4, 0, 0] the result should be [1, 2] and 4. If the array is [8, 8, 3] the result should be [0, 1] and 8.
// If the array is [4, 9,4] the result should be [0, 2] and 4
// If the array is [0, 4, 75] the result should be [] and null
export function findMostFrequentValueAndIndices(arr) {
    const indicesByValue = arr.reduce((acc, value, index) => {
        if (!acc[value]) {
            acc[value] = [];
        }
        acc[value].push(index);
        return acc;
    }, {});

    let mostFrequentValue = null;
    let mostFrequentIndices = [];

    for (const [value, indices] of Object.entries(indicesByValue)) {
        if (indices.length > mostFrequentIndices.length) {
            mostFrequentValue = Number(value);
            mostFrequentIndices = indices;
        }
    }

    if (mostFrequentIndices.length > 1) {
        return [mostFrequentIndices, mostFrequentValue];
    }
    return [[], null];
}


import { getNodeText } from "@/app/(game)/[id]/components/middle-pane/question/matching/gridUtils";

export function edgesToString(edges, answer) {
    const uniqueStringsSet = new Set();
    edges.forEach(edge => {
        uniqueStringsSet.add(edge.from);
        uniqueStringsSet.add(edge.to);
    });
    const uniqueEdges = Array.from(uniqueStringsSet);

    const leftToRightPath = uniqueEdges.sort((a, b) => {
        const aCol = parseInt(a.split('_')[1]);
        const bCol = parseInt(b.split('_')[1]);
        return aCol - bCol;
    });

    return leftToRightPath.map(id => getNodeText(id, answer)).join(' - ')
}

export function matchingTeamIsCanceled(teamId, teamNumMistakes, maxMistakes) {
    return teamId in teamNumMistakes && teamNumMistakes[teamId] >= maxMistakes;
}