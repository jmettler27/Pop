'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';

import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import QuizIcon from '@mui/icons-material/Quiz';
import GitHubIcon from '@mui/icons-material/GitHub';
import HistoryIcon from '@mui/icons-material/History';

import { RoundType, roundTypeToEmoji, roundTypeToTitle } from '@/backend/models/rounds/RoundType';
import { questionTypeToDescription } from '@/backend/models/questions/QuestionType';

const ABOUT_ROUND_TYPES = [
  RoundType.PROGRESSIVE_CLUES,
  RoundType.IMAGE,
  RoundType.EMOJI,
  RoundType.BLINDTEST,
  RoundType.QUOTE,
  RoundType.LABELLING,
  RoundType.ENUMERATION,
  RoundType.ODD_ONE_OUT,
  RoundType.MATCHING,
  RoundType.REORDERING,
  RoundType.MCQ,
  RoundType.NAGUI,
  RoundType.SPECIAL,
];

const messages = defineMessages('app.about', {
  title: 'About Pop!',
  subtitle: 'Quizzes to play with your friends around pop culture!',
  whatIsPopTitle: 'What is Pop!?',
  whatIsPopDescription:
    'Pop! is a real-time quiz app where players host or join games and compete solo or in teams across a variety of question types.',
  whatIsPopNote:
    'The game is designed to be played while chatting in-person or on a VoIP application such as Discord or Zoom.',
  roundTypesTitle: 'Round Types',
  originsTitle: 'Origins',
  originsDescription:
    'Pop! originated from a group of friends who loved creating and playing quiz games centered around our shared passions of video games, movies, anime, TV shows, and more.',
  openSourceTitle: 'Open Source',
  openSourceDescription: 'Pop! is open source. Check out the code and the wiki for more details.',
});

function SectionTitle({ icon, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      {icon}
      <Typography variant="h5" fontWeight={700} color="white">
        {children}
      </Typography>
    </Box>
  );
}

export default function AboutPage() {
  const { data: session } = useSession();
  const intl = useIntl();
  const locale = intl.locale;

  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Hero */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <SportsEsportsIcon sx={{ fontSize: 56, color: '#60a5fa', mb: 1 }} />
        <Typography variant="h3" fontWeight={800} color="white" gutterBottom>
          {intl.formatMessage(messages.title)}
        </Typography>
        <Typography variant="h6" color="grey.400" sx={{ maxWidth: 500, mx: 'auto' }}>
          {intl.formatMessage(messages.subtitle)}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* What is Pop!? */}
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
          <SectionTitle icon={<QuizIcon sx={{ color: '#60a5fa' }} />}>
            {intl.formatMessage(messages.whatIsPopTitle)}
          </SectionTitle>
          <Typography color="grey.300" sx={{ mb: 1.5 }}>
            {intl.formatMessage(messages.whatIsPopDescription)}
          </Typography>
          <Paper
            elevation={0}
            sx={{ p: 2, bgcolor: 'rgba(96,165,250,0.1)', borderRadius: 2, borderLeft: '3px solid #60a5fa' }}
          >
            <Typography variant="body2" color="grey.400" fontStyle="italic">
              💡 {intl.formatMessage(messages.whatIsPopNote)}
            </Typography>
          </Paper>
        </Paper>

        {/* Round Types */}
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
          <SectionTitle icon={<EmojiEventsIcon sx={{ color: '#f59e0b' }} />}>
            {intl.formatMessage(messages.roundTypesTitle)}
          </SectionTitle>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {ABOUT_ROUND_TYPES.map((type) => (
              <Chip
                key={type}
                label={`${roundTypeToEmoji(type)} ${roundTypeToTitle(type, locale)}`}
                title={questionTypeToDescription(type, locale)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: 'grey.200',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Origins */}
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
          <SectionTitle icon={<HistoryIcon sx={{ color: '#a78bfa' }} />}>
            {intl.formatMessage(messages.originsTitle)}
          </SectionTitle>
          <Typography color="grey.300">{intl.formatMessage(messages.originsDescription)}</Typography>
        </Paper>

        {/* Open Source */}
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
          <SectionTitle icon={<GitHubIcon sx={{ color: 'grey.300' }} />}>
            {intl.formatMessage(messages.openSourceTitle)}
          </SectionTitle>
          <Typography color="grey.300" sx={{ mb: 2 }}>
            {intl.formatMessage(messages.openSourceDescription)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link
              href="https://github.com/jmettler27/Pop"
              target="_blank"
              rel="noopener noreferrer"
              underline="none"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
                color: 'grey.200',
                fontWeight: 600,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', transform: 'translateY(-1px)' },
              }}
            >
              <GitHubIcon fontSize="small" /> GitHub
            </Link>
            <Link
              href="https://github.com/jmettler27/Pop/wiki"
              target="_blank"
              rel="noopener noreferrer"
              underline="none"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
                color: 'grey.200',
                fontWeight: 600,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', transform: 'translateY(-1px)' },
              }}
            >
              📖 Wiki
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
