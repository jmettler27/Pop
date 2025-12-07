import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { BasicQuestion } from '@/backend/models/questions/Basic';


export default class BaseBasicQuestionRepository extends BaseQuestionRepository {
    constructor() {
        super(QuestionType.BASIC);
    }
}   