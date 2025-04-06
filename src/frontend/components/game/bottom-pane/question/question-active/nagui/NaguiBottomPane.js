import { UserRole } from '@/backend/models/users/User'

import RoundNaguiQuestionRepository from '@/backend/repositories/question/game/GameNaguiQuestionRepository'


import { useGameContext, useGameRepositoriesContext, useRoleContext } from '@/frontend/contexts'

import GameChooserOrder from '@/frontend/components/game/GameChooserOrder'
import { GameChooserHelperText } from '@/frontend/components/game/GameChooserTeamAnnouncement';
import NaguiPlayerController from '@/frontend/components/game/bottom-pane/question/question-active/nagui/NaguiPlayerController'
import NaguiPlayerOptionHelperText from '@/frontend/components/game/bottom-pane/question/question-active/nagui/NaguiPlayerOptionHelperText'
import NaguiOrganizerController from '@/frontend/components/game/bottom-pane/question/question-active/nagui/NaguiOrganizerController'

import { CircularProgress } from '@mui/material'


export default function NaguiBottomPane({ question: baseQuestion }) {
    const { chooserRepo } = useGameRepositoriesContext()
    const { chooser, loading: chooserLoading, error: chooserError } = chooserRepo.useChooser()
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

            {/* Left part: controller */}
            <div className='basis-3/4'>
                <NaguiController chooser={chooser} baseQuestion={baseQuestion} />
            </div>

            {/* Right part: list of riddle players who buzzed and/or were canceled */}
            <div className='basis-1/4'>
                <GameChooserOrder chooser={chooser} />
            </div>
        </div>
    )

}

function NaguiController({ chooser }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx]

    const gameQuestionRepo = new RoundNaguiQuestionRepository(game.id, game.currentRound)
    const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion)

    if (gameQuestionError) {
        return <p><strong>Error: {JSON.stringify(gameQuestionError)}</strong></p>
    }
    if (gameQuestionLoading) {
        return <CircularProgress />
    }
    if (!gameQuestion) {
        return <></>
    }

    switch (myRole) {
        case UserRole.ORGANIZER:
            return <NaguiOrganizerController gameQuestion={gameQuestion} />
        case UserRole.PLAYER:
            return <NaguiPlayerController chooserTeamId={chooserTeamId} gameQuestion={gameQuestion} />
        default:
            return <NaguiSpectatorController chooserTeamId={chooserTeamId} gameQuestion={gameQuestion} />
    }

}

function NaguiSpectatorController({ chooserTeamId, gameQuestion }) {
    return (
        <div className='flex flex-col h-full items-center justify-center'>
            {gameQuestion.option === null & <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>}
            {gameQuestion.option !== null && <span className='2xl:text-4xl font-bold'><NaguiPlayerOptionHelperText gameQuestion={gameQuestion} /></span>}
        </div>
    )
}