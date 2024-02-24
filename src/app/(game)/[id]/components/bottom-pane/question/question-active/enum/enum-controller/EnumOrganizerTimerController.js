import { useUserContext } from '@/app/contexts'
import { useGameContext } from '@/app/(game)/contexts'

import { Button, ButtonGroup, Tooltip } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SkipNextIcon from '@mui/icons-material/SkipNext'

import Timer from '@/app/(game)/[id]/components/Timer'

import { resetTimer, startTimer, stopTimer, endTimer } from '@/app/(game)/lib/timer'
import { useAsyncAction } from '@/lib/utils/async'

export default function EnumOrganizerTimerController({ question, timer, onTimerEnd }) {
    const game = useGameContext()
    const user = useUserContext()

    const [handleEndTimer, isEnding] = useAsyncAction(async () => {
        await endTimer(game.id)
        await onTimerEnd()
    })

    const [handleStartTimer, isStarting] = useAsyncAction(async () => {
        await startTimer(game.id, user.id)
    })

    const [handleStopTimer, isStopping] = useAsyncAction(async () => {
        stopTimer(game.id)
    })

    const [handleResetTimer, isResetting] = useAsyncAction(async () => {
        resetTimer(game.id)
    })

    return (
        <div className='flex flex-col items-center'>
            <span className='text-4xl'><Timer
                forward={false}
                duration={question.details.thinkingTime}
                status={timer.status}
                onTimerEnd={handleEndTimer} />
            </span>

            <ButtonGroup
                variant='contained'
            >
                {(timer.status === 'resetted' || timer.status === 'stopped' || timer.status === 'ended') ?
                    <StartTimerButton onClick={handleStartTimer} disabled={isStarting} /> :
                    <StopTimerButton onClick={handleStopTimer} disabled={isStopping} />
                }
                <ResetTimerButton onClick={handleResetTimer} disabled={timer.status === 'resetted' || isResetting} />
                <EndTimerButton onClick={handleEndTimer} disabled={isEnding} />
            </ButtonGroup>
        </div>
    )
}


function StartTimerButton({ onClick, disabled }) {
    return (
        <Tooltip title='Start timer' placement='top'>
            <span>
                <IconButton size='large' color='inherit' onClick={onClick} disabled={disabled}><PlayArrowIcon /></IconButton>
            </span>
        </Tooltip>
    )
}

function StopTimerButton({ onClick, disabled }) {
    return (
        <Tooltip title='Stop timer' placement='top'>
            <span>
                <IconButton size='large' color='inherit' onClick={onClick} disabled={disabled}><PauseIcon /></IconButton>
            </span>
        </Tooltip>
    )
}

function ResetTimerButton({ onClick, disabled }) {
    return (
        <Tooltip title='Reset timer' placement='top'>
            <span>
                <IconButton size='large' color='warning' onClick={onClick} disabled={disabled}><RestartAltIcon /></IconButton>
            </span>
        </Tooltip>
    )
}

function EndTimerButton({ onClick, disabled }) {
    return (
        <Tooltip title='End timer' placement='top'>
            <span>
                <IconButton size='large' color='warning' onClick={onClick} disabled={disabled}><SkipNextIcon /></IconButton>
            </span>
        </Tooltip>
    )
}