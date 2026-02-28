import { addSound } from '@/backend/services/sound/sounds';
import { loadSounds } from '@/backend/utils/sounds';

import { useParams } from 'next/navigation';

import { memo, useState, useEffect } from 'react';

import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const SoundboardController = memo(function SoundboardController({}) {
  const { id: gameId } = useParams();

  const [sounds, setSounds] = useState({});
  useEffect(() => {
    const loadSoundsData = async () => {
      const loadedSounds = await loadSounds();
      setSounds(loadedSounds);
    };
    loadSoundsData();
  }, []);

  const handleSelectSound = async (e) => {
    e.preventDefault();
    addSound(gameId, e.target.value);
  };

  return (
    <>
      <FormControl sx={{ m: 1, minWidth: 150 }}>
        <InputLabel
          id="soundboard-input-label"
          sx={{ color: 'inherit', fontSize: { xs: '0.875rem', sm: '1rem', md: '1.0625rem', xl: '1.125rem' } }}
        >
          Soundboard
        </InputLabel>

        <Select
          id="sound-select"
          labelId="sound-select-label"
          value={''}
          // label="My sound"
          onChange={handleSelectSound}
          autoWidth
          sx={{
            color: 'inherit',
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.0625rem', xl: '1.125rem' },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'inherit',
            },
            // MuiInputBase-root-MuiOutlinedInput-root-MuiSelect-root.Mui-focused
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'red',
            },
            '& .MuiSelect-icon': {
              color: 'inherit',
            },
          }}
        >
          {Object.values(sounds).map((sound, idx) => (
            <MenuItem
              key={idx}
              value={sound.name}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.0625rem', xl: '1.125rem' } }}
            >
              {sound.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
});

export default SoundboardController;
