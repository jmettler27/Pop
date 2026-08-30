import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Edit, Home, ListMusic, Plus, RotateCcw, Share, X } from 'lucide-react';
import { useIntl } from 'react-intl';

import { updateGame } from '@/frontend/api';
import SoundboardController from '@/frontend/components/game/soundboard/SoundboardController';
import { Button } from '@/frontend/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/frontend/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/frontend/components/ui/tooltip';
import useGameId from '@/frontend/hooks/useGameId';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';

const messages = defineMessages('frontend.game.speedDial.OrganizerSpeedDial', {
  share: 'Share',
  soundboard: 'Soundboard',
  resetGame: 'Reset game',
  resumeEditing: 'Resume editing',
});

export default function OrganizerSpeedDial() {
  const gameId = useGameId();
  const intl = useIntl();
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [soundboardOpen, setSoundboardOpen] = React.useState(false);

  const actions = [
    { icon: <Share />, name: 'share', label: intl.formatMessage(messages.share) },
    { icon: <ListMusic />, name: 'soundboard', label: intl.formatMessage(messages.soundboard) },
    { icon: <Home />, name: 'home', label: intl.formatMessage(globalMessages.home) },
    { icon: <RotateCcw />, name: 'resetGame', label: intl.formatMessage(messages.resetGame) },
    { icon: <Edit />, name: 'resumeEditing', label: intl.formatMessage(messages.resumeEditing) },
  ];

  const handleClick = (name: string) => {
    setOpen(false);
    switch (name) {
      case 'share':
        // updateQuestions()
        break;
      case 'soundboard':
        setSoundboardOpen(true);
        break;
      case 'home':
        updateGame(gameId, { action: 'return_to_home' });
        break;
      case 'resetGame':
        updateGame(gameId, { action: 'reset' });
        break;
      case 'resumeEditing':
        updateGame(gameId, { action: 'resume_editing' });
        router.push('/edit/' + gameId);
        break;
    }
  };

  return (
    <>
      <Sheet open={soundboardOpen} onOpenChange={setSoundboardOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{intl.formatMessage(messages.soundboard)}</SheetTitle>
          </SheetHeader>
          <SoundboardController />
        </SheetContent>
      </Sheet>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
        {open &&
          actions.map((action) => (
            <Tooltip key={action.name}>
              <TooltipTrigger render={<span />}>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full shadow-lg"
                  aria-label={action.label}
                  onClick={() => handleClick(action.name)}
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{action.label}</TooltipContent>
            </Tooltip>
          ))}

        <Button
          size="icon"
          className="size-14 rounded-full shadow-lg"
          aria-label="SpeedDial of organizer"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="size-6" /> : <Plus className="size-6" />}
        </Button>
      </div>
    </>
  );
}
