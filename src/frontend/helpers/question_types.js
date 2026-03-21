import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BedroomBabyIcon from '@mui/icons-material/BedroomBaby';
import ChecklistIcon from '@mui/icons-material/Checklist';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import ImageIcon from '@mui/icons-material/Image';
import LabelIcon from '@mui/icons-material/Label';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import RepeatIcon from '@mui/icons-material/Repeat';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { RoundType } from '@/backend/models/rounds/RoundType';

export function QuestionTypeIcon({ questionType, fontSize = 'small' }) {
  switch (questionType) {
    case QuestionType.BASIC:
      return <QuestionMarkIcon sx={{ fontSize }} />;
    case QuestionType.BLINDTEST:
      return <HeadphonesIcon sx={{ fontSize }} />;
    case QuestionType.EMOJI:
      return <EmojiEmotionsIcon sx={{ fontSize }} />;
    case QuestionType.ENUMERATION:
      return <SpeakerNotesIcon sx={{ fontSize }} />;
    case QuestionType.IMAGE:
      return <ImageIcon sx={{ fontSize }} />;
    case QuestionType.LABELLING:
      return <LabelIcon sx={{ fontSize }} />;
    case QuestionType.MATCHING:
      return <FavoriteIcon sx={{ fontSize }} />;
    case QuestionType.MCQ:
      return <AttachMoneyIcon sx={{ fontSize }} />;
    case QuestionType.NAGUI:
      return <BedroomBabyIcon sx={{ fontSize }} />;
    case QuestionType.ODD_ONE_OUT:
      return <ChecklistIcon sx={{ fontSize }} />;
    case QuestionType.PROGRESSIVE_CLUES:
      return <EmojiObjectsIcon sx={{ fontSize }} />;
    case QuestionType.QUOTE:
      return <FormatQuoteIcon sx={{ fontSize }} />;
    case QuestionType.REORDERING:
      return <ShuffleIcon sx={{ fontSize }} />;
  }
}

export function RoundTypeIcon({ roundType, fontSize = 'small' }) {
  switch (roundType) {
    case RoundType.MIXED:
      return <RepeatIcon sx={{ fontSize }} />;
    case RoundType.SPECIAL:
      return <EmojiEventsIcon sx={{ fontSize }} />;
    default:
      return <QuestionTypeIcon questionType={roundType} fontSize={fontSize} />;
  }
}
