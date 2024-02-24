
import { memo, useState, useEffect } from 'react'
import { useGameContext } from '@/app/(game)/contexts'
import { useUserContext } from '@/app/contexts'

import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { addSoundToQueue } from '@/app/(game)/lib/sounds'
import { loadSounds } from '@/lib/utils/sounds'

const SoundboardController = memo(function SoundboardController({ }) {
    // console.log("RENDERING SoundboardController")
    const game = useGameContext()
    const user = useUserContext()

    const [sounds, setSounds] = useState({})
    useEffect(() => {
        const loadSoundsData = async () => {
            const loadedSounds = await loadSounds()
            setSounds(loadedSounds)
        }
        loadSoundsData()
    }, [])

    const handleSelectSound = async (e) => {
        e.preventDefault()
        addSoundToQueue(game.id, e.target.value, user.id)
    }

    return (
        <>
            <FormControl sx={{ m: 1, minWidth: 150 }}>
                <InputLabel
                    id='soundboard-input-label'
                    sx={{ color: 'inherit' }}
                >
                    Soundboard
                </InputLabel>

                <Select
                    id='sound-select'
                    labelId='sound-select-label'
                    value={''}
                    // label="My sound"
                    onChange={handleSelectSound}
                    autoWidth
                    sx={{
                        color: 'inherit',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'inherit',
                        },
                        // MuiInputBase-root-MuiOutlinedInput-root-MuiSelect-root.Mui-focused
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'red',
                        },
                        '& .MuiSelect-icon': {
                            color: 'inherit'
                        },
                    }}
                >
                    {Object.values(sounds).map((sound, idx) => <MenuItem key={idx} value={sound.name}>{sound.name}</MenuItem>)}
                </Select>
            </FormControl>
        </>
    )

})


export default SoundboardController