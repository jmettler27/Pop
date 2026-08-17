import { Scores } from '@/models/scores';

export function getNextCyclicIndex(currentIndex: number, listLength: number): number {
  return (currentIndex + 1) % listLength;
}

// Fisher-Yates Sorting Algorithm
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.slice();
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export function getRandomElement<T>(array: readonly T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export function getRandomIndex(array: unknown[]): number {
  return Math.floor(Math.random() * array.length);
}

export function moveToHead<T>(elem: T, array: T[]): T[] {
  const index = array.indexOf(elem);
  if (index > -1) {
    array.splice(index, 1);
  }
  array.unshift(elem);
  return array;
}

export function isEmpty(array: unknown[]): boolean {
  return array.length === 0;
}

export function aggregateTiedTeams(uniqueScores: number[], scores: Scores): Array<{ score: number; teams: string[] }> {
  return uniqueScores.slice().map((score) => {
    const tiedTeams = Object.keys(scores).filter((tid) => scores[tid] === score);
    const shuffledTiedTeams = shuffle(tiedTeams);
    return { score, teams: shuffledTiedTeams };
  });
}

export function findNextAvailableChooser(
  chooserIdx: number,
  chooserOrder: string[],
  canceled: string[]
): { newChooserIdx: number; newChooserTeamId: string } {
  const canceledSet = new Set(canceled);

  let newChooserIdx = chooserIdx;
  let newChooserTeamId = chooserOrder[chooserIdx];

  do {
    newChooserIdx = getNextCyclicIndex(newChooserIdx, chooserOrder.length);
    newChooserTeamId = chooserOrder[newChooserIdx];
  } while (canceledSet.has(newChooserTeamId));

  return { newChooserIdx, newChooserTeamId };
}

export function shuffleIndices(numItems: number): number[] {
  return shuffle(range(numItems));
}

export function isArray<T>(value: unknown): value is T[] {
  return Object.prototype.toString.call(value) === '[object Array]';
}
