'use client';

import GameErrorScreen from '@/frontend/components/game/GameErrorScreen';
import { GameNotFoundError, InvalidGameStateError } from '@/backend/errors/GameError';

export default function Error({ error, reset }) {
    const getErrorMessage = () => {
        if (error instanceof GameNotFoundError) {
            return "This game doesn't exist or has been deleted.";
        }
        if (error instanceof InvalidGameStateError) {
            return "This game is in an invalid state. Please try again later.";
        }
        return "An unexpected error occurred. Please try again.";
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <GameErrorScreen errorMessage={getErrorMessage()} />
            <div className="mt-4 space-x-4">
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Try again
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Return to home
                </button>
            </div>
        </div>
    );
} 