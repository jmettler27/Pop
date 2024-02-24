'use client'

import { useSession } from 'next-auth/react';
import { redirect, useParams, useRouter } from 'next/navigation'

import { Field, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { MyTextInput, MySelect, StyledErrorMessage, MyColorPicker, MyRadioGroup } from '@/app/components/forms/StyledFormComponents'
import { Wizard, WizardStep } from '@/app/components/forms/MultiStepComponents';

import LoadingScreen from '@/app/components/LoadingScreen';
import GameErrorScreen from '@/app/(game)/[id]/components/GameErrorScreen';

import { db } from '@/lib/firebase/firebase'
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { addDoc, collection, doc, query, setDoc, where, serverTimestamp, runTransaction } from 'firebase/firestore'
import { useCollection, useCollectionOnce, useDocumentDataOnce } from 'react-firebase-hooks/firestore';

import { Button, CircularProgress, IconButton } from '@mui/material';

import { GAME_PARTICIPANT_NAME_MIN_LENGTH, GAME_PARTICIPANT_NAME_MAX_LENGTH, GAME_TEAM_NAME_MIN_LENGTH, GAME_TEAM_MAX_NAME_LENGTH } from '@/lib/utils/game'
import { useAsyncAction } from '@/lib/utils/async';


function JoinGameHeader({ }) {
    const { id: gameId } = useParams()

    const [game, gameLoading, gameError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId))

    return (
        <>
            {gameError && <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>}
            {!gameLoading && game && <h1>Join a game: {game.title}</h1>}
        </>
    )
}

const REGEX_HEX_COLOR = /^#[0-9A-F]{6}$/i

export default function Page({ params }) {
    const { data: session } = useSession()

    const gameId = params.id

    const [joinGame, isJoining] = useAsyncAction(async (values, user) => {
        try {
            console.log("Form values:", values)

            const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
            let teamId = values.teamId

            await runTransaction(db, async (transaction) => {
                if (!values.playInTeams) {
                    /* Single player */
                    const teamDocRef = doc(teamsCollectionRef);
                    transaction.set(teamDocRef, {
                        color: values.teamColor,
                        name: values.playerName,
                        teamAllowed: false,
                        createdBy: user.id,
                        createdAt: serverTimestamp(),
                    });
                    teamId = teamDocRef.id;
                }
                else if (!values.joinTeam) {
                    /* Player that creates a new team */
                    const teamDocRef = doc(teamsCollectionRef);
                    transaction.set(teamDocRef, {
                        color: values.teamColor,
                        name: values.teamName,
                        teamAllowed: true,
                        createdBy: user.id,
                        createdAt: serverTimestamp(),
                    });
                    teamId = teamDocRef.id;
                }

                /* In any case: create player doc */
                const playerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'players', user.id);
                transaction.set(playerDocRef, {
                    image: user.image,
                    name: values.playerName,
                    status: 'idle',
                    teamId,
                    joinedAt: serverTimestamp(),
                });
            });

            router.push(`/${gameId}`);
        } catch (error) {
            console.error("There was an error joining the game:", error)
            router.push('/')
        }
    })

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const user = session.user
    const router = useRouter()

    const [game, gameLoading, gameError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId))
    const [organizers, organizersLoading, organizersError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, gameId, 'organizers'))
    const [players, playersLoading, playersError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, gameId, 'players'))

    if (gameError || organizersError || playersError) {
        return <GameErrorScreen />
    }
    if (gameLoading || organizersLoading || playersLoading) {
        return <div className='flex h-screen'><LoadingScreen loadingText='Loading...' /></div>
    }
    if (!game || !organizers || !players) {
        return <></>
    }

    const organizerIds = organizers.docs.map(doc => doc.id)
    if (organizerIds.includes(user.id)) {
        redirect(`/${gameId}`)
    }

    const playerIds = players.docs.map(doc => doc.id)
    if (playerIds.includes(user.id)) {
        redirect(`/${gameId}`)
    }

    if (playerIds.length >= game.maxPlayers) {
        redirect('/')
    }

    return (
        <>
            <JoinGameHeader />
            <Wizard
                initialValues={{
                    playerName: '',
                    playInTeams: null,
                    joinTeam: null,
                    teamId: '',
                    teamName: '',
                    teamColor: null,
                }}
                onSubmit={async values => await joinGame(values, user)}
                isSubmitting={isJoining}
            >
                {/* Step 1: General info */}
                <GeneralInfoStep
                    onSubmit={() => { }}
                    validationSchema={Yup.object({
                        playerName: Yup.string()
                            .min(GAME_PARTICIPANT_NAME_MIN_LENGTH, `Must be ${GAME_PARTICIPANT_NAME_MIN_LENGTH} characters or more!`)
                            .max(GAME_PARTICIPANT_NAME_MAX_LENGTH, `Must be ${GAME_PARTICIPANT_NAME_MAX_LENGTH} characters or less!`)
                            .required("Required."),
                        playInTeams: Yup.boolean()
                            .required("Required."),
                        joinTeam: Yup.boolean()
                            .required("Required."),
                        teamId: Yup.string()
                    })}
                />

                {/* Step 2 (optional): create a new team */}
                <CreateTeamStep
                    onSubmit={() => { }}
                    validationSchema={Yup.object({
                        teamName: Yup.string()
                            .min(GAME_TEAM_NAME_MIN_LENGTH, `Must be ${GAME_TEAM_NAME_MIN_LENGTH} characters or more!`)
                            .max(GAME_TEAM_MAX_NAME_LENGTH, `Must be ${GAME_TEAM_MAX_NAME_LENGTH} characters or less!`)
                            .required("Required."),
                        teamColor: Yup.string()
                            .test(
                                'is-hex-color',
                                "Must be a valid hexadecimal color.",
                                (value) => REGEX_HEX_COLOR.test(value)
                            )
                            .required("Required."),
                    })}
                />

            </Wizard>
        </>
    );
}

function GeneralInfoStep({ onSubmit, validationSchema }) {
    const formik = useFormikContext();
    const values = formik.values
    const errors = formik.errors

    console.log("Values:", values)
    console.log("Errors:", errors)

    const PlayInTeamsError = () => {
        const [_, meta] = useField('playInTeams');
        return typeof errors.playInTeams === 'string' && meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    }

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            <MyTextInput
                label="What is your nickname?"
                name='playerName'
                type='text'
                placeholder="My nickname"
                validationSchema={validationSchema}
                maxLength={GAME_PARTICIPANT_NAME_MAX_LENGTH}
            />

            <br />
            <br />
            <span>Do you want to play in teams or alone? {values.playInTeams !== null && <strong>{values.playInTeams ? "In teams" : "Alone"}</strong>}</span>
            <div role='group' aria-labelledby="play-in-teams-radio-group" className='flex flex-row space-x-2'>
                <label>
                    <Field type='radio' name='joinTeamPicked' value="In teams"
                        onClick={() => {
                            formik.setFieldValue('playInTeams', true)
                            formik.setFieldValue('joinTeam', false)
                        }}
                    />
                    In teams
                </label>
                <label>
                    <Field type='radio' name='joinTeamPicked' value="Alone"
                        onClick={() => {
                            formik.setFieldValue('playInTeams', false)
                            formik.setFieldValue('joinTeam', false)
                            formik.setFieldValue('teamId', '')
                            formik.setFieldValue('teamName', '')
                        }}
                    />
                    Alone
                </label>
            </div>
            <PlayInTeamsError />

            {values.playInTeams && <JoinOrCreateTeam validationSchema={validationSchema} />}
        </WizardStep>
    )
}

function JoinOrCreateTeam({ validationSchema }) {
    const { id: gameId } = useParams()

    const formik = useFormikContext();
    const values = formik.values
    const errors = formik.errors

    const JoinTeamError = () => {
        const [_, meta] = useField('joinTeam');
        return typeof errors.joinTeam === 'string' && meta.touched && meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    }

    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const [teamsCollection, teamsLoading, teamsError] = useCollection(query(teamsCollectionRef, where('teamAllowed', '==', true)))

    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (teamsLoading) {
        return <CircularProgress color='inherit' />
    }
    if (!teamsCollection) {
        return <></>
    }

    const teams = teamsCollection.docs.map(doc => ({ id: doc.id, ...doc }))

    if (teams.length <= 0) {
        return <></>
    }


    return (
        <>
            <br />
            <br />
            <MyRadioGroup
                label="Do you want to join an existing team or create a new one?"
                name='joinTeam'
                trueText="Join a team"
                falseText="Create a new team"
                validationSchema={validationSchema}

            />

            {values.joinTeam && teams.length > 0 && (
                <MySelect
                    label="What team do you want to join?"
                    name='teamId'
                    validationSchema={validationSchema}
                    onChange={(e) => {
                        formik.setFieldValue('teamId', e.target.value)
                        if (e.target.value) {
                            const team = teams.find(doc => doc.id === e.target.value)
                            formik.setFieldValue('teamName', team.name)
                            formik.setFieldValue('teamColor', team.color)
                        } else {
                            formik.setFieldValue('teamName', '')
                            formik.setFieldValue('teamColor', '')
                        }
                    }}
                >
                    <option value="">Select a team</option>
                    {teams.map((doc) => <option key={doc.id} value={doc.id}>{doc.name} </option>)}
                </MySelect>
            )}
            <JoinTeamError />
        </>
    )
}

function CreateTeamStep({ onSubmit, validationSchema }) {
    const formik = useFormikContext();
    const values = formik.values

    const placeholder = () => {
        if (!values.playInTeams)
            return values.playerName
        if (!values.joinTeam)
            return "My team name"
    }

    return (
        <WizardStep
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            {/* Solo player */}
            {values.playInTeams === false && (
                <MyColorPicker label="Choose your color" name='teamColor' validationSchema={validationSchema} />
            )}

            {/* Player that joins an existing team */}
            {values.playInTeams === true && values.joinTeam === true && (
                <p>You can now join the game.</p>
            )}

            {/* Player that creates a new team */}
            {values.playInTeams === true && values.joinTeam === false && (
                <>
                    <MyTextInput
                        label="What is the name of your team?"
                        name='teamName'
                        type='text'
                        placeholder={placeholder()}
                        validationSchema={validationSchema}
                        maxLength={GAME_TEAM_MAX_NAME_LENGTH}
                    // disabled={values.playInTeams && values.joinTeam}
                    />

                    <MyColorPicker label="Choose a color for your team" name='teamColor' validationSchema={validationSchema} />
                </>
            )}
        </WizardStep>
    )
}