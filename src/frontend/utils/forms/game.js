import * as Yup from 'yup';
import Game from '@/backend/models/games/Game';

/**
 * Creates a Yup validation schema for game types
 * @returns {Yup.StringSchema} The validation schema
 */
export const gameTypeSchema = () => Yup.string().oneOf(GAME_TYPES, 'Invalid game type.').required('Required.');

/**
 * Creates a Yup validation schema for game titles
 * @returns {Yup.StringSchema} The validation schema
 */
export const gameTitleSchema = () =>
  Yup.string()
    .min(Game.TITLE_MIN_LENGTH, `Title must be at least ${Game.TITLE_MIN_LENGTH} characters`)
    .max(Game.TITLE_MAX_LENGTH, `Title must be at most ${Game.TITLE_MAX_LENGTH} characters`)
    .required('Title is required');

/**
 * Creates a Yup validation schema for participant names
 * @returns {Yup.StringSchema} The validation schema
 */
export const participantNameSchema = () =>
  Yup.string()
    .min(Game.PARTICIPANT_NAME_MIN_LENGTH, `Name must be at least ${Game.PARTICIPANT_NAME_MIN_LENGTH} characters`)
    .max(Game.PARTICIPANT_NAME_MAX_LENGTH, `Name must be at most ${Game.PARTICIPANT_NAME_MAX_LENGTH} characters`)
    .required('Name is required');

/**
 * Creates a Yup validation schema for team names
 * @returns {Yup.StringSchema} The validation schema
 */
export const teamNameSchema = () =>
  Yup.string()
    .min(Game.TEAM_NAME_MIN_LENGTH, `Team name must be at least ${Game.TEAM_NAME_MIN_LENGTH} characters`)
    .max(Game.TEAM_MAX_NAME_LENGTH, `Team name must be at most ${Game.TEAM_MAX_NAME_LENGTH} characters`)
    .required('Team name is required');

import { RoundType } from '@/backend/models/rounds/RoundType';

export const roundTypeSchema = () =>
  Yup.string().oneOf(Object.values(RoundType), 'Invalid type.').required('Required.');
