'use client';

import type React from 'react';
import { redirect } from 'next/navigation';

import { Gamepad2, HelpCircle, History, Trophy } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';

import { Badge } from '@/components/ui/badge';
import type { Locale } from '@/helpers/locales';
import defineMessages from '@/i18n/defineMessages';
import { questionTypeToDescription } from '@/models/questions/question-type';
import { RoundType, roundTypeToEmoji, roundTypeToTitle } from '@/models/rounds/round-type';

const ABOUT_ROUND_TYPES = [
  RoundType.BASIC,
  RoundType.BLINDTEST,
  RoundType.EMOJI,
  RoundType.ENUMERATION,
  RoundType.ESTIMATION,
  RoundType.IMAGE,
  RoundType.LABELLING,
  RoundType.MATCHING,
  RoundType.MCQ,
  RoundType.NAGUI,
  RoundType.ODD_ONE_OUT,
  RoundType.PROGRESSIVE_CLUES,
  RoundType.QUOTE,
  RoundType.REORDERING,
];

const messages = defineMessages('app.about', {
  title: 'Pop!',
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

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h5 className="text-2xl font-bold text-white">{children}</h5>
    </div>
  );
}

export default function AboutPage() {
  const { data: session } = useSession();
  const intl = useIntl();
  const locale = intl.locale as Locale;

  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }
  if (session.user.isGuest) {
    redirect('/');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <Gamepad2 className="size-14 text-blue-400 mb-2 mx-auto" />
        <h3 className="text-5xl font-extrabold text-white mb-2">{intl.formatMessage(messages.title)}</h3>
        <h6 className="text-xl text-gray-400 mx-auto whitespace-nowrap">{intl.formatMessage(messages.subtitle)}</h6>
      </div>

      <div className="flex flex-col gap-8">
        {/* What is Pop!? */}
        <div className="p-6 rounded-xl bg-white/5">
          <SectionTitle icon={<HelpCircle className="text-blue-400" />}>
            {intl.formatMessage(messages.whatIsPopTitle)}
          </SectionTitle>
          <p className="text-gray-300 mb-3">{intl.formatMessage(messages.whatIsPopDescription)}</p>
          <div className="p-4 rounded-lg bg-blue-400/10 border-l-[3px] border-blue-400">
            <p className="text-sm text-gray-400 italic">💡 {intl.formatMessage(messages.whatIsPopNote)}</p>
          </div>
        </div>

        {/* Round Types */}
        <div className="p-6 rounded-xl bg-white/5">
          <SectionTitle icon={<Trophy className="text-amber-500" />}>
            {intl.formatMessage(messages.roundTypesTitle)}
          </SectionTitle>
          <div className="flex flex-wrap gap-2">
            {ABOUT_ROUND_TYPES.map((type) => (
              <Badge
                key={type}
                title={questionTypeToDescription(type, locale)}
                className="bg-white/8 text-gray-200 font-semibold text-[0.85rem] hover:bg-white/15"
              >
                {roundTypeToEmoji(type)} {roundTypeToTitle(type, locale)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Origins */}
        <div className="p-6 rounded-xl bg-white/5">
          <SectionTitle icon={<History className="text-violet-400" />}>
            {intl.formatMessage(messages.originsTitle)}
          </SectionTitle>
          <p className="text-gray-300">{intl.formatMessage(messages.originsDescription)}</p>
        </div>

        {/* Open Source */}
        <div className="p-6 rounded-xl bg-white/5">
          <SectionTitle icon={<GithubIcon className="size-6 text-gray-300" />}>
            {intl.formatMessage(messages.openSourceTitle)}
          </SectionTitle>
          <p className="text-gray-300 mb-4">{intl.formatMessage(messages.openSourceDescription)}</p>
          <div className="flex gap-4 flex-wrap">
            <a
              href="https://github.com/jmettler27/Pop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/8 text-gray-200 font-semibold no-underline transition-all duration-200 hover:bg-white/15 hover:-translate-y-px"
            >
              <GithubIcon className="size-4" /> GitHub
            </a>
            <a
              href="https://github.com/jmettler27/Pop/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/8 text-gray-200 font-semibold no-underline transition-all duration-200 hover:bg-white/15 hover:-translate-y-px"
            >
              📖 Wiki
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
