import { launchGame } from "@/backend/services/edit-game/actions";


import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"
import { useParams, useRouter } from "next/navigation";

import { useState } from "react";


import { DEFAULT_LOCALE } from "@/frontend/utils/locales";
import { DIALOG_ACTION_CANCEL } from "@/frontend/texts/dialogs";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';


export function LaunchGameButton({ lang = DEFAULT_LOCALE }) {
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
        <div className='flex flex-col h-full'>
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
        </div>
    )
}


const LAUNCH_GAME_TITLE = {
    'en': "Launch game",
    'fr-FR': "Lancer la partie",
}

const LAUNCH_GAME_DIALOG_TITLE = {
    'en': "Are you sure you want to launch this game?",
    'fr-FR': "Êtes-vous sûr de vouloir lancer cette partie?",
}

const LAUNCH_GAME_DIALOG_WARNING = {
    'en': "The game will be publicly accessible for all users.",
    'fr-FR': "La partie sera visible par tous les utilisateurs.",
}

const LAUNCH_GAME_DIALOG_ACTION_VALIDATE = {
    'en': "Letzgo",
    'fr-FR': "Zéparti",
}
