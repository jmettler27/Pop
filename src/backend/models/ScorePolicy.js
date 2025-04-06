import { DEFAULT_LOCALE } from '@/frontend/utils/locales';


export const ScorePolicyType = {
    RANKING: 'ranking',
    COMPLETION_RATE: 'completion_rate'
};


export function isValidScorePolicyType(type) {
    return Object.values(ScorePolicyType).includes(type);
}


export const ScorePolicyTypeToEmoji = {
    [ScorePolicyType.RANKING]: '🏆',
    [ScorePolicyType.COMPLETION_RATE]: '💯'
};

export const ScorePolicyTypeToTitle = {
    'en': {
        [ScorePolicyType.RANKING]: 'Ranking in round',
        [ScorePolicyType.COMPLETION_RATE]: 'Completion rate of round'
    },
    'fr-FR': {
        [ScorePolicyType.RANKING]: 'Classement dans la manche',
        [ScorePolicyType.COMPLETION_RATE]: 'Taux de complétion de la manche'
    }
};

export function scorePolicyTypeToEmoji(type) {
    return ScorePolicyTypeToEmoji[type];
}

export function scorePolicyTypeToTitle(type, locale = DEFAULT_LOCALE) {
    return ScorePolicyTypeToTitle[locale]?.[type] || type;
}

import { prependWithEmojiAndSpace } from '@/backend/utils/emojis';

export function prependScorePolicyTypeWithEmoji(type, locale = DEFAULT_LOCALE) {
    const emoji = scorePolicyTypeToEmoji(type)
    const title = scorePolicyTypeToTitle(type, locale)
    return prependWithEmojiAndSpace(emoji, title)
}

// Base Score Policy class
export class ScorePolicy {
    constructor(type) {
        this.type = type;
    }

    calculateScore(round, teamAnswers) {
        throw new Error('calculateScore must be implemented by subclass');
    }
}

export const ROUND_SCORE_POLICY_TYPES = {
    RANKING: 'ranking',
    COMPLETION_RATE: 'completion_rate',
}

export function isValidRoundScorePolicy(roundScorePolicy) {
    return Object.values(ROUND_SCORE_POLICY_TYPES).includes(roundScorePolicy);
}

// Ranking-based scoring
export class RankingScorePolicy extends ScorePolicy {

    static REWARDS = [3, 2, 1]

    constructor() {
        super('ranking');
    }

    calculateScore(round, teamAnswers) {
        // Implementation for ranking-based scoring
        // This would calculate scores based on team rankings in the round
        return {};
    }
}

// Completion rate-based scoring
export class CompletionRateScorePolicy extends ScorePolicy {

    constructor() {
        super('completion_rate');
    }

    calculateScore(round, teamAnswers) {
        const maxPoints = round.getMaxPoints();
        const scores = {};

        // Calculate completion rate for each team
        Object.entries(teamAnswers).forEach(([teamId, answers]) => {
            let teamScore = 0;
            answers.forEach(answer => {
                if (round.validateAnswer(answer.questionId, answer.value)) {
                    teamScore += answer.points;
                }
            });
            scores[teamId] = Math.round((teamScore / maxPoints) * 100);
        });

        return scores;
    }
}

// Factory function to create the appropriate score policy
export function createScorePolicy(type) {
    switch (type) {
        case ROUND_SCORE_POLICY_TYPES.RANKING:
            return new RankingScorePolicy();
        case ROUND_SCORE_POLICY_TYPES.COMPLETION_RATE:
            return new CompletionRateScorePolicy();
        default:
            return null;
            //throw new Error(`Unknown score policy type: ${type}`);
    }
} 