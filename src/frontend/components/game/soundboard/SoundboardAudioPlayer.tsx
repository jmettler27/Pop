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

  // Ref so the onSnapshot callback always reads the latest volume without needing to re-subscribe.
  const volumeRef = useRef(volume);

  // Sounds blocked by the browser's autoplay policy; drained on the next user gesture.
  const pendingSoundsRef = useRef<string[]>([]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Plays any sounds that were buffered because the browser had not yet received a user gesture.
  const playPending = () => {
    const pending = pendingSoundsRef.current.splice(0);
    pending.forEach((url) => {
      const a = new Audio(url);
      a.volume = volumeRef.current;
      a.play().catch(() => {});
    });
  };

  useEffect(() => {
    const q = query(collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue'));
    let isInitialLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Skip the first snapshot: Firestore reports all pre-existing docs as 'added' on subscribe,
      // which would play every sound queued since the last reset for players joining mid-game.
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') {
          return;
        }
        const { filename } = change.doc.data() as { filename: string };
        const soundEntry = (sounds as Record<string, { url: string }>)[filename];
        if (!soundEntry) {
          return;
        }
        const audio = new Audio(soundEntry.url);
        audio.volume = volumeRef.current;
        // play() may reject if no user gesture has occurred yet (browser autoplay policy).
        // Buffer the URL so it can be retried on the next interaction with the volume controls.
        audio.play().catch(() => {
          pendingSoundsRef.current.push(soundEntry.url);
        });
      });
    });
    return () => unsubscribe();
  }, [gameId]);

  const handleVolumeChange = (_event: Event, value: number | number[]) => {
    setVolume(typeof value === 'number' ? value : value[0]);
    playPending();
  };

  return (
    <Box className="w-full overflow-hidden">
      <Stack spacing={2} direction="row" sx={{ mb: 1, px: 1 }} alignItems="center">
        <IconButton
          size="small"
          aria-label="play/pause"
          onClick={() => {
            setVolume((v) => (v === 0 ? initVolume : 0));
            playPending();
          }}
          sx={{
            '& .MuiSvgIcon-root': {
              color: 'primary.main',
            },
          }}
        >
          {volume === 0 ? <VolumeOffIcon /> : volume < 0.5 ? <VolumeDownRounded /> : <VolumeUpRounded />}
        </IconButton>

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
