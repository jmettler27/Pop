import { useState, useRef, useEffect, memo } from 'react'

import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, query, onSnapshot } from 'firebase/firestore'

import { Box, Slider, IconButton, Stack } from '@mui/material'
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded'
import VolumeDownRounded from '@mui/icons-material/VolumeDownRounded'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'

import { loadSounds } from '@/lib/utils/sounds'

const initVolume = 0.4

const SoundboardAudioPlayer = memo(function SoundboardAudioPlayer({ }) {
    console.log("RENDERING SoundboardAudioPlayer")

    const { id: gameId } = useParams()
    const [sounds, setSounds] = useState(null)
    const [volume, setVolume] = useState(initVolume)

    const newestSoundIdRef = useRef(null)
    console.log("Newest sound id: ", newestSoundIdRef.current)

    useEffect(() => {
        const loadSoundsData = async () => {
            const loadedSounds = await loadSounds()
            setSounds(loadedSounds)
        }
        loadSoundsData()
    }, [])

    useEffect(() => {
        console.log("RERENDER USE EFFECT")
        if (sounds && Object.keys(sounds).length > 0) {
            const queueCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'realtime', 'sounds', 'queue')
            const q = query(queueCollectionRef)
            const unsubscribe = onSnapshot(q, snapshot => {
                console.log("==============================================================")
                snapshot.docChanges().forEach(change => {
                    if (change.type === "added") {
                        const newSound = { ...change.doc.data(), id: change.doc.id }
                        let playedSounds = JSON.parse(localStorage.getItem('playedSounds')) || [];
                        if (newSound.id !== newestSoundIdRef.current && !playedSounds.includes(newSound.id)) {
                            newestSoundIdRef.current = newSound.id
                            playedSounds.push(newSound.id)
                            localStorage.setItem('playedSounds', JSON.stringify(playedSounds));
                            console.log("New sound: ", newSound);
                            const audio = new Audio(sounds[newSound.filename].url)
                            audio.volume = volume
                            audio.autoplay = true
                            audio.play()
                        }
                    }
                });
            })
            // Clean up the listener when the component unmounts
            return () => unsubscribe()
        }
    }, [sounds, volume])

    const handleVolumeChange = (event, value) => {
        // audio.volume = value
        setVolume(value)
    }

    return (
        <Box className='w-full overflow-hidden'>
            {/* Volume controller */}
            <Stack
                spacing={2}
                direction='row'
                sx={{ mb: 1, px: 1 }}
                alignItems='center'
            >
                {/* Mute/unmute button */}
                <IconButton
                    size='small'
                    aria-label='play/pause'
                    onClick={() => {
                        if (volume === 0) {
                            // Unmute
                            handleVolumeChange(null, initVolume)
                        } else {
                            // Mute
                            handleVolumeChange(null, 0)
                        }
                    }}
                    sx={{
                        '& .MuiSvgIcon-root': {
                            color: 'primary.main'
                        }
                    }}
                >
                    {volume === 0 ? <VolumeOffIcon /> : (
                        volume < 0.5 ? <VolumeDownRounded /> :
                            <VolumeUpRounded />
                    )}
                </IconButton>

                {/* Volume slider */}
                <Slider
                    aria-label='Volume'
                    orientation='horizontal'
                    value={volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={handleVolumeChange}
                />
            </Stack>
        </Box>
    )
})

export default SoundboardAudioPlayer