import * as React from 'react'

import { useGameContext } from '@/app/(game)/contexts'

import { styled } from '@mui/material/styles'
import SpeedDial, { SpeedDialProps } from '@mui/material/SpeedDial'
import SpeedDialIcon from '@mui/material/SpeedDialIcon'
import SpeedDialAction from '@mui/material/SpeedDialAction'

import ShareIcon from '@mui/icons-material/Share'
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic'
import HomeIcon from '@mui/icons-material/Home'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import WarningIcon from '@mui/icons-material/Warning';

import { Backdrop } from '@mui/material'
import SoundboardController from '../soundboard/SoundboardController'
import GameRestartDialog from './GameRestartDialog'


import { endGame } from '@/app/(game)/lib/transitions'
import { resetGame, updateGameStatus, updateQuestion, updateQuestions } from '@/app/(game)/lib/game'
import { createGame } from '@/app/edit/[id]/lib/create-game'
import { addGameRound } from '@/app/edit/[id]/lib/edit-game'

const StyledSpeedDial = styled(SpeedDial)(({ theme }) => ({
    position: 'absolute',
    bottom: theme.spacing(2),
    left: theme.spacing(2),
}))


const actions = [
    { icon: <ShareIcon />, name: 'Share' },
    { icon: <LibraryMusicIcon />, name: 'Soundboard' },
    { icon: <HomeIcon />, name: 'Home' },
    { icon: <RestartAltIcon />, name: 'Reset game' },
    { icon: <WarningIcon />, name: 'End game' }

]


export default function OrganizerSpeedDial() {
    const game = useGameContext()

    const direction = 'up'

    const [component, setComponent] = React.useState(<></>)
    const [backdropOpen, setBackdropOpen] = React.useState(false)

    const handleBackdropOpen = () => {
        setBackdropOpen(true)
    }

    const handleBackdropClose = () => {
        setBackdropOpen(false)
    }


    const handleClick = async (e, name) => {
        e.preventDefault()
        switch (name) {
            case 'Share':
                // await updateQuestion()
                // await updateQuestions()
                break
            case 'Soundboard':
                handleBackdropOpen()
                setComponent(<SoundboardController />)
                break
            case 'Home':
                updateGameStatus(game.id, 'game_home')
                break
            case 'Reset game':
                resetGame(game.id)
                break
            case 'End game':
                endGame(game.id)
                break
        }
    }




    return (
        <>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={backdropOpen}
                onClick={handleBackdropClose} // => After selecting a sound, the backdrop closes => avoids spamming the participants with sounds
            >
                {component}
            </Backdrop>

            <StyledSpeedDial
                ariaLabel="SpeedDial of organizer"
                icon={<SpeedDialIcon />}
                direction={direction}
            >
                {actions.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                        tooltipPlacement='right'
                        tooltipOpen
                        onClick={(e) => handleClick(e, action.name)}
                    />
                ))}
            </StyledSpeedDial>
        </>
    )
}