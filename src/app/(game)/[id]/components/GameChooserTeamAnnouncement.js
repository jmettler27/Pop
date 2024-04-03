import { useGameContext, useTeamContext, useRoleContext } from '@/app/(game)/contexts'

import clsx from 'clsx'
import { CircularProgress } from '@mui/material'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, doc, query, where } from 'firebase/firestore'
import { useDocumentData, useCollection } from 'react-firebase-hooks/firestore'
import LoadingScreen from '@/app/components/LoadingScreen'


export default function GameChooserTeamAnnouncement({ }) {
    const game = useGameContext()

    const [states, statesLoading, statesError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'states'))
    if (statesError) {
        return <p><strong>Error: </strong>{JSON.stringify(statesError)}</p>
    }
    if (statesLoading) {
        return <></>
    }
    if (!states) {
        return <></>
    }

    const chooserTeamId = states.chooserOrder.length > 0 ? states.chooserOrder[states.chooserIdx] : null
    return chooserTeamId && <GameChooserHelperText chooserTeamId={chooserTeamId} />
}

export function GameChooserHelperText({ chooserTeamId, lang = 'en' }) {
    const game = useGameContext()
    const myTeam = useTeamContext()
    const myRole = useRoleContext()

    const [chooserTeam, chooserTeamLoading, chooserTeamError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'teams', chooserTeamId))
    const [chooserPlayers, chooserPlayersLoading, chooserPlayersError] = useCollection(query(collection(GAMES_COLLECTION_REF, game.id, 'players'), where('teamId', '==', chooserTeamId)))

    if (chooserTeamError) {
        return <p><strong>Error: {JSON.stringify(chooserTeamError)}</strong></p>
    }
    if (chooserPlayersError) {
        return <p><strong>Error: {JSON.stringify(chooserPlayersError)}</strong></p>
    }
    if (chooserTeamLoading || chooserPlayersLoading) {
        return <></>
    }
    if (!chooserTeam || !chooserPlayers) {
        return <></>
    }

    const isChooser = (myRole === 'player' && chooserTeamId === myTeam)
    const teamHasManyPlayers = (chooserPlayers.docs.length > 1)

    if (isChooser) {
        if (lang === 'fr-FR')
            return <span>🫵 C&apos;est à <span style={{ color: chooserTeam.color }}>{teamHasManyPlayers ? "ton équipe" : "toi"}</span> de {chooserAction(game.status, lang)} </span>
        if (lang === 'en')
            return <span>🫵 It&apos;s your turn to {chooserAction(game.status, lang)}</span>
    }
    if (teamHasManyPlayers) {
        if (lang === 'fr-FR')
            return <span>C&apos;est à l&apos;équipe <span style={{ color: chooserTeam.color }}>{chooserTeam.name}</span> de {chooserAction(game.status, lang)}</span>
        if (lang === 'en')
            return <span>It&apos;s Team <span style={{ color: chooserTeam.color }}>{chooserTeam.name}</span>&apos;s turn to {chooserAction(game.status, lang)}</span>
    }
    if (lang === 'fr-FR')
        return <span>C&apos;est à <span style={{ color: chooserTeam.color }}>{(chooserPlayers.docs[0].data().name)}</span> de {chooserAction(game.status, lang)}</span>
    if (lang === 'en')
        return <span>It&apos;s <span style={{ color: chooserTeam.color }}>{(chooserPlayers.docs[0].data().name)}</span>&apos;s turn to {chooserAction(game.status, lang)}</span>
}

const chooserAction = (gameStatus, lang) => {
    if (gameStatus === 'question_active')
        return CHOOSER_ACTION_PLAY_TEXT[lang]
    if (gameStatus === 'finale')
        return CHOOSER_ACTION_CHOOSE_TEXT[lang]
    return CHOOSER_ACTION_CHOOSE_TEXT[lang]
}

const CHOOSER_ACTION_PLAY_TEXT = {
    'en': "play",
    'fr-FR': "jouer"
}

const CHOOSER_ACTION_CHOOSE_TEXT = {
    'en': "choose",
    'fr-FR': "choisir"
}