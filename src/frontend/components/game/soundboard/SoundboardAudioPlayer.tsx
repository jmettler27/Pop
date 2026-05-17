import { memo, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

import VolumeDownRounded from '@mui/icons-material/VolumeDownRounded';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import { Box, IconButton, Slider, Stack } from '@mui/material';
import { collection, onSnapshot, query } from 'firebase/firestore';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import sounds from '@/data/sounds';

const initVolume = 0.4;

const SoundboardAudioPlayer = memo(function SoundboardAudioPlayer() {
  const { id } = useParams();
  const gameId = id as string;
  const [volume, setVolume] = useState(initVolume);

  const newestSoundIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (sounds && Object.keys(sounds).length > 0) {
      const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId as string, 'realtime', 'sounds', 'queue');
      const q = query(queueCollectionRef);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newSound = { ...change.doc.data(), id: change.doc.id } as { id: string; filename: string };
            const playedSounds: string[] = JSON.parse(localStorage.getItem('playedSounds') ?? '[]');
            if (newSound.id !== newestSoundIdRef.current && !playedSounds.includes(newSound.id)) {
              newestSoundIdRef.current = newSound.id;
              playedSounds.push(newSound.id);
              localStorage.setItem('playedSounds', JSON.stringify(playedSounds));
              console.log('New sound: ', newSound);
              const soundEntry = (sounds as Record<string, { name: string; url: string }>)[newSound.filename];
              if (soundEntry) {
                const audio = new Audio(soundEntry.url);
                audio.volume = volume;
                audio.autoplay = true;
                audio.play();
              }
            }
          }
        });
      });
      // Clean up the listener when the component unmounts
      return () => unsubscribe();
    }
  }, [volume]);

  const handleVolumeChange = (_event: Event, value: number | number[]) => {
    setVolume(typeof value === 'number' ? value : value[0]);
  };

  return (
    <Box className="w-full overflow-hidden">
      {/* Volume controller */}
      <Stack spacing={2} direction="row" sx={{ mb: 1, px: 1 }} alignItems="center">
        {/* Mute/unmute button */}
        <IconButton
          size="small"
          aria-label="play/pause"
          onClick={() => {
            if (volume === 0) {
              setVolume(initVolume);
            } else {
              setVolume(0);
            }
          }}
          sx={{
            '& .MuiSvgIcon-root': {
              color: 'primary.main',
            },
          }}
        >
          {volume === 0 ? <VolumeOffIcon /> : volume < 0.5 ? <VolumeDownRounded /> : <VolumeUpRounded />}
        </IconButton>

        {/* Volume slider */}
        <Slider
          aria-label="Volume"
          orientation="horizontal"
          value={volume}
          min={0}
          max={1}
          step={0.01}
          onChange={handleVolumeChange}
        />
      </Stack>
    </Box>
  );
});

export default SoundboardAudioPlayer;
