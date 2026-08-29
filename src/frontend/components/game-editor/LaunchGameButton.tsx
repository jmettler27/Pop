import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Rocket } from 'lucide-react';
import { useIntl } from 'react-intl';

import { launchGame } from '@/backend/services/edit-game/actions';
import { Button } from '@/frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { Switch } from '@/frontend/components/ui/switch';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGameId from '@/frontend/hooks/useGameId';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';

const messages = defineMessages('frontend.gameEditor.LaunchGameButton', {
  launchGame: 'Launch game',
  dialogTitle: 'Are you sure you want to launch this game!',
  dialogWarning: 'The game will be publicly accessible for all users.',
  dialogConfirm: 'Letzgo',
  tvModeLabel: 'Open in TV / spectator mode on this device',
});

export function LaunchGameButton() {
  const intl = useIntl();
  const gameId = useGameId();

  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tvMode, setTvMode] = useState(false);

  const [handleLaunchGame, isLaunching] = useAsyncAction(async () => {
    await launchGame(gameId);
    router.push(tvMode ? `/${gameId}?spectator=1` : `/${gameId}`);
  });

  const onCancel = () => {
    setDialogOpen(false);
  };
  const onDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <Button
        size="lg"
        className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-amber-500 text-white hover:bg-amber-500/80"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          fontWeight: 'bold',
        }}
        onClick={() => setDialogOpen(true)}
      >
        <Rocket className="mr-2 size-4" />
        {intl.formatMessage(messages.launchGame)}
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open, eventDetails) => {
          if (eventDetails.reason === 'escape-key') return;
          if (!open) onDialogClose();
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{intl.formatMessage(messages.dialogTitle)}</DialogTitle>
            <DialogDescription>{intl.formatMessage(messages.dialogWarning)}</DialogDescription>
          </DialogHeader>

          <label className="inline-flex items-center gap-2 cursor-pointer mt-4">
            <Switch checked={tvMode} onCheckedChange={setTvMode} />
            <span className="text-sm">{intl.formatMessage(messages.tvModeLabel)}</span>
          </label>

          <DialogFooter>
            <Button onClick={handleLaunchGame} disabled={isLaunching}>
              {intl.formatMessage(messages.dialogConfirm)}
            </Button>

            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={onCancel}
            >
              {intl.formatMessage(globalMessages.cancel)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
