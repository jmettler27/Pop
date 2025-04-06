import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ReorderingQuestion } from '@/backend/models/questions/Reordering';


export default class BaseReorderingQuestionRepository extends BaseQuestionRepository {
    constructor() {
        super(QuestionType.REORDERING);
    }
}   