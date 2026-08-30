import { memo } from 'react';

import sounds from '@/data/sounds';
import { addSound } from '@/frontend/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import useGameId from '@/frontend/hooks/useGameId';

const soundboardTextSize = 'text-sm sm:text-base md:text-[1.0625rem] xl:text-lg';

const SoundboardController = memo(function SoundboardController({}) {
  const gameId = useGameId();

  const handleSelectSound = (value: string | null) => {
    if (value) addSound(gameId as string, { filename: value });
  };

  return (
    <Select value="" onValueChange={handleSelectSound}>
      <SelectTrigger className={`m-2 min-w-[150px] ${soundboardTextSize}`}>
        <SelectValue placeholder="Soundboard" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(sounds).map((sound, idx) => (
          <SelectItem key={idx} value={sound.name} className={soundboardTextSize}>
            {sound.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

export default SoundboardController;
