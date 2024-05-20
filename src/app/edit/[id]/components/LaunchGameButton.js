import { useAsyncAction } from "@/lib/utils/async";
import { useParams, useRouter } from "next/navigation";

import { useState } from "react";

import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { DIALOG_ACTION_CANCEL } from "@/lib/utils/dialogs";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { launchGame } from "@/app/edit/[id]/lib/edit-game";

export function LaunchGameButton({ lang = 'fr-FR' }) {
    const { id: gameId } = useParams()

    const router = useRouter()

    const [dialogOpen, setDialogOpen] = useState(false)

    const [handleLaunchGame, isLaunching] = useAsyncAction(async () => {
        await launchGame(gameId)
        router.push(`/${gameId}`)
    })


    const onCancel = () => {
        setDialogOpen(false)
    }
    const onDialogClose = () => {
        setDialogOpen(false)
    }

    return (
        <>
            <Button
                variant='contained'
                color='warning'
                startIcon={<RocketLaunchIcon />}
                onClick={() => setDialogOpen(true)}
            >
                {LAUNCH_GAME_TITLE[lang]}
            </Button>

            <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
                <DialogTitle>{LAUNCH_GAME_DIALOG_TITLE[lang]}</DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        {LAUNCH_GAME_DIALOG_WARNING[lang]}
                    </DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button
                        variant='contained'
                        color='primary'
                        onClick={handleLaunchGame}
                        disabled={isLaunching}
                    >
                        {LAUNCH_GAME_DIALOG_ACTION_VALIDATE[lang]}
                    </Button>

                    <Button
                        variant='outlined'
                        color='error'
                        onClick={onCancel}
                    >
                        {DIALOG_ACTION_CANCEL[lang]}
                    </Button>
                </DialogActions>

            </Dialog>
        </>
    )
}


const LAUNCH_GAME_TITLE = {
    'en': "Launch game",
    'fr-FR': "Démarrer la partie",
}

const LAUNCH_GAME_DIALOG_TITLE = {
    'en': "Are you sure you want to launch this game?",
    'fr-FR': "Êtes-vous sûr de vouloir démarrer cette partie?",
}

const LAUNCH_GAME_DIALOG_WARNING = {
    'en': "The game will be publicly accessible for all users.",
    'fr-FR': "La partie sera publiquement accessible pour tous les utilisateurs.",
}

const LAUNCH_GAME_DIALOG_ACTION_VALIDATE = {
    'en': "Letzgo",
    'fr-FR': "Zéparti",
}
