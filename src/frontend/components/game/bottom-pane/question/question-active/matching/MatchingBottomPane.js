import { UserRole } from '@/backend/models/users/User'
import { QuestionType } from '@/backend/models/questions/QuestionType'

import { DEFAULT_LOCALE } from '@/frontend/utils/locales'
import { GameMatchingQuestion } from '@/backend/models/questions/Matching'

import RoundMatchingQuestionRepository from '@/backend/repositories/question/game/GameMatchingQuestionRepository'



import { useGameContext, useGameRepositoriesContext, useRoleContext, useTeamContext } from '@/frontend/contexts'

import { GameChooserHelperText } from '@/frontend/components/game/GameChooserTeamAnnouncement';
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/question-active/ResetQuestionButton'
import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/question-active/EndQuestionButton'

import { CircularProgress } from '@mui/material'

import clsx from 'clsx'


export default function MatchingBottomPane({ }) {
    const { chooserRepo } = useGameRepositoriesContext()
    const { chooser, loading: chooserLoading, error: chooserError } = chooserRepo.useCurrentChooser()

    if (chooserError) {
        return <p><strong>Error: {JSON.stringify(chooserError)}</strong></p>
    }
    if (chooserLoading) {
        return <></>
    }
    if (!chooser) {
        return <></>
    }

    return (
        <div className='flex flex-row h-full divide-x divide-solid'>
            <div className='basis-3/4'>
                <MatchingController chooser={chooser} />
            </div>
            <div className='basis-1/4'>
                <MatchingRunningOrder chooser={chooser} />
            </div>
        </div>
    )

}

function MatchingController({ chooser }) {
    const myRole = useRoleContext()

    const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx]

    return (
        <div className='flex flex-col h-full w-full items-center justify-around'>
            <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>
            {myRole === UserRole.PLAYER && <MatchingPlayerQuestionController />}
            {myRole === UserRole.ORGANIZER && <MatchingOrganizerQuestionController />}
        </div>
    )
}

function MatchingPlayerQuestionController({ lang = DEFAULT_LOCALE }) {
    const game = useGameContext()
    const myTeam = useTeamContext()

    const { roundRepo } = useGameRepositoriesContext()
    const { round, roundLoading, roundError } = roundRepo.useRound(game.currentRound)

    const gameQuestionRepo = new RoundMatchingQuestionRepository(game.id, game.currentRound)
    const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion)

    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (gameQuestionError) {
        return <p><strong>Error: {JSON.stringify(gameQuestionError)}</strong></p>
    }
    if (roundLoading || gameQuestionLoading) {
        return <CircularProgress />
    }
    if (!round || !gameQuestion) {
        return <></>
    }

    const teamNumMistakes = gameQuestion.teamNumMistakes
    const remainingMistakes = round.maxMistakes - (teamNumMistakes[myTeam] || 0)
    const maxMistakes = round.maxMistakes

    const isCanceled = GameMatchingQuestion.matchingTeamIsCanceled(myTeam, teamNumMistakes, maxMistakes)

    return isCanceled ?
        <span className='2xl:text-3xl text-red-500'>🙅 {MAX_TRIES_EXCEEDED_TEXT[lang]} ({maxMistakes})</span> :
        <span className='2xl:text-3xl'>Tu peux faire encore <span className='font-bold text-red-500'>{remainingMistakes} erreur{remainingMistakes > 1 && 's'}</span>.</span>
    return

}

const MAX_TRIES_EXCEEDED_TEXT = {
    'en': "You have exceeded the maximum number of mistakes!",
    'fr-FR': "Tu as excédé le nombre maximum d'erreurs!"
}

function MatchingOrganizerQuestionController({ }) {
    return (
        <div className='flex flex-row w-full justify-end'>
            <ResetQuestionButton questionType={QuestionType.MATCHING} />
            <EndQuestionButton questionType={QuestionType.MATCHING} />
        </div>
    )
}



function MatchingRunningOrder({ chooser, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const gameQuestionRepo = new RoundMatchingQuestionRepository(game.id, game.currentRound)
    const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion)


    const { teamsRepo } = useGameRepositoriesContext()
    const { teams, teamsLoading, teamsError } = teamsRepo.useTeams()

    if (gameQuestionError) {
        return <p><strong>Error: {JSON.stringify(gameQuestionError)}</strong></p>
    }
    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (gameQuestionLoading || teamsLoading) {
        return <></>
    }
    if (!gameQuestion || !teams) {
        return <></>
    }

    const canceled = gameQuestion.canceled
    const teamNumMistakes = gameQuestion.teamNumMistakes
    const canceledSet = new Set(canceled)

    const chooserOrder = chooser.chooserOrder
    const chooserIdx = chooser.chooserIdx

    return (
        <div className='flex flex-col h-full w-full items-center justify-center'>

            <h2 className='2xl:text-xl 2xl:text-2xl font-bold'>👥 <span className='underline'>{RUNNING_ORDER_TEXT[lang]}</span></h2>

            <ol className='overflow-auto'>
                {chooserOrder.map((teamId, idx) => {
                    const isCanceled = canceledSet.has(teamId)
                    return <li key={idx} className={clsx(
                        'xl:text-xl 2xl:text-2xl',
                        idx === chooserIdx && 'text-focus',
                        isCanceled && 'line-through opacity-25'
                    )}>
                        {idx + 1}. {getTeamName(teams, teamId)} {(teamId in teamNumMistakes) && `(${teamNumMistakes[teamId]})`}
                    </li>
                })}
            </ol>
        </div>
    )
}

function getTeamName(teams, teamId) {
    return teams.docs.find(doc => doc.id === teamId).data().name
    // return teams.find(team => team.id === teamId).name
}

const RUNNING_ORDER_TEXT = {
    'en': "Running order",
    'fr-FR': "Ordre de passage"
}