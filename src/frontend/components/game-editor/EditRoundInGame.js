import { topicToEmoji } from '@/backend/models/Topic';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { RoundType, roundTypeToEmoji } from '@/backend/models/rounds/RoundType';
import { Round } from '@/backend/models/rounds/Round'

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import RoundRepository from '@/backend/repositories/round/RoundRepository'

import { removeRoundFromGame } from '@/backend/services/game-editor/edit-game'

import { DIALOG_ACTION_CANCEL, DIALOG_WARNING } from '@/frontend/texts/dialogs'

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore'
import { doc, getDoc } from 'firebase/firestore';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction'

import { useParams } from 'next/navigation'

import React, { memo, useEffect, useState } from 'react';

import { CardTitle, CardHeader, CardContent, Card } from '@/frontend/components/card'
import { EditQuestionCard } from '@/frontend/components/game-editor/EditQuestionInRound';
import { AddQuestionToMixedRoundButton, AddQuestionToRoundButton } from '@/frontend/components/game-editor/AddNewQuestion'

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete';

import clsx from 'clsx';


const editGameRoundCardNumCols = (roundType) => {
    switch (roundType) {
        case RoundType.PROGRESSIVE_CLUES:
        case RoundType.MATCHING:
            return 'md:grid-cols-2'
        case RoundType.ODD_ONE_OUT:
        case RoundType.ENUMERATION:
        case RoundType.MCQ:
        case RoundType.NAGUI:
        case RoundType.BASIC:
        case RoundType.QUOTE:
        case RoundType.LABELLING:
        case RoundType.REORDERING:
            return 'md:grid-cols-3'
        default:
            return 'md:grid-cols-4'
    }
}

export const EditGameRoundCard = memo(function EditGameRoundCard({ roundId, status, gameId }) {


    console.log("EditGameRoundCard", roundId)
    // <div className='border-dashed border-4 p-2 w-[30%] h-full overflow-auto'>

    const roundRepo = new RoundRepository(gameId)
    const { round, loading, error } = roundRepo.useRound(roundId)

    if (error) {
        return <p><strong>Error: {JSON.stringify(error)}</strong></p>
    }
    if (loading) {
        return <></>
    }
    if (!round) {
        return <></>
    }

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='2xl:text-2xl'>{roundTypeToEmoji(round.type)} <i>{round.title}</i> <RoundTopicDistribution round={round} /></CardTitle>
                {status === GameStatus.GAME_EDIT && <RemoveRoundFromGameButton roundId={round.id} />}
            </CardHeader>
            <CardContent>
                <div className={clsx('grid', 'gap-4',
                    editGameRoundCardNumCols(round.type),
                )}>
                    <EditGameRoundQuestionCards round={round} status={status} />
                    {status === GameStatus.GAME_EDIT && (
                        round.type === RoundType.MIXED ?
                            <AddQuestionToMixedRoundButton
                                roundId={round.id}
                                disabled={round.questions.length >= Round.MAX_NUM_QUESTIONS}
                            /> :
                            <AddQuestionToRoundButton
                                round={round}
                                disabled={round.questions.length >= Round.MAX_NUM_QUESTIONS}
                            />
                    )}
                </div>
            </CardContent>
        </Card>
    )
})

const fetchTopics = async (questionIds) => {
    const promises = questionIds.map(id => getDoc(doc(QUESTIONS_COLLECTION_REF, id)));
    const documents = await Promise.all(promises);
    return documents.map(doc => doc.data().topic);
};


function RoundTopicDistribution({ round }) {
    const { questions: ids } = round

    const [topics, setTopics] = useState([])


    useEffect(() => {
        fetchTopics(ids).then(topics => {

            const topicDistribution = topics.reduce((acc, topic) => {
                acc[topic] = acc[topic] ? acc[topic] + 1 : 1
                return acc
            }, {})

            // Sort alphabetically by the keys
            const sortedTopics = Object.keys(topicDistribution).sort().reduce((acc, key) => {
                acc[key] = topicDistribution[key]
                return acc
            }, {})

            setTopics(sortedTopics)

        },
            error => {
                console.error("Error fetching topics", error)
            }
        )
    }, [ids])

    return (
        <span className='2xl:text-xl'>
            ({Object.entries(topics).map(([topic, count]) => `${topicToEmoji(topic)}x${count}`).join(', ')})
        </span>
    )

}


function EditGameRoundQuestionCards({ round, status }) {
    return round.questions.map((questionId, idx) => (
        <EditQuestionCard key={questionId}
            roundId={round.id}
            questionId={questionId}
            questionOrder={idx}
            status={status}
        />
    ))
}

function RemoveRoundFromGameButton({ roundId, lang = DEFAULT_LOCALE }) {
    const { id: gameId } = useParams()

    const [dialogOpen, setDialogOpen] = useState(false)

    const [handleRemoveRound, isRemoving] = useAsyncAction(async () => {
        await removeRoundFromGame(gameId, roundId)
    })

    const onCancel = () => {
        setDialogOpen(false)
    }

    const onDialogClose = () => {
        setDialogOpen(false)
    }

    return (
        <>
            <IconButton
                color='error'
                onClick={() => setDialogOpen(true)}
                disabled={isRemoving}
            >
                <DeleteIcon />
            </IconButton>

            <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
                <DialogTitle>{REMOVE_ROUND_FROM_GAME_DIALOG_TITLE[lang]}</DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        {DIALOG_WARNING[lang]}
                    </DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button
                        variant='contained'
                        color='primary'
                        onClick={handleRemoveRound}
                        disabled={isRemoving}
                    >
                        {REMOVE_ROUND_FROM_GAME_DIALOG_ACTION_VALIDATE[lang]}
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

const REMOVE_ROUND_FROM_GAME_DIALOG_TITLE = {
    'en': "Are you sure you want to remove this round?",
    'fr-FR': "T'es sûr de vouloir supprimer cette manche ?"
}

const REMOVE_ROUND_FROM_GAME_DIALOG_ACTION_VALIDATE = {
    'en': "Yes",
    'fr-FR': "Oui"
}

