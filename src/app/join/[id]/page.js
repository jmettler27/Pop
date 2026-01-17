'use client';

import JoinGameService from '@/backend/services/join-game/JoinGameService';

import { useGameRepositories, useGameData } from '@/backend/repositories/useGameRepositories';

import Game from '@/backend/models/games/Game';
import Team from '@/backend/models/Team';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

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

function JoinGameHeader({ lang = DEFAULT_LOCALE }) {
  const { id: gameId } = useParams();
  const { gameRepo } = useGameRepositories(gameId);
  const { game, loading, error } = gameRepo.useGameOnce(gameId);

  return (
    <>
      {error && (
        <p>
          <strong>Error: {JSON.stringify(error)}</strong>
        </p>
      )}
      {!loading && game && (
        <h1>
          {JOIN_GAME_HEADER[lang]}: <i>{game.title}</i>
        </h1>
      )}
    </>
  );
}

const JOIN_GAME_HEADER = {
  en: 'Join a game',
  'fr-FR': 'Rejoindre une partie',
};

const REGEX_HEX_COLOR = /^#[0-9A-F]{6}$/i;

export default function Page({ params, lang = DEFAULT_LOCALE }) {
  const { data: session } = useSession();
  const resolvedParams = React.use(params);
  const gameId = resolvedParams.id;

  const [joinGame, isJoining] = useAsyncAction(async (values, user) => {
    try {
      const joinGameService = new JoinGameService(gameId);
      await joinGameService.joinGame(values, user);
      router.push(`/${gameId}`);
    } catch (error) {
      console.error('There was an error joining the game:', error);
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
        onSubmit={async (values) => await joinGame(values, user)}
        isSubmitting={isJoining}
        submitButtonLabel={SUBMIT_FORM_BUTTON_LABEL[lang]}
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
            teamColor: Yup.string()
              .when(['playInTeams', 'joinTeam'], {
                is: (playInTeams, joinTeam) => playInTeams && joinTeam,
                then: (schema) => schema.required('Required.'),
                otherwise: (schema) => schema.notRequired(),
              })
              .test('is-hex-color', 'Must be a valid hexadecimal color.', (value) => REGEX_HEX_COLOR.test(value)),
          })}
        />
      </Wizard>
    </>
  );
}

const SUBMIT_FORM_BUTTON_LABEL = {
  en: 'Join the game',
  'fr-FR': 'Rejoindre la partie',
};

function GeneralInfoStep({ onSubmit, validationSchema, lang = DEFAULT_LOCALE }) {
  const formik = useFormikContext();
  const values = formik.values;
  const errors = formik.errors;

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
        label={PLAYER_NAME_INPUT_LABEL[lang]}
        name="playerName"
        type="text"
        placeholder={PLAYER_NAME_INPUT_PLACEHOLDER[lang]}
        validationSchema={validationSchema}
        maxLength={Game.PARTICIPANT_NAME_MAX_LENGTH}
      />

      <br />
      <br />
      <span>
        {TEAMS_OR_ALONE_LABEL[lang]}{' '}
        {values.playInTeams !== null && <strong>{values.playInTeams ? IN_TEAMS[lang] : ALONE[lang]}</strong>}
      </span>
      <div role="group" aria-labelledby="play-in-teams-radio-group" className="flex flex-row space-x-2">
        <label>
          <Field
            type="radio"
            name="joinTeamPicked"
            value="In teams"
            onClick={() => formik.setFieldValue('playInTeams', true)}
          />
          {IN_TEAMS[lang]}
        </label>
        <label>
          <Field
            type="radio"
            name="joinTeamPicked"
            value="Alone"
            onClick={() => formik.setFieldValue('playInTeams', false)}
          />
          {ALONE[lang]}
        </label>
      </div>
      <PlayInTeamsError />

      {values.playInTeams && <JoinOrCreateTeam validationSchema={validationSchema} />}
    </WizardStep>
  );
}

const PLAYER_NAME_INPUT_LABEL = {
  en: 'Choose a nickname',
  'fr-FR': 'Choisis un pseudo',
};

const PLAYER_NAME_INPUT_PLACEHOLDER = {
  en: 'My nickname',
  'fr-FR': 'Mon pseudo',
};

const TEAMS_OR_ALONE_LABEL = {
  en: 'Do you want to play in teams or alone?',
  'fr-FR': 'Veux-tu jouer en équipe ou en solo?',
};

const IN_TEAMS = {
  en: 'In teams',
  'fr-FR': 'En équipe',
};

const ALONE = {
  en: 'Alone',
  'fr-FR': 'Solo',
};

function JoinOrCreateTeam({ validationSchema, lang = DEFAULT_LOCALE }) {
  const { id: gameId } = useParams();
  const formik = useFormikContext();
  const values = formik.values;
  const errors = formik.errors;

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
        label={JOIN_OR_CREATE_TEAM_LABEL[lang]}
        name="joinTeam"
        trueText={JOIN_TEAM[lang]}
        falseText={CREATE_TEAM[lang]}
        validationSchema={validationSchema}
      />

      {values.joinTeam && teams.length > 0 && (
        <MySelect
          label={SELECT_TEAM_LABEL[lang]}
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
          <option value="">{SELECT_TEAM_FIRST_OPTION[lang]}</option>
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

const JOIN_OR_CREATE_TEAM_LABEL = {
  en: 'Do you want to join an existing team or create a new one?',
  'fr-FR': 'Veux-tu rejoindre une équipe existante ou en créer une nouvelle?',
};

const JOIN_TEAM = {
  en: 'Join a team',
  'fr-FR': 'Rejoindre une équipe',
};

const CREATE_TEAM = {
  en: 'Create a team',
  'fr-FR': 'Créer une équipe',
};

const SELECT_TEAM_LABEL = {
  en: 'What team do you want to join?',
  'fr-FR': 'Quelle équipe veux-tu rejoindre?',
};

const SELECT_TEAM_FIRST_OPTION = {
  en: 'Select a team',
  'fr-FR': 'Sélectionne une équipe',
};

function CreateTeamStep({ onSubmit, validationSchema, lang = DEFAULT_LOCALE }) {
  const formik = useFormikContext();
  const values = formik.values;
  const errors = formik.errors;

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      {/* Solo player */}
      {values.playInTeams === false && (
        <MyColorPicker label="Choose your color" name="teamColor" validationSchema={validationSchema} />
      )}

      {/* Player that joins an existing team */}
      {values.playInTeams === true && values.joinTeam === true && <p>{CAN_JOIN_GAME[lang]}</p>}

      {/* Player that creates a new team */}
      {values.playInTeams === true && values.joinTeam === false && (
        <>
          <MyTextInput
            label={TEAM_NAME_INPUT_LABEL[lang]}
            name="teamName"
            type="text"
            placeholder={TEAM_NAME_INPUT_PLACEHOLDER[lang]}
            validationSchema={validationSchema}
            maxLength={Team.NAME_MAX_LENGTH}
          />

          <MyColorPicker label={TEAM_COLOR_PICKER_LABEL[lang]} name="teamColor" validationSchema={validationSchema} />
        </>
      )}
    </WizardStep>
  );
}

const TEAM_NAME_INPUT_LABEL = {
  en: 'Choose a team name',
  'fr-FR': "Choisis un nom d'équipe",
};

const TEAM_NAME_INPUT_PLACEHOLDER = {
  en: 'My team name',
  'fr-FR': "Mon nom d'équipe",
};

const TEAM_COLOR_PICKER_LABEL = {
  en: 'Choose a color for your team',
  'fr-FR': 'Choisis une couleur pour ton équipe',
};

const CAN_JOIN_GAME = {
  en: 'You can now join the game.',
  'fr-FR': 'Tu peux maintenant rejoindre la partie.',
};
