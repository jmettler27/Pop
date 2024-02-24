import { useState, useRef, useEffect } from 'react'
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { Box, Typography, Slider, IconButton, Stack } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import VolumeDownRounded from '@mui/icons-material/VolumeDownRounded';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import FastForwardIcon from '@mui/icons-material/FastForward';

import FirebaseImage from '@/app/(game)/[id]/components/FirebaseImage';


export default function BlindtestMainContent({ question, showComplete }) {
    const game = useGameContext()

    return <>
        {game.status === 'question_active' && <ActiveBlindtestMainContent question={question} showComplete={showComplete} />}
        {game.status === 'question_end' && <BlindtestAnswerImage question={question} />}
    </>
}

function ActiveBlindtestMainContent({ question, showComplete }) {
    const game = useGameContext()

    const audioRef = useRef(null)
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(0.25)
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        audioRef.current.volume = volume
        audioRef.current.autoplay = true

        if (game.status === 'question_end') {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play()
            setIsPlaying(true)
        }
    }, [game.status])



    const theme = useTheme();
    const mainIconColor = theme.palette.mode === 'dark' ? '#fff' : '#000';
    const lightIconColor = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

    const formatTime = (time) => {
        const minute = Math.floor(time / 60);
        const secondLeft = Math.floor((time - minute * 60) % 60);
        return `${minute}:${secondLeft < 10 ? `0${secondLeft}` : secondLeft}`;
    }

    const handlePlayPauseReplay = () => {
        if (currentTime < duration) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        } else {
            audioRef.current.currentTime = 0
            audioRef.current.play()
            setIsPlaying(true)
        }
    }

    const handleTimeChange = (event, value) => {
        audioRef.current.currentTime = value
        setCurrentTime(value)
    }

    const handleVolumeChange = (event, value) => {
        audioRef.current.volume = value
        setVolume(value)
    }

    const handleLoadedMetadata = () => {
        setDuration(audioRef.current.duration)
    }

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime)
    }


    return (
        <Box className='w-full overflow-hidden'>
            <Widget>

                {/* Audio general info */}
                <Box className='flex items-center'>

                    <CoverImage>
                        <span className='text-5xl w-full h-full flex flex-col items-center justify-center'>🎵</span>
                    </CoverImage>

                    <audio
                        ref={audioRef}
                        src={question.details.audio}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                    />

                    <Box sx={{ ml: 1.5, minWidth: 0 }}>
                        <Typography variant='h6' color='text.secondary' fontWeight={500}>
                            {game.title} (OST)
                        </Typography>

                        <Typography variant='h5' noWrap>
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
                    valueLabelDisplay='auto'
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
                                boxShadow: `0px 0px 0px 8px ${theme.palette.mode === 'dark'
                                    ? 'rgb(255 255 255 / 16%)'
                                    : 'rgb(0 0 0 / 16%)'
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

                <Box className='flex items-center justify-between' sx={{ mt: -2 }}>
                    <Typography>{formatTime(currentTime)}</Typography>
                    <Typography>-{formatTime(duration - currentTime)}</Typography>
                </Box>


                {/* Audio pause button */}
                <Box className='flex flex-row items-center justify-center' sx={{ mt: -1 }}
                >
                    {/* Fast Rewind */}
                    <IconButton
                        aria-label="fast rewind"
                        onClick={() => audioRef.current.currentTime -= 10}
                    >
                        <FastRewindIcon className='text-4xl' htmlColor={mainIconColor} />
                    </IconButton>

                    {/* Play/Pause */}
                    <IconButton
                        aria-label={(currentTime < duration) ? (isPlaying ? 'play' : 'pause') : 'replay'}
                        onClick={handlePlayPauseReplay}
                    >
                        {(currentTime < duration) ? (isPlaying ?
                            <PauseRounded className='text-5xl' htmlColor={mainIconColor} /> :
                            <PlayArrowRounded sx={{ fontSize: '3rem' }} htmlColor={mainIconColor} />
                        ) :
                            <PlayArrowRounded sx={{ fontSize: '3rem' }} htmlColor={mainIconColor} />
                        }
                    </IconButton>

                    {/* Fast Forward */}
                    <IconButton
                        aria-label="fast forward"
                        onClick={() => audioRef.current.currentTime += 10}
                    >
                        <FastForwardIcon className='text-4xl' htmlColor={mainIconColor} />
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

function BlindtestAnswerImage({ question }) {
    const answer = question.details.answer
    return (
        <Box className='flex items-center justify-center w-2/3 h-2/3'>
            <FirebaseImage url={answer.image} alt={answer.source || ''} />
        </Box>
    )
}

const Widget = styled('div')(({ theme }) => ({
    padding: 16,
    borderRadius: 16,
    width: 500,
    maxWidth: '100%',
    margin: 'auto',
    position: 'relative',
    zIndex: 1,
    backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
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

const TinyText = styled(Typography)({
    fontSize: '0.75rem',
    opacity: 0.38,
    fontWeight: 500,
    letterSpacing: 0.2,
});