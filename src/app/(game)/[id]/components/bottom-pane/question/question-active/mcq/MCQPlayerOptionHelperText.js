import { useUserContext } from "@/app/contexts"
import { useRoleContext } from "@/app/(game)/contexts"

import { useParams } from "next/navigation"

import { GAMES_COLLECTION_REF } from "@/lib/firebase/firestore"
import { doc } from "firebase/firestore"
import { useDocumentDataOnce } from "react-firebase-hooks/firestore"

import { prependMCQOptionWithEmoji } from "@/lib/utils/question/mcq"

export default function MCQPlayerOptionHelperText({ realtime, lang = 'fr-FR' }) {
    const { id: gameId } = useParams()
    const myRole = useRoleContext()
    const user = useUserContext()

    const [player, playerLoading, playerError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId, 'players', realtime.playerId))
    const [team, teamLoading, teamError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId, 'teams', realtime.teamId))

    if (playerError) {
        return <p><strong>Error: </strong>{JSON.stringify(playerError)}</p>
    }
    if (teamError) {
        return <p><strong>Error: </strong>{JSON.stringify(teamError)}</p>
    }
    if (playerLoading || teamLoading) {
        return myRole === 'organizer' && <p>Loading player info...</p>
    }
    if (!player) {
        return <p>Player not found</p>
    }
    if (!team) {
        return <p>Team not found</p>
    }

    return <span><span style={{ color: team.color }}>{player.name}</span> {HAS_CHOSEN_TEXT[lang]} {prependMCQOptionWithEmoji(realtime.option)}</span>

}

const HAS_CHOSEN_TEXT = {
    'en': "has chosen",
    'fr-FR': "a choisi"
}