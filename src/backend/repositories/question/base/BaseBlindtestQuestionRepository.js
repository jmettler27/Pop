import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { BlindtestQuestion } from '@/backend/models/questions/Blindtest';


export default class BaseBlindtestQuestionRepository extends BaseQuestionRepository {
    constructor() {
        super(QuestionType.BLINDTEST);
    }
}   