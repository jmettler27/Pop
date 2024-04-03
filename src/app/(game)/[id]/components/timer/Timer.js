import { useState, useRef, useEffect } from 'react'
import { useRoleContext } from "@/app/(game)/contexts"

import clsx from 'clsx'

export default function Timer({ timer, onTimerEnd = () => { } }) {
    const myRole = useRoleContext()

    const statusRef = useRef(null)

    const startSecond = timer.forward ? 0 : timer.duration
    const endSecond = timer.forward ? timer.duration : 0

    const [seconds, setSeconds] = useState(startSecond)
    const timerId = useRef()

    const startTimer = () => {
        timerId.current = setInterval(() => {
            setSeconds(seconds => (timer.forward) ? seconds + 1 : seconds - 1)
        }, 1000)
    }

    const stopTimer = () => {
        clearInterval(timerId.current)
        timerId.current = startSecond
    }

    const resetTimer = () => {
        stopTimer()
        if (seconds) {
            setSeconds(startSecond)
        }
    }

    useEffect(() => {
        if (statusRef.current === timer.status)
            return
        statusRef.current = timer.status
        if (statusRef.current === 'started') {
            startTimer()
        }
        if (statusRef.current === 'stopped') {
            stopTimer()
        }
        if (statusRef.current === 'resetted') {
            resetTimer()
        }

    }, [timer.status])


    if ((timer.forward && seconds >= endSecond) || (!timer.forward && seconds <= endSecond)) {
        stopTimer()
        onTimerEnd(myRole)
    }

    const isCritical = Math.abs(seconds - endSecond) <= 5

    return (
        <span
            className={clsx(
                isCritical && 'text-red-500',
                statusRef.current === 'resetted' && 'text-yellow-500',
                statusRef.current === 'stopped' && 'opacity-50',
            )}
        >
            {seconds}
        </span>
    )
}