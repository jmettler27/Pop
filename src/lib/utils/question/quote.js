/* Quote */
export const QUOTE_EXAMPLE = "I'm Commander Shepard, and this is my favorite store on the Citadel."
export const QUOTE_MAX_LENGTH = 300;

export const QUOTE_SOURCE_EXAMPLE = "Mass Effect 2"
export const QUOTE_SOURCE_MAX_LENGTH = 50

export const QUOTE_AUTHOR_EXAMPLE = "Commander Shepard"
export const QUOTE_AUTHOR_MAX_LENGTH = 50

export const QUOTE_GUESSABLE_PARTS = ['source', 'author', 'quote']


export function replaceAllNonSpace(str, c) {
    return str.replace(/[^ ]/g, c);
}

export function replaceSubstrings(str, c, indices) {
    let result = str;

    // Sort indices in reverse order to avoid messing up the indices while replacing
    indices.sort((a, b) => b.startIdx - a.startIdx);

    for (let { startIdx, endIdx } of indices) {
        const substr = str.substring(startIdx, endIdx + 1);
        const replaced = replaceAllNonSpace(substr, c);
        result = result.substring(0, startIdx) + replaced + result.substring(endIdx + 1);
    }

    return result;
}