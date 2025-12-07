import { GameStatus } from '@/backend/models/games/GameStatus'
import { UserRole } from '@/backend/models/users/User'


import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

import { useGameContext, useTeamContext, useRoleContext, useGameRepositoriesContext } from '@/frontend/contexts'

export default function GameChooserTeamAnnouncement({ }) {
    const game = useGameContext()

    const { chooserRepo } = useGameRepositoriesContext()
    const { chooser, chooserLoading, chooserError } = chooserRepo.useChooser()

    if (chooserError) {
        return <p><strong>Error: </strong>{JSON.stringify(chooserError)}</p>
    }
    if (chooserLoading) {
        return <></>
    }
    if (!chooser) {
        return <></>
    }

    const chooserTeamId = chooser.chooserOrder.length > 0 ? chooser.chooserOrder[chooser.chooserIdx] : null
    return chooserTeamId && <GameChooserHelperText chooserTeamId={chooserTeamId} />
}

export function GameChooserHelperText({ chooserTeamId, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()
    const myTeam = useTeamContext()
    const myRole = useRoleContext()

    const { teamRepo, playerRepo } = useGameRepositoriesContext()

    const { team, loading: teamLoading, error: teamError } = teamRepo.useTeam(chooserTeamId)
    const { players, loading: playersLoading, error: playersError } = playerRepo.useTeamPlayers(chooserTeamId)

    if (teamError) {
        return <p><strong>Error: {JSON.stringify(teamError)}</strong></p>
    }
    if (playersError) {
        return <p><strong>Error: {JSON.stringify(playersError)}</strong></p>
    }
    if (teamLoading || playersLoading) {
        return <></>
    }
    if (!team || !players) {
        return <></>
    }

    const isChooser = myRole === UserRole.PLAYER && chooserTeamId === myTeam
    const teamHasManyPlayers = players.length > 1
    const chooserActionText = chooserAction(game.status, lang)

    if (isChooser) {
        if (lang === 'fr-FR')
            return <span>🫵 C&apos;est à <span style={{ color: chooserTeam.color }}>{teamHasManyPlayers ? "ton équipe" : "toi"}</span> de {chooserActionText} </span>
        if (lang === 'en')
            return <span>🫵 It&apos;s your turn to {chooserActionText}</span>
    }
    if (teamHasManyPlayers) {
        if (lang === 'fr-FR')
            return <span>C&apos;est à l&apos;équipe <span style={{ color: chooserTeam.color }}>{chooserTeam.name}</span> de {chooserActionText}</span>
        if (lang === 'en')
            return <span>It&apos;s Team <span style={{ color: chooserTeam.color }}>{chooserTeam.name}</span>&apos;s turn to {chooserActionText}</span>
    }
    const chooserPlayerName = choosers.docs[0].data().name
    if (lang === 'fr-FR')
        return <span>C&apos;est à <span style={{ color: chooserTeam.color }}>{chooserPlayerName}</span> de {chooserActionText}</span>
    if (lang === 'en')
        return <span>It&apos;s <span style={{ color: chooserTeam.color }}>{chooserPlayerName}</span>&apos;s turn to {chooserActionText}</span>
}

const chooserAction = (gameStatus, lang) => {
    return gameStatus === GameStatus.QUESTION_ACTIVE ? CHOOSER_ACTION_PLAY_TEXT[lang] : CHOOSER_ACTION_CHOOSE_TEXT[lang];
}

const CHOOSER_ACTION_PLAY_TEXT = {
    'en': "play",
    'fr-FR': "jouer"
}

const CHOOSER_ACTION_CHOOSE_TEXT = {
    'en': "choose",
    'fr-FR': "choisir"
}