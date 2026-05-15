import { useEffect, useRef, useState } from 'react';

import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import VolumeDownRounded from '@mui/icons-material/VolumeDownRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import { Box, IconButton, Slider, Stack, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

import NextImage from '@/frontend/components/common/NextImage';
import { QUESTION_ELEMENT_TO_EMOJI } from '@/frontend/helpers/question';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { BlindtestQuestion } from '@/models/questions/blindtest';

interface BlindtestMainContentProps {
  baseQuestion: BlindtestQuestion;
}

export default function BlindtestMainContent({ baseQuestion }: BlindtestMainContentProps) {
  const game = useGame();
  if (!game) return null;

  return (
    <>
      {game.status === GameStatus.QUESTION_ACTIVE && <ActiveBlindtestMainContent baseQuestion={baseQuestion} />}
      {game.status === GameStatus.QUESTION_END && <EndedBlindtestMainContent baseQuestion={baseQuestion} />}
    </>
  );
}

const DEFAULT_VOLUME = 0.25;

interface ActiveBlindtestMainContentProps {
  baseQuestion: BlindtestQuestion;
}

function ActiveBlindtestMainContent({ baseQuestion }: ActiveBlindtestMainContentProps) {
  const game = useGame();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState<number>(Number(localStorage.getItem('volume')) || DEFAULT_VOLUME);

  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.autoplay = true;

    if (game!.status === GameStatus.QUESTION_END) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [game!.status]);

  const theme = useTheme();
  const mainIconColor = theme.palette.mode === 'dark' ? '#fff' : '#000';
  const lightIconColor = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  const formatTime = (time: number) => {
    const minute = Math.floor(time / 60);
    const secondLeft = Math.floor((time - minute * 60) % 60);
    return `${minute}:${secondLeft < 10 ? `0${secondLeft}` : secondLeft}`;
  };

  const handlePlayPauseReplay = () => {
    if (!audioRef.current) return;
    if (currentTime < duration) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeChange = (_event: Event, value: number | number[]) => {
    if (!audioRef.current) return;
    const v = Array.isArray(value) ? value[0] : value;
    audioRef.current.currentTime = v;
    setCurrentTime(v);
  };

  const handleVolumeChange = (_event: Event, value: number | number[]) => {
    if (!audioRef.current) return;
    const v = Array.isArray(value) ? value[0] : value;
    audioRef.current.volume = v;
    localStorage.setItem('volume', String(v));
    setVolume(v);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const bq = baseQuestion as { audio?: string; title?: string };

  return (
    <Box className="w-full overflow-hidden">
      <Widget>
        {/* Audio general info */}
        <Box className="flex items-center">
          <CoverImage>
            <span className="2xl:text-5xl w-full h-full flex flex-col items-center justify-center">🎵</span>
          </CoverImage>

          <audio
            ref={audioRef}
            src={bq.audio}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
          />

          <Box sx={{ ml: 1.5, minWidth: 0 }}>
            <Typography variant="h6" color="text.secondary" fontWeight={500}>
              {bq.title} (OST)
            </Typography>

            <Typography variant="h5" noWrap>
              ???
            </Typography>
          </Box>
        </Box>

        {/* Audio time slider */}
        <Slider
          aria-label="Time"
          size="small"
          value={currentTime}
          min={0}
          max={duration}
          onChange={handleTimeChange}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => formatTime(value)}
          sx={{
            color: theme.palette.mode === 'dark' ? '#fff' : 'rgba(0,0,0,0.87)',
            height: 4,
            '& .MuiSlider-thumb': {
              width: 8,
              height: 8,
              transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
              '&:before': {
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
              },
              '&:hover, &.Mui-focusVisible': {
                boxShadow: `0px 0px 0px 8px ${
                  theme.palette.mode === 'dark' ? 'rgb(255 255 255 / 16%)' : 'rgb(0 0 0 / 16%)'
                }`,
              },
              '&.Mui-active': {
                width: 20,
                height: 20,
              },
            },
            '& .MuiSlider-rail': {
              opacity: 0.28,
            },
          }}
        />

        <Box className="flex items-center justify-between" sx={{ mt: -2 }}>
          <Typography>{formatTime(currentTime)}</Typography>
          <Typography>-{formatTime(duration - currentTime)}</Typography>
        </Box>

        {/* Audio pause button */}
        <Box className="flex flex-row items-center justify-center" sx={{ mt: -1 }}>
          {/* Fast Rewind */}
          <IconButton
            aria-label="fast rewind"
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime -= 10;
            }}
          >
            <FastRewindIcon className="2xl:text-4xl" htmlColor={mainIconColor} />
          </IconButton>

          {/* Play/Pause */}
          <IconButton
            aria-label={currentTime < duration ? (isPlaying ? 'play' : 'pause') : 'replay'}
            onClick={handlePlayPauseReplay}
          >
            {currentTime < duration ? (
              isPlaying ? (
                <PauseRounded className="2xl:text-5xl" htmlColor={mainIconColor} />
              ) : (
                <PlayArrowRounded sx={{ fontSize: '3rem' }} htmlColor={mainIconColor} />
              )
            ) : (
              <PlayArrowRounded sx={{ fontSize: '3rem' }} htmlColor={mainIconColor} />
            )}
          </IconButton>

          {/* Fast Forward */}
          <IconButton
            aria-label="fast forward"
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime += 10;
            }}
          >
            <FastForwardIcon className="2xl:text-4xl" htmlColor={mainIconColor} />
          </IconButton>
        </Box>

        {/* Audio volume controller */}
        <Stack spacing={2} direction="row" sx={{ mb: 1, px: 1 }} alignItems="center">
          <VolumeDownRounded htmlColor={lightIconColor} />
          <Slider
            aria-label="Volume"
            orientation="horizontal"
            value={volume}
            min={0}
            max={1}
            step={0.01}
            onChange={handleVolumeChange}
            sx={{
              color: theme.palette.mode === 'dark' ? '#fff' : 'rgba(0,0,0,0.87)',
              '& .MuiSlider-track': {
                border: 'none',
              },
              '& .MuiSlider-thumb': {
                width: 24,
                height: 24,
                backgroundColor: '#fff',
                '&:before': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                },
                '&:hover, &.Mui-focusVisible, &.Mui-active': {
                  boxShadow: 'none',
                },
              },
            }}
          />
          <VolumeUpRounded htmlColor={lightIconColor} />
        </Stack>
      </Widget>
    </Box>
  );
}

interface EndedBlindtestMainContentProps {
  baseQuestion: BlindtestQuestion;
}

function EndedBlindtestMainContent({ baseQuestion }: EndedBlindtestMainContentProps) {
  const bq = baseQuestion as { answer?: { image?: string; title?: string; author?: string; source?: string } };
  const { image, title, author, source } = bq.answer ?? {};

  if (!image) {
    return (
      <Box className="flex flex-col h-3/4 w-[90%] items-center justify-center space-y-2">
        <span className="2xl:text-4xl text-green-500">
          <strong>{title}</strong>
        </span>
        {author && (
          <span className="2xl:text-4xl text-green-500">
            {QUESTION_ELEMENT_TO_EMOJI['author']} {author}
          </span>
        )}
        {source && (
          <span className="2xl:text-4xl text-green-500">
            {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{source}</i>
          </span>
        )}
      </Box>
    );
  }
  return (
    <Box className="flex flex-row h-full w-[90%] items-center justify-center space-x-8">
      <Box className="flex flex-col h-3/4 max-w-1/2 items-end justify-end">
        <NextImage url={image} alt={source || ''} />
      </Box>
      <Box className="flex flex-col h-3/4 max-w-1/2 items-start justify-center space-y-2">
        <span className="2xl:text-4xl text-green-500">
          <strong>{title}</strong>
        </span>
        {author && (
          <span className="2xl:text-4xl text-green-500">
            {QUESTION_ELEMENT_TO_EMOJI['author']} {author}
          </span>
        )}
        {source && (
          <span className="2xl:text-4xl text-green-500">
            {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{source}</i>
          </span>
        )}
      </Box>
    </Box>
  );
}

const Widget = styled('div')(({ theme }) => ({
  padding: 16,
  borderRadius: 16,
  width: 500,
  maxWidth: '100%',
  margin: 'auto',
  position: 'relative',
  zIndex: 1,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
  backdropFilter: 'blur(40px)',
}));

const CoverImage = styled('div')({
  width: 100,
  height: 100,
  objectFit: 'cover',
  overflow: 'hidden',
  justifyItems: 'center',
  flexShrink: 0,
  borderRadius: 8,
  backgroundColor: 'rgba(0,0,0,0.08)',
  '& > img': {
    width: '100%',
  },
});
