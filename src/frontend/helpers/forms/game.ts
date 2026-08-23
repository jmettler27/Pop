import * as Yup from 'yup';
import { type IntlShape } from 'react-intl';

import Game from '@/models/games/game';
import { GameType } from '@/models/games/game-type';
import { RoundType } from '@/models/rounds/round-type';
import Team from '@/models/team';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.forms.game', {
  gameTypeInvalid: 'Invalid game type',
  required: 'Required',
  roundTypeInvalid: 'Invalid type',
  teamNameRequired: 'Team name is required',
  teamNameMin: 'Team name must be at least {length} characters',
  teamNameMax: 'Team name must be at most {length} characters',
  participantNameRequired: 'Name is required',
  participantNameMin: 'Name must be at least {length} characters',
  participantNameMax: 'Name must be at most {length} characters',
  titleRequired: 'Title is required',
  titleMin: 'Title must be at least {length} characters',
  titleMax: 'Title must be at most {length} characters',
});

export const gameTypeSchema = (intl: IntlShape) =>
  Yup.string()
    .oneOf(Object.values(GameType), intl.formatMessage(messages.gameTypeInvalid))
    .required(intl.formatMessage(messages.required));

export const gameTitleSchema = (intl: IntlShape) =>
  Yup.string()
    .min(Game.TITLE_MIN_LENGTH, intl.formatMessage(messages.titleMin, { length: Game.TITLE_MIN_LENGTH }))
    .max(Game.TITLE_MAX_LENGTH, intl.formatMessage(messages.titleMax, { length: Game.TITLE_MAX_LENGTH }))
    .required(intl.formatMessage(messages.titleRequired));

export const participantNameSchema = (intl: IntlShape) =>
  Yup.string()
    .min(
      Game.PARTICIPANT_NAME_MIN_LENGTH,
      intl.formatMessage(messages.participantNameMin, { length: Game.PARTICIPANT_NAME_MIN_LENGTH })
    )
    .max(
      Game.PARTICIPANT_NAME_MAX_LENGTH,
      intl.formatMessage(messages.participantNameMax, { length: Game.PARTICIPANT_NAME_MAX_LENGTH })
    )
    .required(intl.formatMessage(messages.participantNameRequired));

export const teamNameSchema = (intl: IntlShape) =>
  Yup.string()
    .min(Team.NAME_MIN_LENGTH, intl.formatMessage(messages.teamNameMin, { length: Team.NAME_MIN_LENGTH }))
    .max(Team.NAME_MAX_LENGTH, intl.formatMessage(messages.teamNameMax, { length: Team.NAME_MAX_LENGTH }))
    .required(intl.formatMessage(messages.teamNameRequired));

export const roundTypeSchema = (intl: IntlShape) =>
  Yup.string()
    .oneOf(Object.values(RoundType), intl.formatMessage(messages.roundTypeInvalid))
    .required(intl.formatMessage(messages.required));
