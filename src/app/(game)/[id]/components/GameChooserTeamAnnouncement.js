import { useGameContext, useTeamContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, doc, query, where } from 'firebase/firestore'
import { useDocumentData, useCollection } from 'react-firebase-hooks/firestore'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'


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

export function GameChooserHelperText({ chooserTeamId, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()
    const myTeam = useTeamContext()
    const myRole = useRoleContext()

    const [chooserTeam, chooserTeamLoading, chooserTeamError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'teams', chooserTeamId))
    const [choosers, choosersLoading, choosersError] = useCollection(query(collection(GAMES_COLLECTION_REF, game.id, 'players'), where('teamId', '==', chooserTeamId)))

    if (chooserTeamError) {
        return <p><strong>Error: {JSON.stringify(chooserTeamError)}</strong></p>
    }
    if (choosersError) {
        return <p><strong>Error: {JSON.stringify(choosersError)}</strong></p>
    }
    if (chooserTeamLoading || choosersLoading) {
        return <></>
    }
    if (!chooserTeam || !choosers) {
        return <></>
    }

    const isChooser = myRole === 'player' && chooserTeamId === myTeam
    const teamHasManyPlayers = choosers.docs.length > 1
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
    return gameStatus === 'question_active' ? CHOOSER_ACTION_PLAY_TEXT[lang] : CHOOSER_ACTION_CHOOSE_TEXT[lang];
}

const CHOOSER_ACTION_PLAY_TEXT = {
    'en': "play",
    'fr-FR': "jouer"
}

const CHOOSER_ACTION_CHOOSE_TEXT = {
    'en': "choose",
    'fr-FR': "choisir"
}