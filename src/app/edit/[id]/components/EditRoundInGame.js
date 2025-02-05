import { useParams } from 'next/navigation'

import React, { memo, useEffect, useState } from 'react';

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { collection, doc, getDoc } from 'firebase/firestore';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete';
import { CardTitle, CardHeader, CardContent, Card } from '@/app/components/card'


import { GAME_ROUND_MAX_NUM_QUESTIONS, roundTypeToEmoji } from '@/lib/utils/round'
import { useAsyncAction } from '@/lib/utils/async'
import { DIALOG_ACTION_CANCEL, DIALOG_WARNING } from '@/lib/utils/dialogs'
import { topicToEmoji } from '@/lib/utils/topics';
import { DEFAULT_LOCALE } from '@/lib/utils/locales';

import { removeRoundFromGame } from '@/app/edit/[id]/lib/edit-game'
import { EditQuestionCard } from '@/app/edit/[id]/components/EditQuestionInRound';
import { AddQuestionToMixedRoundButton, AddQuestionToRoundButton } from '@/app/edit/[id]/components/AddNewQuestion'

import clsx from 'clsx';


const editGameRoundCardNumCols = (roundType) => {
    switch (roundType) {
        case 'progressive_clues':
        case 'matching':
            return 'md:grid-cols-2'
        case 'odd_one_out':
        case 'enum':
        case 'mcq':
        case 'nagui':
        case 'basic':
        case 'quote':
        case 'label':
        case 'reordering':
            return 'md:grid-cols-3'
        default:
            return 'md:grid-cols-4'
    }
}

export const EditGameRoundCard = memo(function EditGameRoundCard({ roundId, status }) {
    console.log("EditGameRoundCard", roundId)
    // <div className='border-dashed border-4 p-2 w-[30%] h-full overflow-auto'>

    const { id: gameId } = useParams()
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId)
    const [roundData, roundDataLoading, roundDataError] = useDocumentData(roundRef)
    if (roundDataError) {
        return <p><strong>Error: {JSON.stringify(roundDataError)}</strong></p>
    }
    if (roundDataLoading) {
        return <></>
    }
    if (!roundData) {
        return <></>
    }
    const round = { id: roundId, ...roundData }

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='2xl:text-2xl'>{roundTypeToEmoji(round.type)} <i>{round.title}</i> <RoundTopicDistribution round={round} /></CardTitle>
                {status === 'build' && <RemoveRoundFromGameButton roundId={round.id} />}
            </CardHeader>
            <CardContent>
                <div className={clsx('grid', 'gap-4',
                    editGameRoundCardNumCols(round.type),
                )}>
                    <EditGameRoundQuestionCards round={round} status={status} />
                    {status === 'build' && (
                        round.type === 'mixed' ?
                            <AddQuestionToMixedRoundButton
                                roundId={round.id}
                                disabled={round.questions.length >= GAME_ROUND_MAX_NUM_QUESTIONS}
                            /> :
                            <AddQuestionToRoundButton
                                roundId={round.id}
                                roundType={round.type}
                                disabled={round.questions.length >= GAME_ROUND_MAX_NUM_QUESTIONS}
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

