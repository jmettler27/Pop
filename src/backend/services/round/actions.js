'use server';

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { firestore } from '@/backend/firebase/firebase';
import { collection, doc, getDocs, limit, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';

import { aggregateTiedTeams, getNextCyclicIndex, shuffle } from '@/backend/utils/arrays';
import { isBuzzer } from '@/backend/utils/question_types';
import { sortAscendingRoundScores } from '@/backend/utils/rounds';
import { sortScores } from '@/backend/utils/scores';
import { Timer, TimerStatus } from '@/backend/models/Timer';
import { DEFAULT_THINKING_TIME_SECONDS } from '@/backend/utils/question/question';

import { updateTimerStateTransaction, updateTimerTransaction } from '@/backend/repositories/timer/timer';
import { getDocDataTransaction, updateGameStatusTransaction } from '@/backend/services/utils';
import { addSoundTransaction } from '@/backend/services/sound/sounds';

import { GameStatus } from '@/backend/models/games/GameStatus';
import { PlayerStatus } from '@/backend/models/users/Player';
import { RoundType } from '@/backend/models/rounds/RoundType';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';

export async function startRound(gameId, roundId) {
  if (!gameId) {
    throw new Error('No game ID has been provided!');
  }
  if (!roundId) {
    throw new Error('No round ID has been provided!');
  }

  try {
    await runTransaction(firestore, async (transaction) => startRoundTransaction(transaction, gameId, roundId));
    console.log('Round successfully started.');
  } catch (error) {
    console.error('There was an error starting the round:', error);
    throw error;
  }
}
const startRoundTransaction = async (transaction, gameId, roundId) => {
  const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
  const roundData = await getDocDataTransaction(transaction, roundRef);

  await (roundData.type === RoundType.SPECIAL
    ? startSpecialRoundTransaction(transaction, gameId, roundId)
    : moveToNextQuestionTransaction(transaction, gameId, roundId, 0));
};

export async function handleQuestionEnd(gameId, roundId) {
  if (!gameId) {
    throw new Error('No game ID has been provided!');
  }
  if (!roundId) {
    throw new Error('No round ID has been provided!');
  }

  try {
    await runTransaction(firestore, async (transaction) => handleQuestionEndTransaction(transaction, gameId, roundId));
  } catch (error) {
    console.error('There was an error handling the end of the question:', error);
    throw error;
  }
}
const handleQuestionEndTransaction = async (transaction, gameId, roundId) => {
  const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
  const roundData = await getDocDataTransaction(transaction, roundRef);
  const isRoundOver = roundData.currentQuestionIdx === roundData.questions.length - 1;

  await (isRoundOver
    ? endRoundTransaction(transaction, gameId, roundId) /* End of round */
    : // switchRoundNextQuestionTransaction(transaction, gameId, roundId) /* Prepare the next question */
      moveToNextQuestionTransaction(transaction, gameId, roundId, roundData.currentQuestionIdx + 1));
};

export async function endRound(gameId, roundId) {
  if (!gameId) {
    throw new Error('No game ID has been provided!');
  }
  if (!roundId) {
    throw new Error('No round ID has been provided!');
  }
  try {
    await runTransaction(firestore, (transaction) => endRoundTransaction(transaction, gameId, roundId));
    console.log('Round successfully ended.');
  } catch (error) {
    console.error('There was an error ending the round:', error);
    throw error;
  }
}
const endRoundTransaction = async (transaction, gameId, roundId) => {
  const gameRef = doc(GAMES_COLLECTION_REF, gameId);
  const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores');
  const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
  const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores');

  const [gameData, gameScoresData, roundData, roundScoresData] = await Promise.all([
    getDocDataTransaction(transaction, gameRef),
    getDocDataTransaction(transaction, gameScoresRef),
    getDocDataTransaction(transaction, roundRef),
    getDocDataTransaction(transaction, roundScoresRef),
  ]);

  const { roundScorePolicy } = gameData;
  const { scores: currentGlobalScores, scoresProgress: currentGlobalScoresProgress } = gameScoresData;
  // currentGlobalScores:         {team1: globalScore1, team2: globalScore2, ...}
  // currentGlobalScoresProgress: {
  //                                  team1: {round1: global score accumulated at the end of round1, round2: global score accumulated at the end of round2},
  //                                  team2: {round1: global score accumulated at the end of round1, round2:global score accumulated at the end of round2},
  //                              ...}
  const { questions: questionIds, type: roundType, rewardsPerQuestion } = roundData;
  const { scores: roundScores, scoresProgress: currentRoundScoresProgress } = roundScoresData; // {team1: roundScore1, team2: roundScore2, ...}

  let newChooserOrder;
  let roundSortedTeams;
  let roundCompletionRates = null;
  const updatedGlobalScores = { ...currentGlobalScores };

  // Sort the scores obtained in this round according to the notion of "performance" in this round
  // For most rounds, the most performant team is the one with the highest score, but on error-based rounds it is the opposite (e.g., odd one out, matching)
  // Here we calculate the UNIQUE scores, i.e., we remove the duplicates which appear when several teams have the same score
  // Result: sortedUniqueRoundScores = [score1, score2, ...]
  const sortedUniqueRoundScores = sortScores(roundScores, sortAscendingRoundScores(roundType));

  /* ================================ Update the global scores of each team according to their performance in this round ================================ */
  if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
    // Score policy: calculate the "completion rate" of each team w.r.t. the maximum number of points of the round
    // This rate (min 0, max 100) is the score that is added to the global score of the team
    // This policy better reflects the performance of each team in the round

    // Aggregates teams that have obtained the same score in this round
    // Result: roundSortedTeams = [{score: score1, teams: [teamId1, teamId2, ...]}, {score: score2, teams: [teamId3, teamId4, ...]}, ...]
    roundSortedTeams = aggregateTiedTeams(sortedUniqueRoundScores, roundScores);

    if (![QuestionType.ODD_ONE_OUT, QuestionType.MATCHING, RoundType.SPECIAL].includes(roundType)) {
      // Add the calculated rates to the global scores of each team
      const updateGlobalScores = (completionRates) => {
        Object.keys(completionRates).forEach((teamId) => {
          updatedGlobalScores[teamId] = (updatedGlobalScores[teamId] || 0) + completionRates[teamId];
        });
      };

      if ([QuestionType.MCQ, QuestionType.NAGUI].includes(roundType)) {
        const gameQuestionDatas = await Promise.all(
          questionIds.map((questionId) =>
            getDocDataTransaction(
              transaction,
              doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)
            )
          )
        );

        // Aggregate team stats
        const teamStats = gameQuestionDatas.reduce((acc, { teamId, reward }) => {
          if (!acc[teamId]) {
            acc[teamId] = { sumRewards: 0, numQuestions: 0 };
          }
          acc[teamId].sumRewards += reward;
          acc[teamId].numQuestions += 1;
          return acc;
        }, {});

        // Calculate the completion rate (in %) of each team
        roundCompletionRates = Object.entries(teamStats).reduce((acc, [teamId, { sumRewards, numQuestions }]) => {
          const maxPoints =
            roundType === RoundType.NAGUI
              ? numQuestions * rewardsPerQuestion['hide']
              : numQuestions * rewardsPerQuestion;

          acc[teamId] = maxPoints > 0 ? Math.round((100 * sumRewards) / maxPoints) : 0;
          return acc;
        }, {});

        console.log(teamStats);

        updateGlobalScores(roundCompletionRates);
      } else {
        // Calculate the completion rate (in %) of each team
        const calculateCompletionRates = (maxPoints) => {
          return Object.keys(roundScores).reduce((points, teamId) => {
            points[teamId] = maxPoints > 0 ? Math.round((100 * roundScores[teamId]) / maxPoints) : 0;
            return points;
          }, {});
        };

        const { maxPoints } = roundData;
        roundCompletionRates = calculateCompletionRates(maxPoints);
        updateGlobalScores(roundCompletionRates);
      }
    }
  } else if (roundScorePolicy === ScorePolicyType.RANKING) {
    // Score policy: independently of the performance of each team in the round:
    // - the most performant team(s) get(s) the highest reward
    // - the second most performant team(s) get(s) the second highest reward,
    // - ... and so on
    // - If no reward is defined for a given position, the team(s) at this position get 0
    // This reward is the score that is added to the global score of the team

    // Array defining the reward-position pairs
    const { rewards: roundRewards } = roundData; // e.g., [3, 2, 1]

    // Aggregates teams with the same score in this round
    // At the same time, assign the reward accordingly
    // Result: roundSortedTeams = [{score: score1, reward: reward1, teams: [teamId1, teamId2, ...]}, {score: score2, reward: reward2, teams: [teamId3, teamId4, ...]},
    roundSortedTeams = sortedUniqueRoundScores.map((score, index) => {
      const tiedTeams = Object.keys(roundScores).filter((teamId) => roundScores[teamId] === score);
      const shuffledTiedTeams = shuffle(tiedTeams);
      const reward = index < roundRewards.length ? roundRewards[index] : 0;
      tiedTeams.forEach((teamId) => (updatedGlobalScores[teamId] = (updatedGlobalScores[teamId] || 0) + reward));
      return { score, reward, teams: shuffledTiedTeams };
    });
  }

  // The "running order" for the next round prioritizes teams in reverse order of their performance in the current round.
  // The first team in the array - i.e., the least performant (or one of the least performant) - will choose the next round
  // Result: newChooserOrder = [teamId1, teamId2, ...]
  // Because the "tied teams" (i.e., teams with the same score) were shuffled, flattening the array implicitly randomizes the order of teams with the same score.
  // For example, if "TeamA" and "TeamC" are the two least performant teams for this round, the new running order could be ["TeamA", "TeamC", "TeamB"] or ["TeamC", "TeamA", "TeamB"].
  newChooserOrder = roundSortedTeams
    .slice()
    .reverse()
    .flatMap(({ teams }) => shuffle(teams));

  /* ================================================ ROUND PROGRESS ================================================ */

  // Fills the missing scores for each team in this round
  // Indeed, a team may not have won any points in several questions
  // Result: filledRoundProgress = {team1: {question1: score1, question2: score2, ...}, team2: {question1: score1, question2: score2, ...}, ...}
  let filledRoundProgress = {};
  Object.keys(roundScores).forEach((teamId) => {
    const teamRoundProgress = currentRoundScoresProgress[teamId] || {};
    let teamScores = {};
    for (const [idx, questionId] of questionIds.entries()) {
      const scoreAtQuestion = teamRoundProgress[questionId] || null;
      if (scoreAtQuestion != null) {
        teamScores[questionId] = scoreAtQuestion;
        continue;
      }
      if (idx === 0) {
        teamScores[questionId] = 0;
        continue;
      }
      const previousQuestionId = questionIds[idx - 1];
      teamScores[questionId] = teamScores[previousQuestionId];
    }
    filledRoundProgress[teamId] = teamScores;
  });

  // Derives the "sequence of scores" of each team in the round, which describes the points accumulated in the round, question by question
  // This element is useful only for visualization purposes in the summary shown at the end of the round
  // Result: teamsScoresSequences = {team1: [score1, score2, ...], team2: [score1, score2, ...], ...}
  const teamsScoresSequences = Object.entries(filledRoundProgress).reduce((acc, [teamId, teamProgress]) => {
    acc[teamId] = questionIds.map((questionId) => teamProgress[questionId]);
    return acc;
  }, {});

  /* ================================================ GLOBAL PROGRESS ================================================ */

  // Sort the "global scores" accumulated so far in the overall game
  // As the goal for each team is to accumulate the most points in the game, the most performant team(s) is/are the one(s) with the highest score
  // Result: sortedUpdatedGameScores = [score1, score2, ...]
  const sortedUpdatedGameScores = sortScores(updatedGlobalScores, false);

  // Aggregates teams that have accumulated the same global score
  const gameSortedTeams = sortedUpdatedGameScores.map((score) => {
    const tiedTeams = Object.keys(updatedGlobalScores).filter((teamId) => updatedGlobalScores[teamId] === score);
    return { score, teams: tiedTeams };
  });

  // Updates the "progress" of global scores for each team by indicating the global score resulting from this round
  // Result: updatedGlobalScoresProgress = {team1: {round1: global_score1, round2: global_score2, ...}, team2: {round1: global_score1, round2: global_score2, ...}, ...}
  const updatedGlobalScoresProgress = Object.keys(updatedGlobalScores).reduce((progress, teamId) => {
    progress[teamId] = {
      ...currentGlobalScoresProgress[teamId],
      [roundId]: updatedGlobalScores[teamId],
    };
    return progress;
  }, {});

  // Since the previous round (if any), the ranking of the teams w.r.t. the accumulated global scores may have changed
  // This element calculates the "ranking difference" of each team compared to the previous round, i.e., the difference in position in the ranking
  // This element is useful only for visualization purposes in the summary shown at the end of the round
  let rankingDiffs = null;
  if (roundData.order > 0) {
    const roundsRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds');
    const prevRoundSnapshot = await getDocs(query(roundsRef, where('order', '==', roundData.order - 1), limit(1)));
    const prevRound = prevRoundSnapshot.docs[0];
    const prevRoundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', prevRound.id, 'realtime', 'scores');
    const prevRoundScoresData = await getDocDataTransaction(transaction, prevRoundScoresRef);
    rankingDiffs = calculateRankDifferences(prevRoundScoresData.gameSortedTeams, gameSortedTeams);
  }

  /* =================================== WRITES =================================== */
  transaction.update(roundScoresRef, {
    roundSortedTeams,
    gameSortedTeams,
    rankingDiffs,
    scoresProgress: filledRoundProgress,
    teamsScoresSequences,
    ...(roundCompletionRates !== null && { roundCompletionRates }),
  });
  transaction.update(gameScoresRef, {
    scores: updatedGlobalScores,
    scoresProgress: updatedGlobalScoresProgress,
  });

  // If the round is not the last one, update the running order of teams for the next round
  if (roundData.order < gameData.rounds.length - 1) {
    // The first team in the running order - the "chooser" team - chooses the next round, hence the status 'focus'
    // All other teams are set to 'idle'
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players');
    for (const [idx, teamId] of newChooserOrder.entries()) {
      const playersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', teamId)));
      for (const playerDoc of playersSnapshot.docs) {
        transaction.update(playerDoc.ref, {
          status: idx === 0 ? PlayerStatus.FOCUS : PlayerStatus.IDLE,
        });
      }
    }
    const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states');
    transaction.update(chooserRef, {
      chooserIdx: 0,
      chooserOrder: newChooserOrder,
    });
  } else {
    transaction.update(gameScoresRef, {
      gameSortedTeams,
    });
  }

  // Transition to the round summary "slide"

  const readyRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready');
  transaction.update(readyRef, {
    numReady: 0,
  });

  transaction.update(roundRef, {
    dateEnd: serverTimestamp(),
  });
  await updateGameStatusTransaction(transaction, gameId, GameStatus.ROUND_END);
  await addSoundTransaction(transaction, 'level-passed');
  await updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET);
};

export async function handleRoundSelected(gameId, roundId, userId) {
  if (!gameId) {
    throw new Error('No game ID has been provided!');
  }
  if (!roundId) {
    throw new Error('No round ID has been provided!');
  }
  if (!userId) {
    throw new Error('No user ID has been provided!');
  }
  try {
    await runTransaction(firestore, (transaction) =>
      handleRoundSelectedTransaction(transaction, gameId, roundId, userId)
    );
    console.log('Round successfully started.');
  } catch (error) {
    console.error('There was an error starting the round:', error);
    throw error;
  }
}
const handleRoundSelectedTransaction = async (transaction, gameId, roundId, userId) => {
  const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
  const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states');
  const gameRef = doc(GAMES_COLLECTION_REF, gameId);

  const [roundData, chooserData, gameData] = await Promise.all([
    getDocDataTransaction(transaction, roundRef),
    getDocDataTransaction(transaction, chooserRef),
    getDocDataTransaction(transaction, gameRef),
  ]);

  const { type: roundType, questions: questionIds, rewardsPerQuestion, rewardsForBonus, rewardsPerElement } = roundData;
  const { roundScorePolicy, currentRound, currentQuestion } = gameData;

  let prevOrder = -1;
  if (currentRound !== null) {
    const prevRoundData = await getDocDataTransaction(
      transaction,
      doc(GAMES_COLLECTION_REF, gameId, 'rounds', currentRound)
    );
    prevOrder = prevRoundData.order;
  }
  const newOrder = prevOrder + 1;

  let maxPoints = null;

  if (roundScorePolicy === 'completion_rate') {
    const numQuestions = questionIds.length;

    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams');
    const teamsSnapshot = await getDocs(query(teamsCollectionRef));
    const numTeams = teamsSnapshot.docs.length;

    switch (roundType) {
      case RoundType.PROGRESSIVE_CLUES:
      case RoundType.IMAGE:
      case RoundType.BLINDTEST:
      case RoundType.EMOJI:
      case RoundType.BASIC:
      case RoundType.MIXED:
        maxPoints = numQuestions * rewardsPerQuestion;
        break;
      case RoundType.ENUMERATION:
        maxPoints = numQuestions * (rewardsPerQuestion + rewardsForBonus);
        break;
      case RoundType.QUOTE:
        const questions = await Promise.all(
          questionIds.map((questionId) => getDocDataTransaction(transaction, doc(QUESTIONS_COLLECTION_REF, questionId)))
        );
        // The total number of quote elements to guess in the round
        const totalNumElements = questions.reduce((acc, { details: { toGuess, quoteParts } }) => {
          return acc + toGuess.length + (toGuess.includes('quote') ? quoteParts.length - 1 : 0);
        }, 0);
        maxPoints = totalNumElements * rewardsPerElement;
        break;
      case RoundType.LABELLING:
        const _questions = await Promise.all(
          questionIds.map((questionId) => getDocDataTransaction(transaction, doc(QUESTIONS_COLLECTION_REF, questionId)))
        );
        // The total number of quote elements to guess in the round
        const _totalNumElements = _questions.reduce((acc, { details: { labels } }) => {
          return acc + labels.length;
        }, 0);
        maxPoints = _totalNumElements * rewardsPerElement;
        break;
      case RoundType.MCQ:
        maxPoints = Math.ceil(numQuestions / numTeams) * rewardsPerQuestion;
        break;
      case RoundType.NAGUI:
        maxPoints = Math.ceil(numQuestions / numTeams) * rewardsPerQuestion['hide'];
        break;
    }
  }

  if (roundData.dateStart && !roundData.dateEnd && currentQuestion) {
    await updateGameStatusTransaction(transaction, gameId, 'question_active');
    return;
  }

  if (
    isBuzzer(roundType) ||
    [RoundType.QUOTE, RoundType.LABELLING, RoundType.ENUMERATION, RoundType.MIXED].includes(roundType)
  ) {
    // Set the status of every player to 'idle'
    const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players');
    const playersSnapshot = await getDocs(query(playersCollectionRef));

    for (const playerDoc of playersSnapshot.docs) {
      transaction.update(playerDoc.ref, {
        status: PlayerStatus.IDLE,
      });
    }
  }
  if (roundType === RoundType.MCQ || roundType === RoundType.NAGUI) {
    const shuffledQuestionIds = shuffle(questionIds);
    transaction.update(roundRef, {
      questions: shuffledQuestionIds,
    });
  }

  /* Update round object */
  transaction.update(roundRef, {
    dateStart: serverTimestamp(),
    order: newOrder,
    ...(roundType !== RoundType.SPECIAL ? { currentQuestionIdx: 0 } : {}),
    ...(maxPoints !== null && { maxPoints }),
  });

  // If the round requires an order of chooser teams (e.g. OOO, MCQ) and it is the first round, find a random order for the chooser teams
  if (chooserData.chooserOrder.length === 0 || chooserData.chooserIdx === null) {
    const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams');
    const teamsSnapshot = await getDocs(query(teamsCollectionRef));

    // Create an array of random ids for the teams
    const teamIds = teamsSnapshot.docs.map((doc) => doc.id);
    const shuffledTeamIds = shuffle(teamIds);
    transaction.update(chooserRef, {
      chooserOrder: shuffledTeamIds,
    });
  }

  transaction.update(chooserRef, {
    chooserIdx: 0,
  });

  await updateTimerTransaction(transaction, gameId, {
    status: TimerStatus.RESET,
    duration: Timer.READY_COUNTDOWN_SECONDS,
    authorized: false,
  });

  await addSoundTransaction(transaction, 'super_mario_odyssey_moon');

  transaction.update(gameRef, {
    currentRound: roundId,
    currentQuestion: null,
    status: GameStatus.ROUND_START, // Go to intro slide
  });
};

const moveToNextQuestionTransaction = async (transaction, gameId, roundId, questionOrder) => {
  /* Game: fetch next question and reset every player's state */
  const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
  const chooserRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'states');

  const [roundData, chooserData] = await Promise.all([
    getDocDataTransaction(transaction, roundRef),
    getDocDataTransaction(transaction, chooserRef),
  ]);

  const questionId = roundData.questions[questionOrder];
  const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId);
  const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId);

  const baseQuestion = await getDocDataTransaction(transaction, baseQuestionRef);
  const defaultThinkingTime = DEFAULT_THINKING_TIME_SECONDS[baseQuestion.type];

  const playersCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'players');

  const { chooserOrder, chooserIdx } = chooserData;

  if (baseQuestion.type === QuestionType.MCQ || baseQuestion.type === QuestionType.NAGUI) {
    const chooserTeamId = chooserOrder[chooserIdx];

    if (questionOrder > 0) {
      const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length);
      const newChooserTeamId = chooserOrder[newChooserIdx];
      transaction.update(chooserRef, {
        chooserIdx: newChooserIdx,
      });
      transaction.update(gameQuestionRef, {
        teamId: newChooserTeamId,
      });
      const newChoosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', newChooserTeamId)));
      for (const playerDoc of newChoosersSnapshot.docs) {
        transaction.update(playerDoc.ref, {
          status: PlayerStatus.FOCUS,
        });
      }
      const prevChoosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', chooserTeamId)));
      for (const playerDoc of prevChoosersSnapshot.docs) {
        transaction.update(playerDoc.ref, {
          status: PlayerStatus.IDLE,
        });
      }
    } else {
      transaction.update(gameQuestionRef, {
        teamId: chooserTeamId,
      });
    }

    // await updateTimerTransaction(transaction, gameId, { status: TimerStatus.RESET, managedBy, duration: defaultThinkingTime })
    await updateTimerTransaction(transaction, gameId, { status: TimerStatus.RESET, duration: defaultThinkingTime });
  } else if (baseQuestion.type === QuestionType.ODD_ONE_OUT || baseQuestion.type === QuestionType.MATCHING) {
    const newChooserIdx = 0;
    const newChooserTeamId = chooserOrder[newChooserIdx];
    transaction.update(chooserRef, {
      chooserIdx: newChooserIdx,
    });
    const choosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '==', newChooserTeamId)));
    for (const playerDoc of choosersSnapshot.docs) {
      transaction.update(playerDoc.ref, {
        status: PlayerStatus.FOCUS,
      });
    }
    const nonChoosersSnapshot = await getDocs(query(playersCollectionRef, where('teamId', '!=', newChooserTeamId)));
    for (const playerDoc of nonChoosersSnapshot.docs) {
      transaction.update(playerDoc.ref, {
        status: PlayerStatus.IDLE,
      });
    }
    if (baseQuestion.type === QuestionType.MATCHING) {
      // await updateTimerTransaction(transaction, gameId, { status: TimerStatus.RESET, managedBy, duration: defaultThinkingTime * (baseQuestion.details.numCols - 1) })
      await updateTimerTransaction(transaction, gameId, {
        status: TimerStatus.RESET,
        duration: defaultThinkingTime * (baseQuestion.details.numCols - 1),
      });
    } else {
      // await updateTimerTransaction(transaction, gameId, { status: TimerStatus.RESET, managedBy, duration: defaultThinkingTime })
      await updateTimerTransaction(transaction, gameId, { status: TimerStatus.RESET, duration: defaultThinkingTime });
    }
  } else {
    const playersSnapshot = await getDocs(query(playersCollectionRef));
    for (const playerDoc of playersSnapshot.docs) {
      transaction.update(playerDoc.ref, {
        status: PlayerStatus.IDLE,
      });
    }
    if (baseQuestion.type === QuestionType.ENUMERATION) {
      // await updateTimerTransaction(transaction, gameId, { status: TimerStatus.RESET, managedBy, duration: baseQuestion.details.thinkingTime })
      await updateTimerTransaction(transaction, gameId, {
        status: TimerStatus.RESET,
        duration: baseQuestion.details.thinkingTime,
      });
    } else {
      // await updateTimerTransaction(transaction, gameId, { status: TimerStatus.RESET, managedBy, duration: defaultThinkingTime })
      await updateTimerTransaction(transaction, gameId, { status: TimerStatus.RESET, duration: defaultThinkingTime });
    }
  }

  if (baseQuestion.type !== QuestionType.BLINDTEST) {
    await addSoundTransaction(transaction, 'skyrim_skill_increase');
  }

  transaction.update(gameQuestionRef, {
    dateStart: serverTimestamp(),
  });

  transaction.update(roundRef, {
    currentQuestionIdx: questionOrder,
  });

  const gameRef = doc(GAMES_COLLECTION_REF, gameId);
  transaction.update(gameRef, {
    currentQuestion: questionId,
    status: GameStatus.QUESTION_ACTIVE,
  });

  const readyRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready');
  transaction.update(readyRef, {
    numReady: 0,
  });
};
