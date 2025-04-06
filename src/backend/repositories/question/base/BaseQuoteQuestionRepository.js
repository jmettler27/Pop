import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { QuoteQuestion } from '@/backend/models/questions/Quote';


export default class BaseQuoteQuestionRepository extends BaseQuestionRepository {
    constructor() {
        super(QuestionType.QUOTE);
    }
}   