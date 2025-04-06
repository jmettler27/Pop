import { BaseQuestion, GameQuestion } from '@/backend/models/questions/Question';
import { QuestionType } from '@/backend/models/questions/QuestionType';
// MCQ questions
export class MCQQuestion extends BaseQuestion {

    static CHOICES = ["A", "B", "C", "D"];
    static MIN_CHOICES = 2;
    static MAX_CHOICES = MCQQuestion.CHOICES.length;
    static CHOICE_MAX_LENGTH = 100;

    static SOURCE_MAX_LENGTH = 50;
    static TITLE_MAX_LENGTH = 125;
    static NOTE_MAX_LENGTH = 500;
    static EXPLANATION_MAX_LENGTH = 500;

    constructor(data) {
        super(data);
        this.constructor.validate(data);

        this.choices = data.choices || data.details.choices;
        this.answerIdx = data.answerIdx || data.details.answerIdx;
        this.source = data.source || data.details.source;
        this.title = data.title || data.details.title;
        this.note = data.note || data.details.note;
        this.explanation = data.explanation || data.details.explanation;

    }

    getQuestionType() {
        return QuestionType.MCQ;
    }

    toObject() {
        return {
            ...super.toObject(),
            details: {
                choices: this.choices,
                answerIdx: this.answerIdx,
                source: this.source,
                title: this.title,
                note: this.note,
                explanation: this.explanation
            }
        };
    }

    setImage(imageUrl) {
        this.image = imageUrl;
    }

    setAudio(audioUrl) {
        this.audio = audioUrl;
    }


    static validate(data) {
        super.validate(data);

        this.validateChoices(data);
        this.validateExplanation(data);
        this.validateNote(data);
        this.validateSource(data);
        this.validateTitle(data);

        return true;
    }

    static validateChoices(data) {
        const choices = data.choices || data.details.choices;
        if (!choices) {
            throw new Error("MCQ must have choices");
        }
        if (choices.length < this.constructor.MIN_CHOICES) {
            throw new Error("MCQ must have at least 2 choices");
        }
        if (choices.length > this.constructor.MAX_CHOICES) {
            throw new Error("MCQ must have at most 4 choices");
        }
        for (let i = 0; i < choices.length; i++) {
            const choice = choices[i];
            if (typeof choice !== 'string') {
                throw new Error("MCQ choices must be an array of strings");
            }
            if (choice.length > this.constructor.CHOICE_MAX_LENGTH) {
                throw new Error("MCQ choice must be at most 100 characters");
            }
        }

        if (typeof answerIdx !== 'number') {
            throw new Error("MCQ answer index must be a number");
        }
        if (answerIdx < 0 || answerIdx >= choices.length) {
            throw new Error("MCQ answer index must be between 0 and 3");
        }

        return true;
    }

    static validateExplanation(data) {
        const explanation = data.explanation || data.details.explanation;
        if (explanation) {
            if (typeof explanation !== 'string') {
                throw new Error("MCQ explanation must be a string");
            }
            if (explanation.length > this.constructor.EXPLANATION_MAX_LENGTH) {
                throw new Error("MCQ explanation must be at most 500 characters");
            }
        }

        return true;
    }
    
    static validateNote(data) {
        const note = data.note || data.details.note;
        if (note) {
            if (typeof note !== 'string') {
                throw new Error("MCQ note must be a string");
            }
            if (note.length > this.constructor.NOTE_MAX_LENGTH) {
                throw new Error("MCQ note must be at most 500 characters");
            }
        }

        return true;
    }

    static validateSource(data) {
        const source = data.source || data.details.source;
        if (source) {
            if (typeof source !== 'string') {
                throw new Error("MCQ source must be a string");
            }
            if (source.length > this.constructor.SOURCE_MAX_LENGTH) {
                throw new Error("MCQ source must be at most 50 characters");
            }
        }
    }

    static validateTitle(data) {
        const title = data.title || data.details.title;
        if (!title) {
            throw new Error("MCQ must have a title");
        }
        if (typeof title !== 'string') {
            throw new Error("MCQ title must be a string");
        }
        if (title.length > this.constructor.TITLE_MAX_LENGTH) {
            throw new Error("MCQ title must be at most 125 characters");
        }

        return true;
    }
    
    isValidAnswer(idx) {
        return idx === this.answerIdx;
    }
}

export class GameMCQQuestion extends GameQuestion {

    static THINKING_TIME = 20;
    static REWARD = 1;

    constructor(data) {
        super(data);
        this.constructor.validate(data);
        
        this.correct = data.correct || null
        this.choiceIdx = data.choiceIdx || null
        this.playerID = data.playerID || null
        this.reward = data.reward || null
        this.teamId = data.teamId || null
    }
    
    toObject() {
        return {
            ...super.toObject(),
            correct: this.correct,
            choiceIdx: this.choiceIdx,
            playerID: this.playerID,
            reward: this.reward,
            teamId: this.teamId
        };
    }

    getQuestionType() {
        return QuestionType.MCQ;
    }

    static validate(data) {
        super.validate(data);

        this.validateCorrect(data);
        this.validateChoiceIdx(data);
        this.validatePlayerID(data);
        this.validateReward(data);
        this.validateTeamId(data);

        return true;
    }

    static validateCorrect(data) {
        const correct = data.correct;
        if (correct) {
            if (typeof correct !== 'boolean') {
                throw new Error("MCQ correct must be a boolean");
            }
        }
        return true;
    }

    static validateChoiceIdx(data) {
        const choiceIdx = data.choiceIdx;
        if (choiceIdx) {
            if (typeof choiceIdx !== 'number') {
                throw new Error("MCQ choice index must be a number");
            }
        }
        return true;
    }

    static validatePlayerID(data) {
        const playerID = data.playerID;
        if (playerID) {
            if (typeof playerID !== 'string') {
                throw new Error("MCQ player ID must be a string");
            }
        }
        return true;
    }

    static validateReward(data) {
        const reward = data.reward;
        if (reward) {
            if (typeof reward !== 'number') {
                throw new Error("MCQ reward must be a number");
            }
        }
        return true;
    }

    static validateTeamId(data) {
        const teamId = data.teamId;
        if (teamId) {
            if (typeof teamId !== 'string') {
                throw new Error("MCQ team ID must be a string");
            }
        }
        return true;
    }

    reset() {
        super.reset();

        this.correct = null
        this.choiceIdx = null
        this.playerID = null
        this.reward = null
        this.teamId = null
    }
}
