import * as React from 'react'

import { styled } from '@mui/material/styles'
import SpeedDial, { SpeedDialProps } from '@mui/material/SpeedDial'
import SpeedDialIcon from '@mui/material/SpeedDialIcon'
import SpeedDialAction from '@mui/material/SpeedDialAction'

import ShareIcon from '@mui/icons-material/Share'
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic'
import HomeIcon from '@mui/icons-material/Home'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';

import { Backdrop } from '@mui/material'
import SoundboardController from '../soundboard/SoundboardController'


import { resetGame, updateGameStatus, resumeEditing, endGame } from '@/app/(game)/lib/game'
import { useParams, useRouter } from 'next/navigation'

const StyledSpeedDial = styled(SpeedDial)(({ theme }) => ({
    position: 'absolute',
    bottom: 16,
    right: 16,
}))


const actions = [
    { icon: <ShareIcon />, name: 'Share' },
    { icon: <LibraryMusicIcon />, name: 'Soundboard' },
    { icon: <HomeIcon />, name: 'Home' },
    { icon: <RestartAltIcon />, name: 'Reset game' },
    { icon: <EditIcon />, name: 'Resume editing' },

]


export default function OrganizerSpeedDial() {
    const { id: gameId } = useParams()

    const direction = 'up'
    const router = useRouter()

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
                break
            case 'Soundboard':
                handleBackdropOpen()
                setComponent(<SoundboardController />)
                break
            case 'Home':
                updateGameStatus(gameId, 'game_home')
                break
            case 'Reset game':
                resetGame(gameId)
                break
            case 'Resume editing':
                resumeEditing(gameId)
                router.push('/edit/' + gameId)
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
                        tooltipPlacement='left'
                        tooltipOpen
                        onClick={(e) => handleClick(e, action.name)}
                    />
                ))}
            </StyledSpeedDial>
        </>
    )
}