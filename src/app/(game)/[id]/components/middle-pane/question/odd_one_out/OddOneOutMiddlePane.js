import { useState, useEffect, useMemo } from 'react'
import { useUserContext } from '@/app/contexts'
import { useGameContext, useRoleContext, useTeamContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { Badge, List, ListItemButton, ListItemIcon, ListItemText, Avatar, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material'

import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import LoadingScreen from '@/app/components/LoadingScreen'

import { topicToEmoji } from '@/lib/utils/topics'
import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'
import { generateShuffledIndices } from '@/lib/utils/question/odd_one_out'

import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'
import { clsx } from 'clsx'

import { handleProposalClick } from '@/app/(game)/lib/question/odd_one_out'
import { useAsyncAction } from '@/lib/utils/async'

export default function OddOneOutMiddlePane({ question }) {
    const randomMapping = useMemo(() =>
        generateShuffledIndices(question.details.items.length),
        [question.details.items.length]
    )

    return (
        <div className='flex flex-col h-full items-center'>
            <div className='h-[10%] flex flex-col items-center justify-center'>
                <OddOneOutQuestionHeader question={question} />
            </div>
            <OddOneOutMainContent question={question} randomization={randomMapping} />
        </div>
    )
}

function OddOneOutQuestionHeader({ question }) {
    return (
        <div className='flex flex-row items-center justify-center space-x-1'>
            <QuestionTypeIcon questionType={question.type} fontSize={40} />
            <h1 className='text-4xl'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong>: {question.details.title}</h1>
        </div>
    )
}

function OddOneOutMainContent({ question, randomization }) {
    const game = useGameContext()
    const myTeam = useTeamContext()

    const [realtime, realtimeLoading, realtimeError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion))
    const [gameStates, statesLoading, statesError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'states'))

    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (statesError) {
        return <p><strong>Error: {JSON.stringify(statesError)}</strong></p>
    }
    if (realtimeLoading || statesLoading) {
        return <LoadingScreen />
    }
    if (!realtime || !gameStates) {
        return <></>
    }

    const isChooser = gameStates.chooserOrder[gameStates.chooserIdx] === myTeam

    return (
        <div className={clsx(
            'h-[90%] w-full flex flex-col items-center justify-center',
            // (game.status === 'question_end') ? (realtime.winner ? 'bg-odd-one-out-wrong' : 'bg-odd-one-out-correct') : 'bg-odd-one-out'
        )}>
            <OddOneOutProposals question={question} randomization={randomization} selectedItems={realtime.selectedItems} isChooser={isChooser} />
        </div>
    )
}

function OddOneOutProposals({ question, randomization, selectedItems, isChooser }) {
    const game = useGameContext()
    const myTeam = useTeamContext()
    const user = useUserContext()

    const [handleClick, isSubmitting] = useAsyncAction(async (idx) => {
        await handleProposalClick(game.id, game.currentRound, game.currentQuestion, user.id, idx)
    })

    const [expandedIdx, setExpandedIdx] = useState(false)

    // Expand the question's accordion whenever the current question changes or the game status changes (question start -> question_end)
    useEffect(() => {
        if (game.status === 'question_end') {
            setExpandedIdx(question.details.answerIdx)
        }
        else if (selectedItems.length > 0) {
            setExpandedIdx(selectedItems[selectedItems.length - 1].idx)
        }
    }, [selectedItems, game.status])

    const proposalIsExpanded = (origIdx) =>
        expandedIdx === origIdx

    const handleAccordionChange = (origIdx) => {
        setExpandedIdx(proposalIsExpanded(origIdx) ? false : origIdx)
    }

    const proposalIsOdd = (origIdx) =>
        question.details.answerIdx === origIdx

    return (
        <List
            className='rounded-lg max-h-full w-1/3 overflow-y-auto mb-3'
            sx={{ bgcolor: 'background.paper' }}
        >
            {randomization.map((origIdx, idx) => (
                <ProposalItem key={idx}
                    item={question.details.items[origIdx]}
                    onProposalClick={() => handleClick(origIdx)}
                    onAccordionChange={() => handleAccordionChange(origIdx)}
                    selectedItem={selectedItems.find((selected) => selected.idx === origIdx)}
                    expanded={proposalIsExpanded(origIdx)}
                    isOdd={proposalIsOdd(origIdx)}
                    isLast={idx === question.details.items.length - 1}
                    isChooser={isChooser}
                    isSubmitting={isSubmitting}
                />
            ))}
        </List>
    )
}

function ProposalItem({ item, onProposalClick, onAccordionChange, selectedItem, expanded, isOdd, isLast, isChooser, isSubmitting }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    const isClicked = selectedItem != null

    const itemIsDisabled = () => {
        if (myRole === 'organizer')
            return false
        if (myRole === 'player') {
            if (game.status === 'question_end') {
                return true
            }
            if (isClicked) {
                return true
            }
            return !isChooser
        }
        return true
    }

    const showExplanation = isClicked || game.status === 'question_end'
    const showComplete = myRole === 'organizer' || showExplanation

    return (showExplanation ?
        <Accordion
            className='flex-grow'
            expanded={expanded}
            onChange={onAccordionChange}
            disabled={false}
            disableGutters
        >
            <AccordionSummary
                expandIcon={showComplete && <ExpandMoreIcon />}
            >
                <ListItemIcon>
                    <Badge
                        overlap='circular'
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={isClicked && <SelectedProposalPlayerAvatar playerId={selectedItem.playerId} />}
                    >
                        {isOdd ? <CloseIcon fontSize='medium' color='error' /> : <CheckIcon fontSize='medium' color='success' />}
                    </Badge>
                </ListItemIcon>
                <Typography
                    sx={{ color: isOdd ? 'red' : 'green', marginRight: '10px' }}
                    variant='h5'
                >
                    {item.title}
                </Typography>
            </AccordionSummary>

            <AccordionDetails>
                <Typography
                    sx={{ color: 'text.secondary' }}
                    variant='h6'
                >
                    {item.explanation}
                </Typography>
            </AccordionDetails>
        </Accordion> :

        <ListItemButton
            className='max-w-full'
            divider={!isLast}
            onClick={onProposalClick}
            disabled={isSubmitting || itemIsDisabled()}
        >
            <ListItemText
                sx={{ color: 'text.primary' }}
                primary={item.title}
                primaryTypographyProps={{
                    className: clsx('text-2xl')
                }}
            />
        </ListItemButton >
    )
}

function SelectedProposalPlayerAvatar({ playerId }) {
    const game = useGameContext()
    const [player, loading, error] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'players', playerId))
    return !error && !loading && player && (
        <Avatar
            alt={player.name}
            src={player.image}
            sx={{ width: 17, height: 17 }}
        />
    )
}