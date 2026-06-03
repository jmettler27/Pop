import { runTransaction, Timestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import GameQuestionService, { SYSTEM_PLAYER_ID } from '@/backend/services/question/GameQuestionService';
import { getNextCyclicIndex, getRandomElement, moveToHead } from '@/backend/utils/arrays';
import { GameOddOneOutQuestion, OddOneOutQuestion, SelectedItem } from '@/models/questions/odd-one-out';
import { QuestionType } from '@/models/questions/question-type';
import { OddOneOutRound } from '@/models/rounds/odd-one-out';
import { ScorePolicyType } from '@/models/score-policy';
import { Player, PlayerStatus } from '@/models/users/player';

export default class GameOddOneOutQuestionService extends GameQuestionService {
  readonly chooserRepo: ChooserRepository;

  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.ODD_ONE_OUT);
    this.log = logger.child({ module: 'GameOddOneOutQuestionService', game: gameId, round: roundId });
    this.chooserRepo = new ChooserRepository(gameId);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameOddOneOutQuestion;
    await this.chooserRepo.resetChoosersTransaction(transaction);
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    // await super.resetQuestionTransaction(transaction, questionId);

    this.log.info({ question: questionId }, 'OOO question reset');
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    await super.endQuestionTransaction(transaction, questionId);
    // await this.gameQuestionRepo.clearBuzzedPlayersTransaction(transaction, questionId);
    this.log.info({ question: questionId }, 'OOO question ended');
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as OddOneOutQuestion;
    if (!baseQuestion) {
      this.log.warn({ question: questionId }, 'Base question not found');
      throw new Error('Base question not found');
    }

    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameOddOneOutQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    const selectedIdxsSet = new Set(gameQuestion.selectedItems.map((item: SelectedItem) => item.idx));
    const remainingIndices = [];
    for (let i = 0; i < baseQuestion.items!.length; i++) {
      if (!selectedIdxsSet.has(i)) {
        remainingIndices.push(i);
      }
    }
    this.log.debug({ question: questionId, remainingIndices }, 'Handling OOO countdown end');

    const randomIdx = getRandomElement(remainingIndices);
    await this.selectProposalTransaction(transaction, questionId, SYSTEM_PLAYER_ID, randomIdx);

    this.log.info({ question: questionId, selectedIdx: randomIdx }, 'OOO question countdown end handled');
  }

  /* =============================================================================================================== */

  /**
   * Select a proposal in an Odd One Out question
   * @param {string} questionId - ID of the question
   * @param {string} playerId - ID of the player
   * @param {number} idx - Index of the selected proposal
   * @returns {Promise<void>}
   */
  async selectProposal(questionId: string, playerId: string, idx: number): Promise<void> {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }
    if (idx < 0 || idx >= OddOneOutQuestion.MAX_NUM_ITEMS) {
      throw new Error('Invalid proposal index!');
    }

    await runTransaction(
      firestore,
      async (transaction) => await this.selectProposalTransaction(transaction, questionId, playerId, idx)
    );
  }

  async selectProposalTransaction(
    transaction: Transaction,
    questionId: string,
    playerId: string,
    idx: number
  ): Promise<void> {
    const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
    if (!game) {
      this.log.warn({ question: questionId }, 'Game not found');
      throw new Error('Game not found');
    }

    const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as OddOneOutRound;
    if (!round) {
      this.log.warn({ question: questionId }, 'Round not found');
      throw new Error('Round not found');
    }

    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as OddOneOutQuestion;
    if (!baseQuestion) {
      this.log.warn({ question: questionId }, 'Base question not found');
      throw new Error('Base question not found');
    }

    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameOddOneOutQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    const chooser = await this.chooserRepo.getChooserTransaction(transaction);
    if (!chooser) {
      this.log.warn({ question: questionId }, 'Chooser not found');
      throw new Error('Chooser not found');
    }
    const chooserOrder = chooser.chooserOrder;
    const chooserIdx = chooser.chooserIdx;
    const teamId = chooserOrder[chooserIdx];

    if (playerId != SYSTEM_PLAYER_ID) {
      const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
      if (!player) {
        this.log.warn({ question: questionId, player: playerId }, 'Player not found');
        throw new Error('Player not found');
      }
      if (player.teamId !== teamId) {
        this.log.warn({ question: questionId, player: playerId, team: teamId }, 'Player is not in the chooser team');
        throw new Error('Player is not in the chooser team');
      }
    }

    const teamPlayers = await this.playerRepo.getPlayersByTeamId(teamId);
    if (!teamPlayers) {
      this.log.warn({ question: questionId }, 'Team players not found');
      throw new Error('Team players not found');
    }

    if (idx === baseQuestion.answerIdx) {
      // The selected proposal is the odd one out
      const roundScorePolicy = game.roundScorePolicy;
      const mistakePenalty = round.mistakePenalty;

      if (roundScorePolicy === ScorePolicyType.RANKING) {
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, mistakePenalty);
      } else if (roundScorePolicy === ScorePolicyType.COMPLETION_RATE) {
        await this.increaseGlobalTeamScoreTransaction(transaction, questionId, mistakePenalty, teamId);
      }

      // Move winner to head of chooser list
      const newChooserOrder = moveToHead(teamId, chooserOrder);
      await this.chooserRepo.updateChooserOrderTransaction(transaction, newChooserOrder);

      // Update question winner and end question
      await this.gameQuestionRepo.updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId);
      await this.soundRepo.addSoundTransaction(transaction, 'hysterical5');
      await this.endQuestionTransaction(transaction, questionId);
    } else {
      // The selected proposal is correct
      const newNumClicked = gameQuestion.selectedItems.length + 1;

      if (newNumClicked === baseQuestion.items!.length - 1) {
        // No one selected the odd one out
        await this.soundRepo.addSoundTransaction(transaction, 'zelda_secret_door');
        await this.endQuestionTransaction(transaction, questionId);
      } else {
        // The selected proposal is not the last remaining one
        const newChooserIdx = getNextCyclicIndex(chooserIdx, chooserOrder.length);
        await this.chooserRepo.updateChooserIndexTransaction(transaction, newChooserIdx);
        const newChooserTeamId = chooserOrder[newChooserIdx];
        const newChooserTeamPlayers = await this.playerRepo.getPlayersByTeamId(newChooserTeamId);
        if (!newChooserTeamPlayers) {
          this.log.warn({ question: questionId, team: newChooserTeamId }, 'New chooser team players not found');
          throw new Error('New chooser team players not found');
        }

        await this.playerRepo.updateAllPlayersStatusTransaction(
          transaction,
          PlayerStatus.FOCUS,
          newChooserTeamPlayers.map((p: Player) => p.id!)
        );
        await this.soundRepo.addSoundTransaction(transaction, 'bien');
        await this.timerRepo.startTimerTransaction(transaction, gameQuestion.thinkingTime);
      }

      // Update player statuses
      await this.playerRepo.updateAllPlayersStatusTransaction(
        transaction,
        PlayerStatus.IDLE,
        teamPlayers.map((p: Player) => p.id!)
      );
    }

    // Update selected items and timer
    await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
      selectedItems: [
        ...gameQuestion.selectedItems,
        {
          idx,
          playerId,
          timestamp: Timestamp.now(),
        },
      ],
    });
    await this.timerRepo.updateAuthorized(false);

    this.log.info({ question: questionId, player: playerId, option: idx }, 'OOO proposal selected');
  }
}
