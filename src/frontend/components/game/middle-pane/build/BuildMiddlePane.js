'use client'

import { useGameContext } from '@/frontend/contexts'

import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

export default function BuildMiddlePane() {
    const game = useGameContext()

    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-2xl animate-fade-in">
                <div className="mb-8 animate-slide-up">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Game Under Construction
                    </h1>
                    <p className="text-xl text-slate-300">
                        {game.title} is being prepared for an amazing experience!
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 animate-slide-up-delayed">
                    <div className="w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-400">
                        Please check back later when the game is ready.
                    </p>
                </div>
            </div>
        </div>
    )
} 