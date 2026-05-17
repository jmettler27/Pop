interface SubstringRange {
  startIdx: number;
  endIdx: number;
}

export function replaceAllNonSpace(str: string, c: string): string {
  return str.replace(/[^ ]/g, c);
}

export function replaceSubstrings(str: string, c: string, indices: SubstringRange[]): string {
  let result = str;

  // Sort indices in reverse order to avoid messing up the indices while replacing
  indices.sort((a, b) => b.startIdx - a.startIdx);

  for (const { startIdx, endIdx } of indices) {
    const substr = str.substring(startIdx, endIdx + 1);
    const replaced = replaceAllNonSpace(substr, c);
    result = result.substring(0, startIdx) + replaced + result.substring(endIdx + 1);
  }

  return result;
}

export function prependWithEmojiAndSpace(emoji: string, text: string): string {
  return emoji + ' ' + text;
}
