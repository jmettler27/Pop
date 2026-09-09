import * as Yup from 'yup';

import Game from '@/models/games/game';
import { GameType } from '@/models/games/game-type';
import { RoundType } from '@/models/rounds/round-type';
import Team from '@/models/team';

export const gameTypeSchema = () =>
  Yup.string().oneOf(Object.values(GameType), 'Invalid game type.').required('Required.');

export const gameTitleSchema = () =>
  Yup.string()
    .min(Game.TITLE_MIN_LENGTH, `Title must be at least ${Game.TITLE_MIN_LENGTH} characters`)
    .max(Game.TITLE_MAX_LENGTH, `Title must be at most ${Game.TITLE_MAX_LENGTH} characters`)
    .required('Title is required');

export const participantNameSchema = () =>
  Yup.string()
    .min(Game.PARTICIPANT_NAME_MIN_LENGTH, `Name must be at least ${Game.PARTICIPANT_NAME_MIN_LENGTH} characters`)
    .max(Game.PARTICIPANT_NAME_MAX_LENGTH, `Name must be at most ${Game.PARTICIPANT_NAME_MAX_LENGTH} characters`)
    .required('Name is required');

export const teamNameSchema = () =>
  Yup.string()
    .min(Team.NAME_MIN_LENGTH, `Team name must be at least ${Team.NAME_MIN_LENGTH} characters`)
    .max(Team.NAME_MAX_LENGTH, `Team name must be at most ${Team.NAME_MAX_LENGTH} characters`)
    .required('Team name is required');

export const roundTypeSchema = () =>
  Yup.string().oneOf(Object.values(RoundType), 'Invalid type.').required('Required.');
