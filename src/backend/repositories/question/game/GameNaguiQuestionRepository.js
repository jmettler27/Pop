import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class GameNaguiQuestionRepository extends GameQuestionRepository {
    
    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.NAGUI);
    }

} 