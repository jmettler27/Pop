import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

export class BaseBuzzerQuestionRepository extends BaseQuestionRepository {
    
    constructor(questionType) {
        super(questionType);
    }
}


