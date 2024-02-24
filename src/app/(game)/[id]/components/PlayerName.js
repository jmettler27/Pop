import { useState, useEffect } from 'react'
import { useRoleContext } from '@/app/(game)/contexts'

import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc, getDoc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'


export default function PlayerName({ playerId, teamColor = true }) {
    const { id: gameId } = useParams()

    const myRole = useRoleContext()

    const [player, playerLoading, playerError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId, 'players', playerId))

    const [team, setTeam] = useState(null)
    const [teamLoading, setTeamLoading] = useState(true)
    const [teamError, setTeamError] = useState(null)

    useEffect(() => {
        if (player && player.teamId && teamColor) {
            getDoc(doc(GAMES_COLLECTION_REF, gameId, 'teams', player.teamId))
                .then((teamSnapshot) => {
                    if (teamSnapshot.exists()) {
                        setTeam(teamSnapshot.data())
                    } else {
                        setTeamError("Team not found")
                    }
                })
                .catch((error) => {
                    setTeamError(error.message)
                })
                .finally(() => {
                    setTeamLoading(false)
                })
        }
    }, [player])

    if (playerError) {
        return <p><strong>Error: </strong>{JSON.stringify(playerError)}</p>
    }
    if (playerLoading || (teamColor && teamLoading)) {
        return myRole === 'organizer' && <span>Loading player info...</span>
    }
    if (!player) {
        return <span>Player not found</span>
    }
    if (teamColor && teamError) {
        return <p><strong>Error: </strong>{teamError}</p>
    }

    return <span style={{ color: team?.color }}>{player.name}</span>
}

export function WinnerName({ playerId, teamId }) {
    const { id: gameId } = useParams()
    const myRole = useRoleContext()

    const [player, playerLoading, playerError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId, 'players', playerId))
    const [team, teamLoading, teamError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId, 'teams', teamId))

    if (playerError) {
        return <p><strong>Error: </strong>{JSON.stringify(playerError)}</p>
    }
    if (teamError) {
        return <p><strong>Error: </strong>{JSON.stringify(teamError)}</p>
    }
    if (playerLoading || teamLoading) {
        return myRole === 'organizer' && <span>Loading player info...</span>
    }
    if (!player) {
        return <span>Player not found</span>
    }

    return <span style={{ color: team?.color }}>{player.name}</span>
}