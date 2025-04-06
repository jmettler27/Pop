import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

export class BaseRiddleQuestionRepository extends BaseQuestionRepository {
    
    constructor(questionType) {
        super(questionType);
    }
}


