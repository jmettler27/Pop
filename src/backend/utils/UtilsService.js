import { firestore } from '@/backend/firebase/firebase';
import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';

export default class UtilsService {
  constructor() {
    this.collection = GAMES_COLLECTION_REF;
  }

  async getDocDataTransaction(transaction, docRef) {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }

  async getCollectionDataTransaction(transaction, collectionRef) {
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getGameData(gameId) {
    if (!gameId) {
      throw new Error('Missing required parameters');
    }

    const gameRef = doc(this.collection, gameId);
    return await this.getDocDataTransaction(null, gameRef);
  }

  async getRoundData(gameId, roundId) {
    if (!gameId || !roundId) {
      throw new Error('Missing required parameters');
    }

    const roundRef = doc(this.collection, gameId, 'rounds', roundId);
    return await this.getDocDataTransaction(null, roundRef);
  }

  async getQuestionData(gameId, roundId, questionId) {
    if (!gameId || !roundId || !questionId) {
      throw new Error('Missing required parameters');
    }

    const baseQuestionRef = doc(this.collection, gameId, 'rounds', roundId, 'questions', questionId);
    return await this.getDocDataTransaction(null, baseQuestionRef);
  }

  async getPlayerData(gameId, playerId) {
    if (!gameId || !playerId) {
      throw new Error('Missing required parameters');
    }

    const playerRef = doc(this.collection, gameId, 'players', playerId);
    return await this.getDocDataTransaction(null, playerRef);
  }

  async getTeamData(gameId, teamId) {
    if (!gameId || !teamId) {
      throw new Error('Missing required parameters');
    }

    const teamRef = doc(this.collection, gameId, 'teams', teamId);
    return await this.getDocDataTransaction(null, teamRef);
  }

  async getGamePlayers(gameId) {
    if (!gameId) {
      throw new Error('Missing required parameters');
    }

    const playersRef = collection(this.collection, gameId, 'players');
    return await this.getCollectionDataTransaction(null, playersRef);
  }

  async getGameTeams(gameId) {
    if (!gameId) {
      throw new Error('Missing required parameters');
    }

    const teamsRef = collection(this.collection, gameId, 'teams');
    return await this.getCollectionDataTransaction(null, teamsRef);
  }

  async getRoundQuestions(gameId, roundId) {
    if (!gameId || !roundId) {
      throw new Error('Missing required parameters');
    }

    const questionsRef = collection(this.collection, gameId, 'rounds', roundId, 'questions');
    return await this.getCollectionDataTransaction(null, questionsRef);
  }

  async getQuestionAnswers(gameId, roundId, questionId) {
    if (!gameId || !roundId || !questionId) {
      throw new Error('Missing required parameters');
    }

    const answersRef = collection(this.collection, gameId, 'rounds', roundId, 'questions', questionId, 'answers');
    return await this.getCollectionDataTransaction(null, answersRef);
  }
}
