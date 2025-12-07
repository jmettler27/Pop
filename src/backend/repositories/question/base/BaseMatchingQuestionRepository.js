import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { MatchingQuestion } from '@/backend/models/questions/Matching';


export default class BaseMatchingQuestionRepository extends BaseQuestionRepository {
    constructor() {
        super(QuestionType.MATCHING);
    }
}   