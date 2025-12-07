import { QuestionType } from '@/backend/models/questions/QuestionType';

export const isRiddle = (type) => {
    switch (type) {
        case QuestionType.PROGRESSIVE_CLUES:
        case QuestionType.IMAGE:
        case QuestionType.EMOJI:
        case QuestionType.BLINDTEST:
            return true;
        default:
            return false;
    }
}

/* ICONS */
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import ImageIcon from '@mui/icons-material/Image';
import LabelIcon from '@mui/icons-material/Label';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BedroomBabyIcon from '@mui/icons-material/BedroomBaby';
import ChecklistIcon from '@mui/icons-material/Checklist';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ShuffleIcon from '@mui/icons-material/Shuffle';

export function QuestionTypeIcon({ questionType, fontSize = 'small' }) {
    switch (questionType) {
        case QuestionType.BASIC:
            return <QuestionMarkIcon sx={{ fontSize }} />
        case QuestionType.BLINDTEST:
            return <HeadphonesIcon sx={{ fontSize }} />
        case QuestionType.EMOJI:
            return <EmojiEmotionsIcon sx={{ fontSize }} />
        case QuestionType.ENUMERATION:
            return <SpeakerNotesIcon sx={{ fontSize }} />
        case QuestionType.IMAGE:
            return <ImageIcon sx={{ fontSize }} />
        case QuestionType.LABELLING:
            return <LabelIcon sx={{ fontSize }} />
        case QuestionType.MATCHING:
            return <FavoriteIcon sx={{ fontSize }} />
        case QuestionType.MCQ:
            return <AttachMoneyIcon sx={{ fontSize }} />
        case QuestionType.NAGUI:
            return <BedroomBabyIcon sx={{ fontSize }} />
        case QuestionType.ODD_ONE_OUT:
            return <ChecklistIcon sx={{ fontSize }} />
        case QuestionType.PROGRESSIVE_CLUES:
            return <EmojiObjectsIcon sx={{ fontSize }} />
        case QuestionType.QUOTE:
            return <FormatQuoteIcon sx={{ fontSize }} />
        case QuestionType.REORDERING:
            return <ShuffleIcon sx={{ fontSize }} />
    }
}

