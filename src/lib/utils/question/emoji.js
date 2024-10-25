/* Emoji */

export const EMOJI_TITLE_EXAMPLE = "Film"
export const EMOJI_TITLE_MAX_LENGTH = 50

export const EMOJI_CLUE_EXAMPLE = "🚢🎻🧊"
export const EMOJI_CLUE_MIN_LENGTH = 1;
export const EMOJI_CLUE_MAX_LENGTH = 10;

export const EMOJI_ANSWER_TITLE_EXAMPLE = "Titanic"
export const EMOJI_ANSWER_TITLE_MAX_LENGTH = 50

export const EMOJI_DEFAULT_REWARD = 1

export const EMOJI_DEFAULT_MAX_TRIES = 2

export const EMOJI_THINKING_TIME = 15


/* Validation  */
import * as Yup from 'yup'

import emojiRegex from 'emoji-regex';
const regex = emojiRegex();

export const emojiClueSchema = () => Yup.string()
    .test(
        "only-emojis",
        "Only emojis are allowed!",
        (str) => {
            const stringWithoutEmojis = str.replace(regex, '');
            return stringWithoutEmojis.length <= 0;
        }
    )
    .test(
        "emoji-count",
        `There must be at least ${EMOJI_CLUE_MIN_LENGTH} and at most ${EMOJI_CLUE_MAX_LENGTH} emojis`,
        (str) => {
            const numEmojis = emojiCount(str);
            return EMOJI_CLUE_MIN_LENGTH <= numEmojis && numEmojis <= EMOJI_CLUE_MAX_LENGTH;
        }
    )
    .required("Required.")


export const emojiCount = (str) => (str.match(regex) || []).length;