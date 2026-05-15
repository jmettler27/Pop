'use client';

import React from 'react';
import { redirect, useParams, useRouter } from 'next/navigation';

import { CircularProgress } from '@mui/material';
import { Field, useField, useFormikContext } from 'formik';
import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';
import type { AnyObjectSchema } from 'yup';

import { joinGame } from '@/backend/services/join-game/actions';
import { Wizard, WizardStep } from '@/frontend/components/common/MultiStepComponents';
import MyColorPicker from '@/frontend/components/common/MyColorPicker';
import {
  MyRadioGroup,
  MySelect,
  MyTextInput,
  StyledErrorMessage,
} from '@/frontend/components/common/StyledFormComponents';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/frontend/i18n/defineMessages';
import Game from '@/models/games/game';
import Team from '@/models/team';
import User from '@/models/users/user';

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

type JoinFormValues = {
  playerName: string;
  playInTeams: boolean | null;
  joinTeam: boolean | null;
  teamId: string;
  teamName: string;
  teamColor: string;
};

type StepProps = {
  onSubmit: () => void;
  validationSchema: AnyObjectSchema;
};

function JoinGameHeader() {
  const { id } = useParams();
  const gameId = id as string;
  const { gameRepo } = useGameRepositories(gameId)!;
  const { game, loading, error } = gameRepo.useGameOnce(gameId);
  const intl = useIntl();

  if (error || loading || !game) {
    return <></>;
  }

  return (
    <h1>
      {intl.formatMessage(messages.joinGameHeader)}: <i>{game.title}</i>
    </h1>
  );
}

const useGameData = (gameId: string) => {
  const { gameRepo, organizerRepo, playerRepo } = useGameRepositories(gameId)!;

  const { game, loading: gameLoading, error: gameError } = gameRepo.useGameOnce(gameId);
  const { organizers, loading: orgLoading, error: orgError } = organizerRepo.useAllOrganizerIdentitiesOnce();
  const { players, loading: playerLoading, error: playerError } = playerRepo.useAllPlayerIdentitiesOnce();

  return {
    game,
    organizers,
    players,
    loading: gameLoading || orgLoading || playerLoading,
    error: gameError || orgError || playerError,
  };
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const resolvedParams = React.use(params);
  const gameId = resolvedParams.id;
  const intl = useIntl();

  const [handleJoinGame, isJoining] = useAsyncAction(async (values: JoinFormValues, user: User) => {
    try {
      await joinGame(gameId, user.id!, values);
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

  const user = session.user as User;
  const router = useRouter();

  const { game, organizers, players, loading, error } = useGameData(gameId);

  if (error) {
    return <ErrorScreen />;
  }
  if (loading) {
    return <LoadingScreen />;
  }
  if (!game) return null;

  if (organizers.some((o) => o.id === user.id)) {
    redirect(`/${gameId}`);
  }

  if (players.some((p) => p.id === user.id)) {
    redirect(`/${gameId}`);
  }

  if (players.length >= game.maxPlayers!) {
    redirect('/');
  }

  return (
    <div className="flex flex-col flex-1 p-8">
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
        onSubmit={async (values) => await handleJoinGame(values as JoinFormValues, user)}
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
                is: (playInTeams: boolean, joinTeam: boolean) => playInTeams && !joinTeam,
                then: (schema) => schema.required('Required.'),
                otherwise: (schema) => schema.notRequired(),
              })
              .min(Team.NAME_MIN_LENGTH, `Must be ${Team.NAME_MIN_LENGTH} characters or more!`)
              .max(Team.NAME_MAX_LENGTH, `Must be ${Team.NAME_MAX_LENGTH} characters or less!`),
            teamColor: Yup.string().when(['playInTeams', 'joinTeam'], {
              is: (playInTeams: boolean, joinTeam: boolean) => !playInTeams || (playInTeams && !joinTeam),
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
    </div>
  );
}

function GeneralInfoStep({ onSubmit, validationSchema }: StepProps) {
  const formik = useFormikContext<JoinFormValues>();
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

function JoinOrCreateTeam({ validationSchema }: { validationSchema: AnyObjectSchema }) {
  const { id } = useParams();
  const gameId = id as string;
  const formik = useFormikContext<JoinFormValues>();
  const values = formik.values;
  const intl = useIntl();

  const { teamRepo } = useGameRepositories(gameId)!;
  const { teams, loading, error } = teamRepo.useJoinableTeams();

  if (error) {
    return <></>;
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
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const teamId = e.target.value;
            formik.setFieldValue('teamId', teamId);
            if (teamId) {
              const team = teams.find((t) => t.id === teamId);
              if (team) {
                formik.setFieldValue('teamName', team.name);
                formik.setFieldValue('teamColor', team.color);
              }
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

function SelectTeamOption({ team }: { team: Team }) {
  const { id } = useParams();
  const gameId = id as string;
  const { playerRepo } = useGameRepositories(gameId)!;
  const { players, loading, error } = playerRepo.useTeamPlayers(team.id!);

  if (error) {
    return <></>;
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

function CreateTeamStep({ onSubmit, validationSchema }: StepProps) {
  const formik = useFormikContext<JoinFormValues>();
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
