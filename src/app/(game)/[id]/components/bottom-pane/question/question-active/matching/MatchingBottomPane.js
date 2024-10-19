import { useGameContext, useRoleContext, useTeamContext } from '@/app/(game)/contexts'

import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc, collection } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce, useCollection } from 'react-firebase-hooks/firestore'

import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement';
import ResetQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/ResetQuestionButton'
import EndQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/EndQuestionButton'

import { DEFAULT_LOCALE } from '@/lib/utils/locales'
import { MATCHING_MAX_NUM_MISTAKES, matchingTeamIsCanceled } from '@/lib/utils/question/matching'

import { CircularProgress } from '@mui/material'

import clsx from 'clsx'

export default function MatchingBottomPane({ }) {
    const { id: gameId } = useParams()

    const [gameStates, statesLoading, statesError] = useDocumentData(doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states'))
    if (statesError) {
        return <p><strong>Error: {JSON.stringify(statesError)}</strong></p>
    }
    if (statesLoading) {
        return <></>
    }
    if (!gameStates) {
        return <></>
    }

    return (
        <div className='flex flex-row h-full divide-x divide-solid'>
            <div className='basis-3/4'>
                <MatchingController gameStates={gameStates} />
            </div>
            <div className='basis-1/4'>
                <MatchingRunningOrder gameStates={gameStates} />
            </div>
        </div>
    )

}

function MatchingController({ gameStates }) {
    const myRole = useRoleContext()

    const chooserTeamId = gameStates.chooserOrder[gameStates.chooserIdx]

    return (
        <div className='flex flex-col h-full w-full items-center justify-around'>
            <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>
            {myRole === 'player' && <MatchingPlayerQuestionController />}
            {myRole === 'organizer' && <MatchingOrganizerQuestionController />}
        </div>
    )
}

function MatchingPlayerQuestionController({ lang = DEFAULT_LOCALE }) {
    const game = useGameContext()
    const myTeam = useTeamContext()


    const [round, roundLoading, roundError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion))
    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (roundLoading || realtimeLoading) {
        return <CircularProgress />
    }
    if (!round || !realtime) {
        return <></>
    }
    const { teamNumMistakes } = realtime
    const remainingMistakes = round.maxMistakes - (teamNumMistakes[myTeam] || 0)
    const maxMistakes = round.maxMistakes || MATCHING_MAX_NUM_MISTAKES

    const isCanceled = matchingTeamIsCanceled(myTeam, teamNumMistakes, maxMistakes)

    return isCanceled ?
        <span className='2xl:text-3xl text-red-500'>🙅 {MAX_TRIES_EXCEEDED_TEXT[lang]} ({maxMistakes})</span> :
        <span className='2xl:text-3xl'>Tu peux faire encore <span className='font-bold text-red-500'>{remainingMistakes} erreur{remainingMistakes > 1 && 's'}.</span></span>
    return

}

const MAX_TRIES_EXCEEDED_TEXT = {
    'en': "You have exceeded the maximum number of mistakes!",
    'fr-FR': "Tu as excédé le nombre maximum d'erreurs!"
}

function MatchingOrganizerQuestionController({ }) {
    return (
        <div className='flex flex-row w-full justify-end'>
            <ResetQuestionButton />
            <EndQuestionButton />
        </div>
    )
}



function MatchingRunningOrder({ gameStates, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [teams, teamsLoading, teamsError] = useCollection(collection(GAMES_COLLECTION_REF, game.id, 'teams'))
    const [questionRealtimeData, questionRealtimeLoading, questionRealtimeError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion))
    if (questionRealtimeError) {
        return <p><strong>Error: {JSON.stringify(questionRealtimeError)}</strong></p>
    }
    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (questionRealtimeLoading || teamsLoading) {
        return <></>
    }
    if (!questionRealtimeData || !teams) {
        return <></>
    }

    const { canceled, teamNumMistakes } = questionRealtimeData
    const canceledSet = new Set(canceled)

    const { chooserOrder, chooserIdx } = gameStates

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