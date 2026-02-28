/**
 * update-i18n
 *
 * Extracts all English messages from defineMessages() calls in the codebase,
 * writes src/i18n/en.json, then re-orders src/i18n/fr.json so both files
 * share identical alphabetical key order.
 *
 * Sorting uses the same comparator convention as @formatjs/cli custom formatters:
 *   compareMessages: (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0
 *
 * Why not @formatjs/cli extract directly?
 *   The CLI expects { id, defaultMessage } message descriptors.
 *   This project uses a custom defineMessages(namespace, { key: 'text' })
 *   wrapper that prefixes IDs — not parseable by the upstream CLI extractor.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

// ---------------------------------------------------------------------------
// 1. Extract English messages from source files
// ---------------------------------------------------------------------------

const SRC_DIR = resolve('src');

function* walkFiles(dir) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) yield* walkFiles(full);
        else if (full.endsWith('.js') || full.endsWith('.jsx')) yield full;
    }
}

/**
 * Given source text and a position just after the opening `{` of a
 * defineMessages object literal, extract the body by counting nested braces.
 * This correctly handles ICU placeholder values like `'in {remaining} clues'`.
 */
function extractObjectBody(src, startIdx) {
    let depth = 1;
    let i = startIdx;
    while (i < src.length && depth > 0) {
        const ch = src[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        else if (ch === "'" || ch === '"' || ch === '`') {
            const q = ch;
            i++;
            while (i < src.length && src[i] !== q) {
                if (src[i] === '\\') i++;
                i++;
            }
        }
        i++;
    }
    return src.slice(startIdx, i - 1);
}

const OPEN_RE = /defineMessages\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{/g;
// Alternation per quote type so apostrophes inside "..." don't break the match
const ENTRY_RE = /^\s*(\w+)\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/gm;

const extracted = {};

for (const file of walkFiles(SRC_DIR)) {
    const src = readFileSync(file, 'utf8');
    let openMatch;
    OPEN_RE.lastIndex = 0;
    while ((openMatch = OPEN_RE.exec(src)) !== null) {
        const namespace = openMatch[1];
        const body = extractObjectBody(src, openMatch.index + openMatch[0].length);
        ENTRY_RE.lastIndex = 0;
        let entry;
        while ((entry = ENTRY_RE.exec(body)) !== null) {
            const key = entry[1];
            const value = (entry[2] ?? entry[3])
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            extracted[`${namespace}.${key}`] = value;
        }
    }
}

// ---------------------------------------------------------------------------
// 2. Sort — same comparator as @formatjs/cli compareMessages
// ---------------------------------------------------------------------------

/** @type {(a: string, b: string) => number} */
const compareKeys = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const sortedKeys = Object.keys(extracted).sort(compareKeys);

const enSorted = Object.fromEntries(sortedKeys.map(k => [k, extracted[k]]));

// ---------------------------------------------------------------------------
// 3. Write en.json
// ---------------------------------------------------------------------------

writeFileSync('src/i18n/en.json', JSON.stringify(enSorted, null, 4) + '\n', 'utf8');

// ---------------------------------------------------------------------------
// 4. Re-order fr.json to match the same key order
//    - Keys present in en.json come first, in sorted order; missing ones get ""
//    - Keys only in fr.json are appended at the end (sorted)
// ---------------------------------------------------------------------------

const frRaw = JSON.parse(readFileSync('src/i18n/fr.json', 'utf8'));

const frOnlyKeys = Object.keys(frRaw)
    .filter(k => !(k in enSorted))
    .sort(compareKeys);

const missingInFr = sortedKeys.filter(k => !(k in frRaw));
const staleInFr = frOnlyKeys;

const frSorted = {};
for (const k of sortedKeys) frSorted[k] = frRaw[k] ?? '';
for (const k of frOnlyKeys) frSorted[k] = frRaw[k];

writeFileSync('src/i18n/fr.json', JSON.stringify(frSorted, null, 4) + '\n', 'utf8');

// ---------------------------------------------------------------------------
// 5. Report
// ---------------------------------------------------------------------------

console.log(`✓ en.json     → ${sortedKeys.length} keys (sorted)`);
console.log(`✓ fr.json  → ${Object.keys(frSorted).length} keys (re-ordered to match)`);
if (missingInFr.length)
    console.warn(`⚠ Added ${missingInFr.length} missing keys with empty value (needs translation):\n  ${missingInFr.join('\n  ')}`);
if (staleInFr.length)
    console.warn(`⚠ Stale fr keys not in source (${staleInFr.length}):\n  ${staleInFr.join('\n  ')}`);
if (!missingInFr.length && !staleInFr.length)
    console.log('✓ Catalogs are in sync — no missing or stale keys');
