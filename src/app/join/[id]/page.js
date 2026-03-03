'use client';

import { joinGame } from '@/backend/services/join-game/actions';

import { useGameRepositories, useGameData } from '@/backend/repositories/useGameRepositories';

import Game from '@/backend/models/games/Game';
import Team from '@/backend/models/Team';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import MyColorPicker from '@/frontend/components/forms/MyColorPicker';
import {
  MyTextInput,
  MySelect,
  StyledErrorMessage,
  MyRadioGroup,
} from '@/frontend/components/forms/StyledFormComponents';
import { Wizard, WizardStep } from '@/frontend/components/forms/MultiStepComponents';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import GameErrorScreen from '@/frontend/components/game/GameErrorScreen';

import { redirect, useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import React from 'react';

import { Field, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { CircularProgress } from '@mui/material';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('app.join', {
  joinGameHeader: 'Join a game',
  submitFormButtonLabel: 'Join the game',
  playerNameInputLabel: 'Choose a nickname',
  playerNameInputPlaceholder: 'My nickname',
  teamsOrAloneLabel: 'Do you want to play in teams or alone?',
  inTeams: 'In teams',
  alone: 'Alone',
  joinOrCreateTeamLabel: 'Do you want to join an existing team or create a new one?',
  joinTeam: 'Join a team',
  createTeam: 'Create a team',
  selectTeamLabel: 'What team do you want to join?',
  selectTeamFirstOption: 'Select a team',
  teamNameInputLabel: 'Choose a team name',
  teamNameInputPlaceholder: 'My team name',
  teamColorPickerLabel: 'Choose a color for your team',
  chooseYourColor: 'Choose your color',
  canJoinGame: 'You can now join the game.',
});

const REGEX_HEX_COLOR = /^#[0-9A-F]{6}$/i;

function JoinGameHeader() {
  const { id: gameId } = useParams();
  const { gameRepo } = useGameRepositories(gameId);
  const { game, loading, error } = gameRepo.useGameOnce(gameId);
  const intl = useIntl();

  return (
    <>
      {error && (
        <p>
          <strong>Error: {JSON.stringify(error)}</strong>
        </p>
      )}
      {!loading && game && (
        <h1>
          {intl.formatMessage(messages.joinGameHeader)}: <i>{game.title}</i>
        </h1>
      )}
    </>
  );
}

export default function Page({ params }) {
  const { data: session } = useSession();
  const resolvedParams = React.use(params);
  const gameId = resolvedParams.id;
  const intl = useIntl();

  const [handleJoinGame, isJoining] = useAsyncAction(async (values, user) => {
    try {
      await joinGame(gameId, user.id, values);
      router.push(`/${gameId}`);
    } catch (error) {
      console.error('Failed to join the game:', error);
      router.push('/');
    }
  });

  // Protected route
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const user = session.user;
  const router = useRouter();

  const { game, organizers, players, loading, error } = useGameData(gameId);

  if (error) return <GameErrorScreen />;
  if (loading) return <LoadingScreen loadingText="Loading game..." />;
  if (!game) return null;

  if (organizers.some((o) => o.id === user.id)) {
    redirect(`/${gameId}`);
  }

  if (players.some((p) => p.id === user.id)) {
    redirect(`/${gameId}`);
  }

  if (players.length >= game.maxPlayers) {
    redirect('/');
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
          teamColor: '#000000',
        }}
        onSubmit={async (values) => await handleJoinGame(values, user)}
        isSubmitting={isJoining}
        submitButtonLabel={intl.formatMessage(messages.submitFormButtonLabel)}
      >
        {/* Step 1: General info */}
        <GeneralInfoStep
          onSubmit={() => {}}
          validationSchema={Yup.object({
            playerName: Yup.string()
              .min(Game.PARTICIPANT_NAME_MIN_LENGTH, `Must be ${Game.PARTICIPANT_NAME_MIN_LENGTH} characters or more!`)
              .max(Game.PARTICIPANT_NAME_MAX_LENGTH, `Must be ${Game.PARTICIPANT_NAME_MAX_LENGTH} characters or less!`)
              .required('Required.'),
            playInTeams: Yup.boolean().nonNullable('Required.'),
            joinTeam: Yup.boolean().when('playInTeams', {
              is: true,
              then: (schema) => schema.nonNullable('Required.'),
              otherwise: (schema) => schema.nullable(),
            }),
            teamId: Yup.string().when('joinTeam', {
              is: true,
              then: (schema) => schema.required('Required.'),
              otherwise: (schema) => schema.notRequired(),
            }),
          })}
        />

        {/* Step 2 (optional): create a new team */}
        <CreateTeamStep
          onSubmit={() => {}}
          validationSchema={Yup.object({
            teamName: Yup.string()
              .when(['playInTeams', 'joinTeam'], {
                is: (playInTeams, joinTeam) => playInTeams && !joinTeam,
                then: (schema) => schema.required('Required.'),
                otherwise: (schema) => schema.notRequired(),
              })
              .min(Team.NAME_MIN_LENGTH, `Must be ${Team.NAME_MIN_LENGTH} characters or more!`)
              .max(Team.NAME_MAX_LENGTH, `Must be ${Team.NAME_MAX_LENGTH} characters or less!`),
            teamColor: Yup.string().when(['playInTeams', 'joinTeam'], {
              is: (playInTeams, joinTeam) => !playInTeams || (playInTeams && !joinTeam),
              then: (schema) =>
                schema
                  .required('Required.')
                  .test(
                    'is-hex-color',
                    'Must be a valid hexadecimal color.',
                    (value) => !value || REGEX_HEX_COLOR.test(value)
                  ),
              otherwise: (schema) => schema.notRequired(),
            }),
          })}
        />
      </Wizard>
    </>
  );
}

function GeneralInfoStep({ onSubmit, validationSchema }) {
  const formik = useFormikContext();
  const values = formik.values;
  const errors = formik.errors;
  const intl = useIntl();

  const PlayInTeamsError = () => {
    const [_, meta] = useField('playInTeams');
    return (
      typeof errors.playInTeams === 'string' &&
      meta.touched &&
      meta.error && <StyledErrorMessage>{meta.error}</StyledErrorMessage>
    );
  };

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      <MyTextInput
        label={intl.formatMessage(messages.playerNameInputLabel)}
        name="playerName"
        type="text"
        placeholder={intl.formatMessage(messages.playerNameInputPlaceholder)}
        validationSchema={validationSchema}
        maxLength={Game.PARTICIPANT_NAME_MAX_LENGTH}
      />

      <br />
      <br />
      <span>
        {intl.formatMessage(messages.teamsOrAloneLabel)}{' '}
        {values.playInTeams !== null && (
          <strong>
            {values.playInTeams ? intl.formatMessage(messages.inTeams) : intl.formatMessage(messages.alone)}
          </strong>
        )}
      </span>
      <div role="group" aria-labelledby="play-in-teams-radio-group" className="flex flex-row space-x-2">
        <label>
          <Field
            type="radio"
            name="joinTeamPicked"
            value="In teams"
            onClick={() => formik.setFieldValue('playInTeams', true)}
          />
          {intl.formatMessage(messages.inTeams)}
        </label>
        <label>
          <Field
            type="radio"
            name="joinTeamPicked"
            value="Alone"
            onClick={() => formik.setFieldValue('playInTeams', false)}
          />
          {intl.formatMessage(messages.alone)}
        </label>
      </div>
      <PlayInTeamsError />

      {values.playInTeams && <JoinOrCreateTeam validationSchema={validationSchema} />}
    </WizardStep>
  );
}

function JoinOrCreateTeam({ validationSchema }) {
  const { id: gameId } = useParams();
  const formik = useFormikContext();
  const values = formik.values;
  const intl = useIntl();

  const { teamRepo } = useGameRepositories(gameId);
  const { teams, loading, error } = teamRepo.useJoinableTeams();

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <CircularProgress color="inherit" />;
  }

  return (
    <>
      <br />
      <br />
      <MyRadioGroup
        label={intl.formatMessage(messages.joinOrCreateTeamLabel)}
        name="joinTeam"
        trueText={intl.formatMessage(messages.joinTeam)}
        falseText={intl.formatMessage(messages.createTeam)}
        validationSchema={validationSchema}
      />

      {values.joinTeam && teams.length > 0 && (
        <MySelect
          label={intl.formatMessage(messages.selectTeamLabel)}
          name="teamId"
          validationSchema={validationSchema}
          onChange={(e) => {
            const teamId = e.target.value;
            formik.setFieldValue('teamId', teamId);
            if (teamId) {
              const team = teams.find((t) => t.id === teamId);
              formik.setFieldValue('teamName', team.name);
              formik.setFieldValue('teamColor', team.color);
            }
          }}
        >
          <option value="">{intl.formatMessage(messages.selectTeamFirstOption)}</option>
          {teams.map((team) => (
            <SelectTeamOption key={team.id} team={team} />
          ))}
        </MySelect>
      )}
    </>
  );
}

function SelectTeamOption({ team }) {
  const { id: gameId } = useParams();
  const { playerRepo } = useGameRepositories(gameId);
  const { players, loading, error } = playerRepo.useTeamPlayers(team.id);

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <option value={team.id}>&quot;{team.name}&quot; (loading players...)</option>;
  }

  const playerNames = players.map((p) => p.name).join(', ');
  return (
    <option value={team.id}>
      &quot;{team.name}&quot; ({playerNames})
    </option>
  );
}

function CreateTeamStep({ onSubmit, validationSchema }) {
  const formik = useFormikContext();
  const values = formik.values;
  const intl = useIntl();

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      {/* Solo player */}
      {values.playInTeams === false && (
        <MyColorPicker
          label={intl.formatMessage(messages.chooseYourColor)}
          name="teamColor"
          validationSchema={validationSchema}
        />
      )}

      {/* Player that joins an existing team */}
      {values.playInTeams === true && values.joinTeam === true && <p>{intl.formatMessage(messages.canJoinGame)}</p>}

      {/* Player that creates a new team */}
      {values.playInTeams === true && values.joinTeam === false && (
        <>
          <MyTextInput
            label={intl.formatMessage(messages.teamNameInputLabel)}
            name="teamName"
            type="text"
            placeholder={intl.formatMessage(messages.teamNameInputPlaceholder)}
            validationSchema={validationSchema}
            maxLength={Team.NAME_MAX_LENGTH}
          />

          <MyColorPicker
            label={intl.formatMessage(messages.teamColorPickerLabel)}
            name="teamColor"
            validationSchema={validationSchema}
          />
        </>
      )}
    </WizardStep>
  );
}
