import { isObjectEmpty } from "@/lib/utils";

export const LABEL_TITLE_EXAMPLE = {
    'en': "Label the members of the Simpson family",
    'fr-FR': "Nommez les membres de la famille Simpson"
}
export const LABEL_TITLE_MAX_LENGTH = 50

export const LABEL_NOTE_EXAMPLE = ""
export const LABEL_NOTE_MAX_LENGTH = 500

export const LABEL_MAX_LENGTH = 50;

export const LABEL_EXAMPLE = [
    'Homer Simpson',
    'Marge Simpson',
    'Bart Simpson',
    'Lisa Simpson',

]

export const LABEL_MIN_NUMBER_OF_LABELS = 2
export const LABEL_MAX_NUMBER_OF_LABELS = 50


export const LABEL_DEFAULT_REWARDS_PER_ELEMENT = 1

export const LABEL_DEFAULT_MAX_TRIES = 1

export const LABEL_THINKING_TIME = 30


export function labelIsRevealed(revealed, labelIdx) {
    const revealedObj = revealed[labelIdx]
    return revealedObj && !isObjectEmpty(revealedObj)
}

export function atLeastOneLabelIsRevealed(revealed) {
    return revealed.some(revealedObj => !isObjectEmpty(revealedObj))
}



