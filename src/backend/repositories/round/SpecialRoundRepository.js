import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class SpecialRoundRepository extends RoundRepository {

    static THEMES_PATH = ['themes'];
    
    constructor(gameId) {
        super(gameId);
    }

    async updateGameTheme(gameId, roundId, themeId, fieldsToUpdate) {
        // const themeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'themes', themeId)
        // const updateObject = { ...fieldsToUpdate }
    
        // await updateDoc(themeRef, updateObject)
        // console.log(`Game ${gameId}, Round ${roundId}, Theme ${themeId}:`, fieldsToUpdate)
    }

    async getSpecialSectionData(themeId, sectionId) {
        // return getDocData('questions', themeId, 'sections', sectionId);
    }
} 