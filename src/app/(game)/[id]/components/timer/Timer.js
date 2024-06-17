import { useState, useRef, useEffect } from 'react'

import clsx from 'clsx'

const INTERVAL_MS = 10
const CRITICAL_MS = 5000

export default function Timer({ timer, serverTimeOffset, onTimerEnd = () => { } }) {
    const statusRef = useRef(null)
    const durationRef = useRef(null)
    const timestampRef = useRef(null)

    const startMillisecond = timer.forward ? 0 : (timer.duration * 1000)
    const endMillisecond = timer.forward ? (timer.duration * 1000) : 0

    const [milliseconds, setMilliSeconds] = useState(startMillisecond)
    const timerId = useRef()

    const startTimer = () => {
        console.log("startTimer", Date.now())
        timerId.current = setInterval(() => {
            const elapsedTimeMs = Date.now() - timer.timestamp.toMillis() + serverTimeOffset
            const timeLeftMs = milliseconds - elapsedTimeMs
            setMilliSeconds(() => timer.forward ? elapsedTimeMs : timeLeftMs)
        }, INTERVAL_MS)
    }

    const stopTimer = () => {
        clearInterval(timerId.current)
        timerId.current = startMillisecond
    }

    const resetTimer = () => {
        stopTimer()
        setMilliSeconds(startMillisecond)
    }

    const endTimer = () => {
        stopTimer()
        onTimerEnd()
    }

    useEffect(() => {
        if (statusRef.current === timer.status && durationRef.current === timer.duration && timestampRef.current === timer.timestamp)
            return
        statusRef.current = timer.status
        durationRef.current = timer.duration
        timestampRef.current = timer.timestamp
        if (statusRef.current === 'start') {
            startTimer()
        }
        if (statusRef.current === 'stop') {
            stopTimer()
        }
        if (statusRef.current === 'reset') {
            resetTimer()
        }
        if (statusRef.current === 'end') {
            endTimer()
        }

    }, [timer.status, timer.duration, timer.timestamp])


    if ((!timer.forward && milliseconds <= endMillisecond) || (timer.forward && milliseconds >= endMillisecond)) {
        endTimer()
    }

    const isCritical = Math.abs(milliseconds - endMillisecond) <= CRITICAL_MS

    return (
        <span
            className={clsx(
                isCritical && 'text-red-500',
                timer.status === 'reset' && 'opacity-50 text-yellow-500',
                timer.status === 'stop' && 'opacity-50',
            )}
        >
            {/* {milliseconds <= endMillisecond ? '0.00' : `${Math.floor(milliseconds / 1000)}.${(milliseconds % 1000).toString().padStart(2, '0')}`} */}
            {milliseconds <= endMillisecond ? '0' : Math.ceil(milliseconds / 1000)}
        </span>
    )
}