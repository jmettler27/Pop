/**
 * Replace all non-space characters with a given character
 * 
 * @param {string} str - The string to replace characters in
 * @param {string} c - The character to replace non-space characters with
 * 
 * @returns {string} The string with all non-space characters replaced with the given character
 */
export function replaceAllNonSpace(str, c) {
    return str.replace(/[^ ]/g, c);
}

/**
 * Replace all substrings in a string with a given character
 * 
 * @param {string} str - The string to replace characters in
 * @param {string} c - The character to replace non-space characters with
 * @param {Array<{startIdx: number, endIdx: number}>} indices - The indices of the substrings to replace
 * 
 * @returns {string} The string with all substrings replaced with the given character
 */
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

/**
 * Prepend a string with an emoji and a space
 * 
 * @param {string} emoji - The emoji to prepend
 * @param {string} text - The text to prepend
 * 
 * @returns {string} The string with the emoji and space prepended
 */
export function prependWithEmojiAndSpace(emoji, text) {
    return emoji + " " + text
}