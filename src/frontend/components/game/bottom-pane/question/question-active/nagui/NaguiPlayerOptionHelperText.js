import { UserRole } from "@/backend/models/users/User"
import { NaguiOption } from "@/backend/models/questions/Nagui"

import { DEFAULT_LOCALE } from "@/frontend/utils/locales"


import { useGameRepositoriesContext, useRoleContext } from "@/frontend/contexts"


export default function NaguiPlayerOptionHelperText({ realtime, lang = DEFAULT_LOCALE }) {
    const myRole = useRoleContext()

    const { playerRepo, teamRepo } = useGameRepositoriesContext()
    const { player, playerLoading, playerError } = playerRepo.usePlayerOnce(realtime.playerId)
    const { team, teamLoading, teamError } = teamRepo.useTeamOnce(realtime.teamId)

    if (playerError) {
        return <p><strong>Error: </strong>{JSON.stringify(playerError)}</p>
    }
    if (teamError) {
        return <p><strong>Error: </strong>{JSON.stringify(teamError)}</p>
    }
    if (playerLoading || teamLoading) {
        return myRole === UserRole.ORGANIZER && <p>Loading player info...</p>
    }
    if (!player) {
        return <p>Player not found</p>
    }
    if (!team) {
        return <p>Team not found</p>
    }

    return <span><span style={{ color: team.color }}>{player.name}</span> {HAS_CHOSEN_TEXT[lang]} {NaguiOption.prependTypeWithEmoji(realtime.option, lang)}</span>

}

const HAS_CHOSEN_TEXT = {
    'en': "has chosen",
    'fr-FR': "a choisi"
}