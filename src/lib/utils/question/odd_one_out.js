/* Odd One Out */

export const OOO_TITLE_EXAMPLE = {
    'en': "Which films feature one or more serial killers?",
    'fr-FR': "Quels films mettent en scène un ou plusieurs tueurs en série?"
}
export const OOO_TITLE_MAX_LENGTH = 75

export const OOO_ITEMS_EXAMPLE = {
    'en': [
        { title: "Man Bites Dog (🇧🇪, 1992)", explanation: "Mockumentary about a serial killer played by Benoît Poelvoorde." },
        { title: "The Silence of The Lambs (🇺🇸, 1990)", explanation: "Featuring the cannibalistic psychiatrist Hannibal Lecter, played by Anthony Hopkins." },
        { title: "Fear City: A Family-Style Comedy (🇫🇷, 1994)", explanation: "A killer armed with a hammer and sickle." },
        { title: "Braindead (🇳🇿, 1992)", explanation: "Horrific comedy with zombies, directed by Peter Jackson." },
        { title: "Seven (🇺🇸, 1995)", explanation: "What's in the box?" },
        { title: "Hot Fuzz (🇬🇧, 2007)", explanation: "The Neighbourhood Watch Alliance of Sandford." },
        { title: "Saw (🇺🇸, 2004)", explanation: "John Kramer a.k.a. 'Jigsaw'." },
        { title: "The House That Jack Built (🇩🇰, 2018)", explanation: "Architect by day, murderer by night." },
        { title: "High Tension (🇫🇷, 2003)", explanation: "French slasher in which a serial killer massacres a family on a farm." },
        { title: "American Psycho (🇺🇸, 2000)", explanation: "Patrick Bateman." },
    ],
    'fr-FR': [
        { explanation: 'Faux documentaire belge sur un tueur en série, incarné par Benoît Poelvoorde', title: 'C’est arrivé près de chez vous (1992)' },
        { explanation: 'Met en scène le psychiatre cannibale Hannibal Lecter, incarné par Anthony Hopkins', title: 'Le silence des agneaux (1990)' },
        { explanation: "Un tueur armé d'un marteau et d'une faucille", title: 'La cité de la peur (1994)' },
        { explanation: 'Comédie horrifique avec des zombies, réalisée par Peter Jackson', title: 'Braindead (1992)' },
        { explanation: 'Qu’y a-t-il dans la boîte?', title: 'Seven (1995)' },
        { title: 'Hot Fuzz (2007)', explanation: 'Simon Skinner' },
        { title: 'Saw (2004)', explanation: 'John Kramer, alias “Jigsaw”, ' },
        { title: 'The House That Jack Built (2018)', explanation: 'Architecte le jour, tueur en série la nuit' },
        { explanation: 'Slasher français dans lequel un tueur en série massacre une famille dans une ferme', title: 'Haute Tension (2003)' },
        { title: 'American Psycho (2000)', explanation: 'Patrick Bateman' }
    ]
}
export const OOO_ITEMS_LENGTH = 10;
export const OOO_ITEM_TITLE_MAX_LENGTH = 75
export const OOO_ITEM_EXPLANATION_MAX_LENGTH = 150

export const OOO_DEFAULT_MISTAKE_PENALTY = 1

/* In-game logic */
import { range, shuffle } from '../arrays';

export function generateShuffledIndices(numItems) {
    return shuffle(range(numItems));
}

export const OOO_THINKING_TIME = 30