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

export function isEmpty(array: unknown[]): boolean {
  return array.length === 0;
}

export function shuffleIndices(numItems: number): number[] {
  return shuffle(range(numItems));
}

export function isArray<T>(value: unknown): value is T[] {
  return Object.prototype.toString.call(value) === '[object Array]';
}
