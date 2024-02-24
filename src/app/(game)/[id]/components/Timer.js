import { useState, useRef, useEffect } from 'react'
import { useRoleContext } from "@/app/(game)/contexts"

import clsx from 'clsx'

export default function Timer({ forward, duration, status, onTimerEnd }) {
    const myRole = useRoleContext()

    const startSecond = forward ? 0 : duration
    const endSecond = forward ? duration : 0

    const [seconds, setSeconds] = useState(startSecond)
    const timerId = useRef()

    const startTimer = () => {
        timerId.current = setInterval(() => {
            setSeconds(seconds => (forward) ? seconds + 1 : seconds - 1)
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
        if (status === 'started') {
            startTimer()
        }
        if (status === 'stopped') {
            stopTimer()
        }
        if (status === 'resetted') {
            resetTimer()
        }

    }, [status])


    if ((forward && seconds >= endSecond) || (!forward && seconds <= endSecond)) {
        stopTimer()
        onTimerEnd(myRole)
    }

    const isCritical = Math.abs(seconds - endSecond) <= 5

    return <span className={clsx(
        // 'text-4xl',
        isCritical && 'text-red-500',
        status === 'resetted' && 'text-yellow-500',
        status === 'stopped' && 'opacity-50',
    )}>{seconds}</span>
}