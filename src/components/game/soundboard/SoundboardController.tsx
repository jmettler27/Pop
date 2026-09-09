import { memo } from 'react';

import { addSound } from '@/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SOUND_NAMES } from '@/helpers/sounds';
import useGameId from '@/hooks/useGameId';

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
        {SOUND_NAMES.map((name) => (
          <SelectItem key={name} value={name} className={soundboardTextSize}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

export default SoundboardController;
