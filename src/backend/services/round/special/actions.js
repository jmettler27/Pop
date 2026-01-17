'use server';

import SpecialRoundService from '@/backend/services/round/special/SpecialRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.handleRoundSelected(userId);
};

/**
 * round_start -> special_home
 *
 */
export const startRound = async (gameId, roundId) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.startRound();
};

export const handleQuestionEnd = async (gameId, roundId) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.handleQuestionEnd();
};

export const endRound = async (gameId, roundId) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.endRound();
};

/* ============================================================================================================ */

/**
 * special_home -> theme_active (question_active)
 */
export const startTheme = async (gameId, roundId, themeId) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.startTheme(themeId);
};

/**
 * theme_active (question_active)
 *
 * TODO: make status in a different array and update only this array
 */
export const handlePlayerAnswer = async (gameId, roundId, themeId, sectionId, questionId, playerId, answer) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.handlePlayerAnswer(themeId, sectionId, questionId, playerId, answer);
};

export const handleQuestionEndOrganizerContinue = async (gameId, roundId, themeId, sectionId, questionId) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.handleQuestionEndOrganizerContinue(themeId, sectionId, questionId);
};

/**
 * theme_active (question_end) -> theme_active (question_active)
 */
export const switchThemeNextSection = async (gameId, roundId, themeId) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.switchThemeNextSection(themeId);
};

export const resetTheme = async (gameId, roundId, themeId) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.resetTheme(themeId);
};

/**
 * theme_active -> theme_end
 */
export const endTheme = async (gameId, roundId, themeId) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.endTheme(themeId);
};

/**
 * theme_end -> special_home
 */
export const goHome = async (gameId, roundId) => {
  const service = new SpecialRoundService(gameId, roundId);
  return service.goHome();
};
