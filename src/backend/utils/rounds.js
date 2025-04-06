export const sortAscendingRoundScores = (roundType) => {
    switch (roundType) {
        case RoundType.ODD_ONE_OUT:
        case RoundType.MATCHING:
        case RoundType.REORDERING:
            return true;
        default:
            return false;
    }
}


export const ROUND_HEADER_TEXT = {
    'en': "Round",
    'fr-FR': "Manche"
}

/* Round types */
import { QuestionTypeIcon } from '@/backend/utils/question_types'
import { RoundType } from '@/backend/models/rounds/RoundType'

import RepeatIcon from '@mui/icons-material/Repeat';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

export function RoundTypeIcon({ roundType, fontSize = 'small' }) {
    switch (roundType) {
        case RoundType.MIXED:
            return <RepeatIcon sx={{ fontSize }} />
        case RoundType.SPECIAL:
            return <EmojiEventsIcon sx={{ fontSize }} />
        default:
            return <QuestionTypeIcon questionType={roundType} fontSize={fontSize} />
    }
}
