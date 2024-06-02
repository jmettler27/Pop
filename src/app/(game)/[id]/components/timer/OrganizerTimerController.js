import { Button, ButtonGroup, Tooltip } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SkipNextIcon from '@mui/icons-material/SkipNext'

import Timer from '@/app/(game)/[id]/components/timer/Timer'

import { resetTimer, startTimer, stopTimer, endTimer } from '@/app/(game)/lib/timer'
import { useAsyncAction } from '@/lib/utils/async'
import { useParams } from 'next/navigation'

export default function OrganizerTimerController({ timer, serverTimeOffset, onTimerEnd }) {
    const { id: gameId } = useParams();

    const [handleTimerEnd, isEnding] = useAsyncAction(async () => {
        await onTimerEnd()
        // await endTimer(gameId)
    })

    const [handleStartTimer, isStarting] = useAsyncAction(async () => {
        await startTimer(gameId)
    })

    const [handleStopTimer, isStopping] = useAsyncAction(async () => {
        await stopTimer(gameId)
    })

    const [handleResetTimer, isResetting] = useAsyncAction(async () => {
        await resetTimer(gameId)
    })

    return (
        <div className='flex flex-col items-center'>
            <span className='2xl:text-4xl'>
                ⌛ <Timer
                    timer={timer}
                    serverTimeOffset={serverTimeOffset}
                    onTimerEnd={onTimerEnd} />
            </span>

            <ButtonGroup
                variant='contained'
            >
                {(timer.status === 'reset' || timer.status === 'stop' || timer.status === 'end') ?
                    <StartTimerButton onClick={handleStartTimer} disabled={isStarting} /> :
                    <StopTimerButton onClick={handleStopTimer} disabled={isStopping} />
                }
                <ResetTimerButton onClick={handleResetTimer} disabled={timer.status === 'reset' || isResetting} />
                <EndTimerButton onClick={handleTimerEnd} disabled={isEnding} />
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