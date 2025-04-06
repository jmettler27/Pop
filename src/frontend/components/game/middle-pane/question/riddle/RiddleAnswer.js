import { GameStatus } from '@/backend/models/games/GameStatus';
import { QuestionType } from '@/backend/models/questions/QuestionType';

import RoundRiddleQuestionRepository from '@/backend/repositories/question/game/GameRiddleQuestionRepository';

import { getRandomElement } from '@/backend/utils/arrays';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { useGameContext } from '@/frontend/contexts'
import PlayerName, { WinnerName } from '@/frontend/components/game/PlayerName'


export default function RiddleAnswer({ baseQuestion }) {

    return (
        <div className='flex flex-col h-full items-center'>
            <RiddleAnswerText baseQuestion={baseQuestion} />
            <RiddleWinnerInfo />
        </div>
    )
}

function RiddleAnswerText({ baseQuestion }) {
    const answer = baseQuestion.answer

    switch (baseQuestion.type) {
        case QuestionType.PROGRESSIVE_CLUES:
            return <span className='2xl:text-4xl font-bold text-green-500'>{answer.title}</span>
        default:
            return <></>
    }

}

function RiddleWinnerInfo({ lang = DEFAULT_LOCALE }) {
    const game = useGameContext()


    const roundRiddleQuestionRepo = new RoundRiddleQuestionRepository(game.id, game.currentRound)
    const { gameQuestion, gameQuestionLoading, gameQuestionError } = roundRiddleQuestionRepo.useQuestion(game.currentQuestion)

    if (gameQuestionError) {
        return <p><strong>Error: {JSON.stringify(gameQuestionError)}</strong></p>
    }
    if (gameQuestionLoading) {
        return <p>Loading game question...</p>
    }
    if (!gameQuestion) {
        return <></>
    }

    if (!(gameQuestion.winner && game.status === GameStatus.QUESTION_END)) {
        return <></>
    }

    return <span className='2xl:text-3xl'>{RIDDLE_WINNER_TEXT[lang]} <strong><WinnerName playerId={gameQuestion.winner.playerId} teamId={gameQuestion.winner.teamId} /></strong>! 🥳</span>
}

const RIDDLE_WINNER_TEXT_EN = [
    "GG",
    "Congrats",
    "Hats off",
    "Well done",
]

const RIDDLE_WINNER_TEXT_FR = [
    "GG",
    "Bravo",
    "Félicitations",
    "Chapeau",
    "Bien joué",
    "Super",
    "Excellent",
    "Parfait",
];

const RIDDLE_WINNER_TEXT = {
    'en': getRandomElement(RIDDLE_WINNER_TEXT_EN),
    'fr-FR': getRandomElement(RIDDLE_WINNER_TEXT_FR)
}