'use client';

import { redirect, useRouter } from 'next/navigation';

import { Field, useFormikContext } from 'formik';
import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';
import type { AnyObjectSchema } from 'yup';

import { joinGame, type JoinGameRequest } from '@/api';
import { Wizard, WizardStep } from '@/components/common/MultiStepComponents';
import MyColorPicker from '@/components/common/MyColorPicker';
import {
  FieldError,
  MyRadioGroup,
  MySelect,
  MyTextInput,
  radioInputClassName,
} from '@/components/common/StyledFormComponents';
import ErrorScreen from '@/components/ErrorScreen';
import LoadingScreen from '@/components/LoadingScreen';
import { SelectItem } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useGameOnce } from '@/hooks/firestore/game/useGameHooks';
import { useAllOrganizersOnce } from '@/hooks/firestore/user/useOrganizerHooks';
import { useAllPlayerIdentitiesOnce, useTeamPlayers } from '@/hooks/firestore/user/usePlayerHooks';
import { useJoinableTeams } from '@/hooks/firestore/user/useTeamHooks';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGameId from '@/hooks/useGameId';
import defineMessages from '@/i18n/defineMessages';
import Game from '@/models/games/game';
import Team from '@/models/team';

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

type GeneralInfoStepProps = StepProps & { isGuest: boolean };

function JoinGameHeader() {
  const gameId = useGameId();
  const { game, loading, error } = useGameOnce(gameId);
  const intl = useIntl();

  if (error || loading || !game) {
    return <></>;
  }

  return (
    <h1 className="text-2xl font-bold md:text-3xl">
      {intl.formatMessage(messages.joinGameHeader)}: <i>{game.title}</i>
    </h1>
  );
}

const useGameData = (gameId: string) => {
  const { game, loading: gameLoading, error: gameError } = useGameOnce(gameId);
  const { organizers, loading: orgLoading, error: orgError } = useAllOrganizersOnce(gameId);
  const { players, loading: playerLoading, error: playerError } = useAllPlayerIdentitiesOnce(gameId);

  return {
    game,
    organizers,
    players,
    loading: gameLoading || orgLoading || playerLoading,
    error: gameError || orgError || playerError,
  };
};

export default function Page() {
  const { data: session } = useSession();

  const gameId = useGameId();
  const intl = useIntl();
  const router = useRouter();

  const [handleJoinGame, isJoining] = useAsyncAction(async (values: JoinFormValues) => {
    if (!session?.user?.id) return;
    try {
      // The Go endpoint takes the caller uid from the token.
      await joinGame(gameId, values as unknown as JoinGameRequest);
      router.push(`/${gameId}`);
    } catch (error) {
      console.error('Failed to join the game:', error);
      router.push('/');
    }
  });

  const { game, organizers, players, loading, error } = useGameData(gameId);

  if (error) {
    return <ErrorScreen />;
  }
  if (loading) {
    return <LoadingScreen />;
  }
  if (!game) return null;

  // Redirect unauthenticated users to sign-in, with this page as the callback so
  // guest sign-in returns them here (instead of the default redirect to "/")
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/join/${gameId}`)}`);
  }

  // Redirect users who are already participating
  if (organizers.some((o) => o.id === session.user.id)) {
    redirect(`/${gameId}`);
  }
  if (players.some((p) => p.id === session.user.id)) {
    redirect(`/${gameId}`);
  }

  if (players.length >= game.maxPlayers!) {
    redirect('/');
  }

  const isGuest = session.user.isGuest ?? false;
  // Clamp the guest name to the allowed max length so form validation passes
  const guestName = isGuest && session.user.name ? session.user.name.slice(0, Game.PARTICIPANT_NAME_MAX_LENGTH) : '';

  return (
    <div className="flex flex-col flex-1 p-8">
      <JoinGameHeader />
      <Wizard
        initialValues={{
          playerName: guestName,
          playInTeams: null,
          joinTeam: null,
          teamId: '',
          teamName: '',
          teamColor: '#000000',
        }}
        onSubmit={async (values) => await handleJoinGame(values as JoinFormValues)}
        isSubmitting={isJoining}
        submitButtonLabel={intl.formatMessage(messages.submitFormButtonLabel)}
      >
        {/* Step 1: General info */}
        <GeneralInfoStep
          onSubmit={() => {}}
          isGuest={isGuest}
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

        {/* Step 2 (optional): create a new team or pick a color */}
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

function GeneralInfoStep({ onSubmit, validationSchema, isGuest }: GeneralInfoStepProps) {
  const formik = useFormikContext<JoinFormValues>();
  const values = formik.values;
  const intl = useIntl();

  return (
    <WizardStep onSubmit={onSubmit} validationSchema={validationSchema}>
      {!isGuest && (
        <MyTextInput
          label={intl.formatMessage(messages.playerNameInputLabel)}
          name="playerName"
          type="text"
          placeholder={intl.formatMessage(messages.playerNameInputPlaceholder)}
          validationSchema={validationSchema}
          maxLength={Game.PARTICIPANT_NAME_MAX_LENGTH}
        />
      )}

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
      <div role="group" aria-labelledby="play-in-teams-radio-group" className="flex flex-row space-x-4">
        <label className="flex items-center gap-2 font-medium">
          <Field
            type="radio"
            name="joinTeamPicked"
            value="In teams"
            onClick={() => formik.setFieldValue('playInTeams', true)}
            className={radioInputClassName}
          />
          {intl.formatMessage(messages.inTeams)}
        </label>
        <label className="flex items-center gap-2 font-medium">
          <Field
            type="radio"
            name="joinTeamPicked"
            value="Alone"
            onClick={() => formik.setFieldValue('playInTeams', false)}
            className={radioInputClassName}
          />
          {intl.formatMessage(messages.alone)}
        </label>
      </div>
      <FieldError name="playInTeams" />

      {values.playInTeams && <JoinOrCreateTeam validationSchema={validationSchema} />}
    </WizardStep>
  );
}

function JoinOrCreateTeam({ validationSchema }: { validationSchema: AnyObjectSchema }) {
  const gameId = useGameId();
  const formik = useFormikContext<JoinFormValues>();
  const values = formik.values;
  const intl = useIntl();

  const { teams, loading, error } = useJoinableTeams(gameId);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Spinner />;
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
          onChange={(teamId: string) => {
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
          <SelectItem value="">{intl.formatMessage(messages.selectTeamFirstOption)}</SelectItem>
          {teams.map((team) => (
            <SelectTeamOption key={team.id} team={team} />
          ))}
        </MySelect>
      )}
    </>
  );
}

function SelectTeamOption({ team }: { team: Team }) {
  const gameId = useGameId();
  const { players, loading, error } = useTeamPlayers(gameId, team.id!);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <SelectItem value={team.id!}>&quot;{team.name}&quot; (loading players...)</SelectItem>;
  }

  const playerNames = players.map((p) => p.name).join(', ');
  return (
    <SelectItem value={team.id!}>
      &quot;{team.name}&quot; ({playerNames})
    </SelectItem>
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
