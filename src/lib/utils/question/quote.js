import { isObjectEmpty } from "@/lib/utils";

/* Quote */
export const QUOTE_EXAMPLE = {
    'en': "I'm Commander Shepard and this is my favorite store on the Citadel.",
    'fr-FR': "Je suis le Commandant Shepard et c'est mon magasin préféré de la Citadelle."
}
export const QUOTE_MAX_LENGTH = 300;

export const QUOTE_SOURCE_EXAMPLE = {
    'en': "Mass Effect 2",
    'fr-FR': "Mass Effect 2"
}
export const QUOTE_SOURCE_MAX_LENGTH = 50

export const QUOTE_AUTHOR_EXAMPLE = {
    'en': "Commander Shepard",
    'fr-FR': "Commandant Shepard"
}
export const QUOTE_AUTHOR_MAX_LENGTH = 50

export const QUOTE_ELEMENTS = ['source', 'author', 'quote']

export const QUOTE_DEFAULT_REWARDS_PER_ELEMENT = 1
export const QUOTE_DEFAULT_MAX_TRIES = 2

export const QUOTE_THINKING_TIME = 30

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


export const QUOTE_ELEMENT_TO_TITLE = {
    'en': {
        'source': "Source",
        'author': "Author",
        'quote': "Quote part"
    },
    'fr-FR': {
        'source': "Source",
        'author': "Auteur",
        'quote': "Partie de la réplique"
    }
}

export const QUOTE_ELEMENT_TO_EMOJI = {
    'source': "📜",
    'author': "🧑",
    'quote': "💬"
}

export const QUOTE_ELEMENTS_SORT_ORDER = ['quote', 'author', 'source'];


import { DEFAULT_LOCALE } from '@/lib/utils/locales';

export function quoteElementToTitle(element, lang = DEFAULT_LOCALE) {
    return QUOTE_ELEMENT_TO_TITLE[lang][element]
}
export function quoteElementToEmoji(element) {
    return QUOTE_ELEMENT_TO_EMOJI[element]
}

export function prependQuoteElementWithEmoji(element, lang = DEFAULT_LOCALE) {
    return quoteElementToEmoji(element) + " " + quoteElementToTitle(element, lang)
}


export function quoteElementIsRevealed(revealed, quoteElem) {
    const revealedObj = revealed[quoteElem]
    const revealedObjIsNotEmpty = !isObjectEmpty(revealedObj)

    if (quoteElem === 'quote') {
        return revealedObjIsNotEmpty && Object.values(revealedObj).every((obj) => !isObjectEmpty(obj))
    }
    return revealedObjIsNotEmpty
}

export function atLeastOneElementRevealed(revealed) {
    return Object.keys(revealed).some(key => quoteElementIsRevealed(revealed, key));
}

export function quotePartIsRevealed(revealed, quotePartIdx) {
    const revealedObj = revealed['quote']
    return !isObjectEmpty(revealedObj) && !isObjectEmpty(revealedObj[quotePartIdx])
}