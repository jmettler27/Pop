import { useState, useEffect } from 'react'
import { useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc, collection } from 'firebase/firestore'
import { useCollectionOnce, useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { questionTypeToTitle } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'

import { CircularProgress, Accordion, AccordionSummary, AccordionDetails, Typography, Divider } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { blindtestTypeToEmoji } from '@/lib/utils/question/blindtest'
import { useParams } from 'next/navigation'
import { QuestionCardContent } from '@/app/components/questions/QuestionCard'
import clsx from 'clsx'


export default function RoundQuestionsProgress({ game, round }) {
    const [expandedId, setExpandedId] = useState(game.currentQuestion)

    // Expand the question's accordion whenever the current question changes or the game status changes (question start -> question_end)
    useEffect(() => {
        if (game.status === 'round_start' || game.status === 'round_end') {
            setExpandedId(false)
        } else {
            setExpandedId(game.currentQuestion)
        }
    }, [game.currentQuestion, game.status])


    const teamsRef = collection(GAMES_COLLECTION_REF, game.id, 'teams')
    const [teamsCollection, teamsLoading, teamsError] = useCollectionOnce(teamsRef)

    const playersRef = collection(GAMES_COLLECTION_REF, game.id, 'players')
    const [playersCollection, playersLoading, playersError] = useCollectionOnce(playersRef)

    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (playersError) {
        return <p><strong>Error: {JSON.stringify(playersError)}</strong></p>
    }

    if (teamsLoading || playersLoading) {
        return <CircularProgress />
    }

    if (!teamsCollection || !playersCollection) {
        return <></>
    }

    // const realtime = realtimeCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    const players = playersCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    const teams = teamsCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    const isExpanded = (questionId) =>
        expandedId === questionId

    const handleAccordionChange = (questionId) => {
        setExpandedId(isExpanded(questionId) ? false : questionId)
    }

    const currentRoundQuestionIdx = game.currentQuestion ? round.currentQuestionIdx : -1
    const hasEnded = (idx) => idx < currentRoundQuestionIdx
    const isCurrent = (idx) => idx === currentRoundQuestionIdx
    const hasNotStarted = (idx) => idx > currentRoundQuestionIdx

    return (
        <div className='w-full mt-4 px-2 space-y-2'>
            {round.questions.map((questionId, idx) => (
                <RoundQuestionAccordion key={questionId}
                    roundId={round.id}
                    questionId={questionId}
                    order={idx}
                    hasEnded={hasEnded(idx)}
                    isCurrent={isCurrent(idx)}
                    hasNotStarted={hasNotStarted(idx)}
                    onAccordionChange={() => handleAccordionChange(questionId)}
                    expanded={isExpanded(questionId)}
                    game={game}
                    teams={teams}
                    players={players}
                />
            ))}
        </div>
    )
}

function RoundQuestionAccordion({ game, roundId, questionId, order, hasEnded, isCurrent, hasNotStarted, onAccordionChange, expanded, teams, players }) {
    const { id: gameId } = useParams()
    const myRole = useRoleContext()

    const realtimeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(realtimeRef)

    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const [question, questionLoading, questionError] = useDocumentDataOnce(questionRef)

    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (questionError) {
        return <p><strong>Error: {JSON.stringify(questionError)}</strong></p>
    }
    if (realtimeLoading || questionLoading) {
        return <CircularProgress />
    }
    if (!realtime || !question) {
        return <></>
    }

    const showComplete = myRole === 'organizer' || (isCurrent && game.status === 'question_end') || hasEnded || (game.status === 'round_end')

    const winnerPlayerData = (questionType) => {
        if (questionType === 'mcq') {
            if (!realtime.correct)
                return null
            return players.find(player => player.id === realtime.playerId)
        }
        if (!realtime.winner)
            return null
        return players.find(player => player.id === realtime.winner.playerId)
    }

    const winnerTeamData = (questionType) => {
        if (questionType === 'mcq') {
            if (!realtime.correct)
                return null
            return teams.find(team => team.id === realtime.teamId)
        }
        if (!realtime.winner)
            return null
        return teams.find(team => team.id === realtime.winner.teamId)
    }

    const winnerPlayer = winnerPlayerData(question.type)
    const winnerTeam = winnerTeamData(question.type)

    const borderColor = (() => {
        if (hasNotStarted)
            return '#6b7280'
        if (showComplete) {
            if (!winnerTeam)
                return 'inherit'
            return winnerTeam.color
        }
    })

    const borderWidth = (() => {
        if (isCurrent)
            return '2px';
        return '1px'
    })

    const summaryColor = (() => {
        if (hasNotStarted)
            return '#6b7280'
        if (showComplete) {
            if (!winnerTeam)
                return 'inherit'
            return winnerTeam.color
        }
    })

    const isDisabled = () => {
        if (myRole === 'organizer')
            return false
        return hasNotStarted
    }

    return (
        <Accordion
            key={questionId}
            expanded={expanded}
            onChange={onAccordionChange}
            disabled={isDisabled()}
            className={clsx('rounded-lg', (isCurrent && game.status === 'question_active') && 'glow-border-white')}
            elevation={0}
            sx={{
                borderWidth: borderWidth(),
                borderStyle: 'solid',
                borderColor: borderColor(),
                backgroundColor: 'inherit',
                color: 'inherit',
            }}
            disableGutters
        >
            <AccordionSummary
                expandIcon={showComplete && <ExpandMoreIcon />}
                sx={{
                    '& .MuiSvgIcon-root': {
                        color: borderColor(),
                    }
                }}
            >
                <Typography sx={{ color: summaryColor() }}>
                    <QuestionSummary question={question} order={order} />
                </Typography>
            </AccordionSummary>

            {showComplete && (
                <AccordionDetails>
                    <QuestionTitle question={question} />
                    <QuestionCardContent question={question} />
                    <Divider className='my-2 bg-slate-600' />
                    <QuestionWinner question={question} winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} game={game} />
                </AccordionDetails>
            )}
        </Accordion>
    )
}

/* ============================================================================================ */
function QuestionSummary({ question, order, lang = 'fr-FR' }) {
    switch (question.type) {
        case 'progressive_clues':
        case 'emoji':
        case 'image':
            return <span className='2xl:text-lg'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} {order + 1}</strong>: {question.details.title}</span>
        case 'blindtest':
            // return <span className='2xl:text-lg'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} {order + 1} ({BLINDTEST_TYPE_TO_TITLE[lang][question.details.subtype]})</strong>: {question.details.title}</span>
            return <span className='2xl:text-lg'>{blindtestTypeToEmoji(question.details.subtype)}{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} {order + 1}</strong></span>
        case 'matching':
            return <span className='2xl:text-lg'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} {order + 1}</strong> ({question.details.numCols} col)</span>
        default:
            return <span className='2xl:text-lg'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} {order + 1}</strong></span>
    }
}



/* ============================================================================================ */
function QuestionTitle({ question }) {
    switch (question.type) {
        case 'progressive_clues':
        case 'emoji':
        case 'image':
        case 'quote':
            return <></>
        case 'mcq':
            return <MCQTitle question={question} />
        default:
            return (
                <Typography>
                    &quot;{question.details.title}&quot;
                </Typography>
            )
    }
}

function MCQTitle({ question }) {
    return (
        <Typography>
            <strong>{question.details.source}</strong>: <span className='italic'>{question.details.title}</span>
        </Typography>
    )
}


/* ============================================================================================ */
function QuestionWinner({ winnerTeam, winnerPlayer, question, game, lang = 'fr-FR' }) {
    switch (question.type) {
        case 'enum':
            return <EnumQuestionWinner winnerTeam={winnerTeam} winnerPlayer={winnerPlayer} question={question} game={game} />
        case 'matching':
            return <></>
        default:
            return (
                <Typography>
                    🏅 {(winnerTeam && winnerPlayer) ?
                        <span style={{ color: winnerTeam.color }}>{winnerPlayer.name} {(winnerTeam.name !== winnerPlayer.name) && `(${winnerTeam.name})`}</span> :
                        <span className='italic opacity-50'>{NO_WINNER_TEXT[lang]}</span>
                    }
                </Typography>
            )
    }
}

function EnumQuestionWinner({ winnerTeam, winnerPlayer, question, game, lang = 'fr-FR' }) {
    return <></>
    // const playersDocRef = doc(GAMES_COLLECTION_REF, gameIdds', roundId, 'questions', question.id, 'realtime', 'players')
    // const [players, playersLoading, playersError] = useDocumentDataOnce(playersDocRef)
    // if (playersError) {
    //     return <p><strong>Error: {JSON.stringify(playersError)}</strong></p>
    // }
    // if (playersLoading) {
    //     return <CircularProgress />
    // }
    // if (!players) {
    //     return <></>
    // }
    // const challenger = players.challenger
    // const bet = challenger?.bet
    // const numCited = challenger?.cited.length

    // return (
    //     <Typography>
    //         🏅 {winnerTeam ?
    //             <span style={{ color: winnerTeam.color }}>{winnerPlayer.name} {winnerTeam.teamAllowed && `(${winnerTeam.name})`}: {numCited}/{bet}</span> :
    //             <span className='italic opacity-50'>{NO_WINNER_TEXT[lang]} {players.challenger && <span className='2xl:text-red-500'>({numCited}/{bet})</span>}</span>
    //         }
    //     </Typography>
    // )
}

const NO_WINNER_TEXT = {
    'en': "Nobody",
    'fr-FR': "Personne"
}