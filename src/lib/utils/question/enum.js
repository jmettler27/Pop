/* Enumeration */

export const ENUM_TITLE_EXAMPLE = "List all Pokémon versions"
export const ENUM_TITLE_MAX_LENGTH = 75

export const ENUM_NOTE_EXAMPLE = "Main series only!"
export const ENUM_NOTE_MAX_LENGTH = 50

export const ENUM_ANSWER_EXAMPLE = [
    "Green",
    "Blue",
    "Red",
    "Yellow",
    "Gold",
    "Silver",
    "Crystal",
    "Ruby",
    "Sapphire",
    "Emerald",
    "Diamond",
    "FireRed",
    "LeafGreen",
    "Pearl",
    "Platinum",
    "HeartGold",
    "SoulSilver",
    "Black",
    "White",
    "Black 2",
    "White 2",
    "X",
    "Y",
    "Omega Ruby",
    "Alpha Sapphire",
    "Sun",
    "Moon",
    "Ultra Sun",
    "Ultra Moon",
    "Let's Go, Pikachu!",
    "Let's Go, Eevee!",
    "Sword",
    "Shield",
    "Brilliant Diamond",
    "Shining Pearl",
    "Legends Arceus",
    "Violet",
    "Scarlet",

]
export const ENUM_ANSWER_ITEM_MAX_LENGTH = 50
export const ENUM_MIN_NUMBER_OF_ANSWERS = 2;
export const ENUM_MAX_NUMBER_OF_ANSWERS = 100;

export const ENUM_MIN_THINKING_SECONDS = 60;
export const ENUM_MAX_THINKING_SECONDS = 60 * 5

export const ENUM_MIN_CHALLENGE_SECONDS = 30;
export const ENUM_MAX_CHALLENGE_SECONDS = 60 * 2

export const ENUM_DEFAULT_REWARD = 1
export const ENUM_DEFAULT_BONUS = 1


/* In-game logic */
export function findHighestBidder(bets) {
    if (!Array.isArray(bets) || bets.length === 0) {
        throw new Error("Invalid input: bets must be a non-empty array");
    }

    // Note: since players are appended to the array in the order they bet, the first player with the max bet is the challenger
    const playerWithMaxBet = bets.reduce((max, current) => current.bet > max.bet ? current : max, bets[0]);

    return [playerWithMaxBet.playerId, playerWithMaxBet.teamId, playerWithMaxBet.bet];
}