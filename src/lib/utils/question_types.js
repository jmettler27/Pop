/* TYPES OF QUESTION */
export const QUESTION_TYPES = [
    'progressive_clues',
    'image',
    'emoji',
    'blindtest',
    'quote',
    'enum',
    'odd_one_out',
    'matching',
    'mcq',
    // 'basic'
]

export const QUESTION_TYPE_TO_EMOJI = {
    'progressive_clues': "💡",
    'image': "🖼️",
    'emoji': "😃",
    'blindtest': "🎧",
    'quote': "💬",
    'enum': "🗣️",
    'odd_one_out': "🕵️",
    'matching': "💖",
    'mcq': "💲4️⃣2️⃣",
    // 'basic': "🏁"
}

export const QUESTION_TYPE_TO_TITLE = {
    'en': {
        'progressive_clues': "Progressive Clues",
        'image': "Image",
        'emoji': "Emoji",
        'blindtest': "Blindtest",
        'quote': "Quote",
        'enum': "Enumeration",
        'odd_one_out': "Odd One Out",
        'matching': "Matching",
        'mcq': "MCQ",
        // 'basic': "Question-Answer"
    },
    'fr-FR': {
        'progressive_clues': "Devinette",
        'image': "Image",
        'emoji': "Emoji",
        'blindtest': "Blindtest",
        'quote': "Réplique",
        'enum': "Énumération",
        'odd_one_out': "Coup par coup",
        'matching': "Matching",
        'mcq': "QCM",
        // 'basic': "Question-Réponse"
    }
}

export const isRiddle = (type) => {
    switch (type) {
        case 'progressive_clues':
        case 'image':
        case 'emoji':
        case 'blindtest':
        case 'quote':
            return true;
        default:
            return false;
    }
}

export const sortAscendingRoundScores = (roundType) => {
    switch (roundType) {
        case 'odd_one_out':
        case 'matching':
            return true;
        default:
            return false;
    }
}


/* TITLE */
export function questionTypeToTitle(questionType, lang = 'en') {
    return QUESTION_TYPE_TO_TITLE[lang][questionType]
}

import { prependWithEmojiAndSpace } from '@/lib/utils/emojis';
export function questionTypeToEmoji(questionType) {
    return QUESTION_TYPE_TO_EMOJI[questionType]
}

export function prependQuestionTypeWithEmoji(questionType, lang = 'en') {
    return prependWithEmojiAndSpace(questionTypeToEmoji(questionType), questionTypeToTitle(questionType, lang))
}


/* ICONS */
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'
import ImageIcon from '@mui/icons-material/Image'
import HeadphonesIcon from '@mui/icons-material/Headphones';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes'
import ChecklistIcon from '@mui/icons-material/Checklist'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import AbcIcon from '@mui/icons-material/Abc';
import ReorderIcon from '@mui/icons-material/Reorder';

export function RoundTypeIcon({ roundType, fontSize = 'small' }) {
    switch (roundType) {
        case 'finale':
            return <EmojiEventsIcon sx={{ fontSize }} />
        default:
            return <QuestionTypeIcon questionType={roundType} fontSize={fontSize} />
    }
}

export function QuestionTypeIcon({ questionType, fontSize = 'small' }) {
    switch (questionType) {
        case 'progressive_clues':
            return <EmojiObjectsIcon sx={{ fontSize }} />
        case 'image':
            return <ImageIcon sx={{ fontSize }} />
        case 'emoji':
            return <EmojiEmotionsIcon sx={{ fontSize }} />
        case 'blindtest':
            return <HeadphonesIcon sx={{ fontSize }} />
        case 'odd_one_out':
            return <ChecklistIcon sx={{ fontSize }} />
        case 'enum':
            return <SpeakerNotesIcon sx={{ fontSize }} />
        case 'mcq':
            return <ReorderIcon sx={{ fontSize }} />
        case 'matching':
            return <FavoriteIcon sx={{ fontSize }} />
        case 'quote':
            return <FormatQuoteIcon sx={{ fontSize }} />
    }
}

/* Validation */
import * as Yup from 'yup'
export const typeSchema = () => Yup.string()
    .oneOf(QUESTION_TYPES, "Invalid type.")
    .required("Required.")
