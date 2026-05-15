import { memo } from 'react';
import { useParams } from 'next/navigation';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import { addSound } from '@/backend/services/sound/sounds';
import sounds from '@/data/sounds';

const SoundboardController = memo(function SoundboardController({}) {
  const { id: gameId } = useParams();

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
