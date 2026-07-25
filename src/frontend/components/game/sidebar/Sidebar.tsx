import React, { useState } from 'react';

import { Languages, ListOrdered } from 'lucide-react';
import { useIntl } from 'react-intl';

import { useLocale } from '@/app/LocaleProvider';
import ProgressTabPanel from '@/frontend/components/game/sidebar/ProgressTabPanel';
import SoundboardAudioPlayer from '@/frontend/components/game/soundboard/SoundboardAudioPlayer';
import OrganizerSpeedDial from '@/frontend/components/game/speed-dial/OrganizerSpeedDial';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/frontend/components/ui/toggle-group';
import { LOCALE_TO_TITLE, LOCALES, type Locale } from '@/frontend/helpers/locales';
import useRole from '@/frontend/hooks/useRole';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.sidebar.Sidebar', {
  progress: 'Progress',
});

export default function Sidebar() {
  const myRole = useRole();
  const intl = useIntl();
  const { locale, setLocale } = useLocale();

  const [value] = useState('progress');

  return (
    <div className="w-full h-full overflow-y-auto">
      {/* Audio player and volume slider */}
      <div className="border-b border-border">
        <SoundboardAudioPlayer />
      </div>

      {/* Language selector */}
      <div className="border-b border-border px-3 py-2 flex items-center gap-2">
        <Languages className="size-[0.9rem] text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground shrink-0">{intl.formatMessage(globalMessages.language)}</span>
        <ToggleGroup
          value={[locale]}
          onValueChange={(values) => values[0] && setLocale(values[0] as Locale)}
          size="sm"
          className="ml-auto"
        >
          {LOCALES.map((code) => (
            <ToggleGroupItem key={code} value={code} className="px-2.5 py-0.5 text-[0.7rem]">
              {LOCALE_TO_TITLE[code]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Sidebar tabs */}
      <Tabs value={value}>
        <div className="border-b border-border">
          <TabsList className="w-full" aria-label="sidebar tabs">
            <TabsTrigger value="progress" aria-label="game progress">
              <ListOrdered className="size-4" />
              {intl.formatMessage(messages.progress)}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="progress">
          <ProgressTabPanel />
        </TabsContent>
      </Tabs>

      {myRole === ParticipantRole.ORGANIZER && <OrganizerSpeedDial />}
    </div>
  );
}
