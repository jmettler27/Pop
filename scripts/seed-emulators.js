/**
 * Seed script for Firebase Emulator Suite.
 *
 * Populates Firestore and (optionally) Storage emulators with sample data
 * so you can develop and test without touching production Firebase.
 *
 * Usage:
 *   1. Start emulators:  npm run emulators
 *   2. Run this script:  npm run seed
 *
 * Prerequisites: emulators must be running on the default ports
 * (Firestore 8080, Storage 9199).
 */

const FIRESTORE_HOST = '127.0.0.1:8080';
const PROJECT_ID = 'demo-pop';
const BASE_URL = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Helpers ────────────────────────────────────────────────────────────────

async function setDocument(collectionPath, docId, fields) {
    const url = `${BASE_URL}/${collectionPath}/${docId}`;
    const body = { fields: toFirestoreFields(fields) };
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to set ${collectionPath}/${docId}: ${res.status} ${text}`);
    }
    return res.json();
}

/**
 * Convert a plain JS object into Firestore REST API "fields" format.
 */
function toFirestoreFields(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
        fields[key] = toFirestoreValue(value);
    }
    return fields;
}

function toFirestoreValue(value) {
    if (value === null || value === undefined) {
        return { nullValue: null };
    }
    if (typeof value === 'boolean') {
        return { booleanValue: value };
    }
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return { integerValue: String(value) };
        }
        return { doubleValue: value };
    }
    if (typeof value === 'string') {
        return { stringValue: value };
    }
    if (value instanceof Date) {
        return { timestampValue: value.toISOString() };
    }
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(toFirestoreValue),
            },
        };
    }
    if (typeof value === 'object') {
        return {
            mapValue: {
                fields: toFirestoreFields(value),
            },
        };
    }
    return { stringValue: String(value) };
}

// ─── Seed Data ──────────────────────────────────────────────────────────────

const now = new Date();

// Users
const USER_1_ID = 'user_alice';
const USER_2_ID = 'user_bob';
const USER_3_ID = 'user_charlie';
const USER_4_ID = 'user_david';
const USER_5_ID = 'user_eve';
const USER_6_ID = 'user_frank';

// Games
const GAME_1_ID = 'game_rounds_1';

// Teams
const TEAM_1_ID = 'team_red';
const TEAM_2_ID = 'team_blue';

// Rounds
const ROUND_BASIC_ID = 'round_basic';
const ROUND_BLINDTEST_ID = 'round_blindtest';
const ROUND_EMOJI_ID = 'round_emoji';
const ROUND_ENUMERATION_ID = 'round_enumeration';
const ROUND_IMAGE_ID = 'round_image';
const ROUND_LABELLING_ID = 'round_labelling';
const ROUND_MATCHING_ID = 'round_matching';
const ROUND_MCQ_ID = 'round_mcq';
const ROUND_NAGUI_ID = 'round_nagui';
const ROUND_ODD_ONE_OUT_ID = 'round_odd_one_out';
const ROUND_PROGRESSIVE_CLUES_ID = 'round_progressive_clues';
const ROUND_QUOTE_ID = 'round_quote';
const ROUND_REORDERING_ID = 'round_reordering';

// Questions
const Q_BASIC_1 = 'q_basic_1';
const Q_BASIC_2 = 'q_basic_2';
const Q_BLINDTEST_1 = 'q_blindtest_1';
const Q_BLINDTEST_2 = 'q_blindtest_2';
const Q_EMOJI_1 = 'q_emoji_1';
const Q_EMOJI_2 = 'q_emoji_2';
const Q_ENUMERATION_1 = 'q_enumeration_1';
const Q_ENUMERATION_2 = 'q_enumeration_2';
const Q_IMAGE_1 = 'q_image_1';
const Q_IMAGE_2 = 'q_image_2';
const Q_LABELLING_1 = 'q_labelling_1';
const Q_LABELLING_2 = 'q_labelling_2';
const Q_MATCHING_1 = 'q_matching_1';
const Q_MATCHING_2 = 'q_matching_2';
const Q_MCQ_1 = 'q_mcq_1';
const Q_MCQ_2 = 'q_mcq_2';
const Q_NAGUI_1 = 'q_nagui_1';
const Q_NAGUI_2 = 'q_nagui_2';
const Q_ODD_1 = 'q_odd_1';
const Q_ODD_2 = 'q_odd_2';
const Q_PROGRESSIVE_CLUES_1 = 'q_progressive_clues_1';
const Q_PROGRESSIVE_CLUES_2 = 'q_progressive_clues_2';
const Q_QUOTE_1 = 'q_quote_1';
const Q_QUOTE_2 = 'q_quote_2';
const Q_REORDERING_1 = 'q_reordering_1';
const Q_REORDERING_2 = 'q_reordering_2';

async function seedUsers() {
    console.log('  Seeding users...');
    await setDocument('users', USER_1_ID, {
        name: 'Alice',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    });
    await setDocument('users', USER_2_ID, {
        name: 'Bob',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    });
    await setDocument('users', USER_3_ID, {
        name: 'Charlie',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    });
    await setDocument('users', USER_4_ID, {
        name: 'David',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    });
    await setDocument('users', USER_5_ID, {
        name: 'Eve',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve',
    });
    await setDocument('users', USER_6_ID, {
        name: 'Frank',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank',
    });

}

async function seedQuestions() {
    console.log('  Seeding questions...');

    // Basic questions
    await setDocument('questions', Q_BASIC_1, {
        type: 'basic',
        topic: 'video_game',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            title: 'In which year was the first Super Mario Bros. game released?',
            answer: '1985',
            explanation: 'Super Mario Bros. was released for the NES in 1985.',
            note: '',
            source: '',
        },
    });

    await setDocument('questions', Q_BASIC_2, {
        type: 'basic',
        topic: 'movie',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            title: 'Who directed this movie?',
            answer: 'Christopher Nolan',
            explanation: 'Inception (2010) was directed by Christopher Nolan.',
            note: '',
            source: 'Inception',
        },
    });

    // Blindtest questions
    await setDocument('questions', Q_BLINDTEST_1, {
        type: 'blindtest',
        topic: 'music',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            answer: {
                author: 'SoundHelix',
                title: 'SoundHelix Song 1',
            },
            audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            subtype: 'song',
            title: 'Name this song',
        },
    });

    await setDocument('questions', Q_BLINDTEST_2, {
        type: 'blindtest',
        topic: 'music',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            answer: {
                author: 'SoundHelix',
                title: 'SoundHelix Song 2',
            },
            audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            subtype: 'song',
            title: 'Name this song',
        },
    });

    // Emoji questions
    await setDocument('questions', Q_EMOJI_1, {
        type: 'emoji',
        topic: 'movie',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            title: 'Guess the movie',
            clue: '🦁👑',
            answer: {
                title: 'The Lion King',
                image: 'https://upload.wikimedia.org/wikipedia/en/3/3d/The_Lion_King_poster.jpg',
            },
        },
    });

    await setDocument('questions', Q_EMOJI_2, {
        type: 'emoji',
        topic: 'tv',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            title: 'Guess the TV show',
            clue: '👨‍⚕️🧑‍⚕️🏥',
            answer: {
                title: 'Grey\'s Anatomy',
                image: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Grey%27s_Anatomy_Logo.svg',
            },
        },
    });

    // Enumeration questions
    await setDocument('questions', Q_ENUMERATION_1, {
        type: 'enumeration',
        topic: 'entertainment',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            answer: ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'],
            challengeTime: 15,
            maxIsKnown: true,
            note: 'From the Harry Potter series by J.K. Rowling',
            thinkingTime: 30,
            title: 'Name the 4 Hogwarts houses',
        },
    });

    await setDocument('questions', Q_ENUMERATION_2, {
        type: 'enumeration',
        topic: 'sports',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            answer: ['Soccer', 'Basketball', 'Tennis', 'Baseball', 'Golf'],
            challengeTime: 20,
            maxIsKnown: false,
            note: 'In terms of global popularity and fanbase size',
            thinkingTime: 45,
            title: 'Name the 5 most popular sports worldwide',
        },
    });


    // Image questions
    await setDocument('questions', Q_IMAGE_1, {
        type: 'image',
        topic: 'video_game',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            title: 'Name this game',
            image: 'https://upload.wikimedia.org/wikipedia/en/b/b6/Minecraft_2024_cover_art.png',
            answer: {
                description: 'Minecraft',
            },
        },
    });

    await setDocument('questions', Q_IMAGE_2, {
        type: 'image',
        topic: 'painting',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            title: 'Name this painting',
            image: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
            answer: {
                description: 'Mona Lisa',
            },
        },
    });

    // Labelling questions
    await setDocument('questions', Q_LABELLING_1, {
        type: 'labelling',
        topic: 'geography',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            image: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/BlankMap-World.svg',
            labels: ['France', 'Brazil',],
            title: 'Label this map',
        },
    });

    await setDocument('questions', Q_LABELLING_2, {
        type: 'labelling',
        topic: 'science',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            image: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Gray505.png',
            labels: ['Heart', 'Lungs', 'Liver', 'Stomach', 'Intestines'],
            title: 'Label this diagram',
        },
    });

    // Matching questions
    await setDocument('questions', Q_MATCHING_1, {
        type: 'matching',
        topic: 'literature',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            answer: {
                "0": ["William Shakespeare", "Romeo and Juliet"],
                "1": ["Jane Austen", "Pride and Prejudice"],
                "2": ["Mark Twain", "Adventures of Huckleberry Finn"],
                "3": ["Leo Tolstoy", "War and Peace"],
                "4": ["Homer", "The Odyssey"],
                "5": ["F. Scott Fitzgerald", "The Great Gatsby"],
                "6": ["Mary Shelley", "Frankenstein"],
                "7": ["J.K. Rowling", "Harry Potter"],
                "8": ["J.R.R. Tolkien", "The Lord of the Rings"],
                "9": ["George R.R. Martin", "A Song of Ice and Fire"],
            },
            note: "",
            numCols: 2,
            numRows: 10,
            title: "Match the author to their famous work",
        },
    });

    await setDocument('questions', Q_MATCHING_2, {
        type: 'matching',
        topic: 'science',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            answer: {
                "0": ["Mercury", "Smallest planet in the Solar System", "1st"],
                "1": ["Venus", "Hottest planet in the Solar System", "2nd"],
                "2": ["Earth", "Our home", "3rd"],
                "3": ["Mars", "The Red Planet", "4th"],
                "4": ["Jupiter", "Largest planet in the Solar System", "5th"],
                "5": ["Saturn", "Famous for its rings", "6th"],
                "6": ["Uranus", "Rotates on its side", "7th"],
                "7": ["Neptune", "Known for its strong winds", "8th"],
            },
            note: "",
            numCols: 3,
            numRows: 8,
            title: "Match each planet to its description and position in the Solar System",
        },
    });


    // MCQ questions
    await setDocument('questions', Q_MCQ_1, {
        type: 'mcq',
        topic: 'science',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            answerIdx: 1,
            choices: ['Ag', 'Au', 'Fe', 'Cu'],
            explanation: 'Au comes from the Latin word "aurum".',
            note: '',
            source: '',
            title: 'What is the chemical symbol for gold?',
        },
    });

    await setDocument('questions', Q_MCQ_2, {
        type: 'mcq',
        topic: 'geography',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            answerIdx: 2,
            choices: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
            explanation: 'Canberra is the capital of Australia, not Sydney.',
            note: '',
            source: '',
            title: 'What is the capital of Australia?',
        },
    });

    // Nagui questions
    await setDocument('questions', Q_NAGUI_1, {
        type: 'nagui',
        topic: 'video_game',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            answerIdx: 0,
            choices: ["By shooting him with an Ancient Arrow", "By doing a circular attack with the Master Sword", "By using the Thunder Helm to call down lightning", "By paragliding and dropping a bomb on him"],
            duoIdx: 1,
            explanation: '',
            note: '',
            source: 'The Legend of Zelda: Breath of the Wild',
            title: "How to one shot a Guardian?"
        },
    });

    await setDocument('questions', Q_NAGUI_2, {
        type: 'nagui',
        topic: 'movie',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            answerIdx: 2,
            choices: ["By using the Infinity Gauntlet", "By destroying the Mind Stone", "By snapping his fingers while wearing the Infinity Gauntlet", "By being worthy to wield Mjolnir"],
            duoIdx: 0,
            explanation: '',
            note: '',
            source: 'Avengers: Infinity War',
            title: "How does Thanos eliminate half of all life in the universe?"
        },
    });


    // Odd One Out question
    await setDocument('questions', Q_ODD_1, {
        type: 'odd_one_out',
        topic: 'music',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            answerIdx: 2,
            items: [
                { title: 'John Lennon', explanation: 'Founding member' },
                { title: 'Paul McCartney', explanation: 'Founding member' },
                { title: 'Mick Jagger', explanation: 'Lead singer of The Rolling Stones, not The Beatles!' },
                { title: 'George Harrison', explanation: 'Lead guitarist' },
                { title: 'Ringo Starr', explanation: 'Drummer' },
            ],
            note: 'From 1962 onwards (so Pete Best is not included)',
            title: 'Who is a member of The Beatles?',
        },
    });

    await setDocument('questions', Q_ODD_2, {
        type: 'odd_one_out',
        topic: 'video_game',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            answerIdx: 3,
            items: [
                { title: 'Mario', explanation: 'Iconic Nintendo character' },
                { title: 'Link', explanation: 'Protagonist of The Legend of Zelda series' },
                { title: 'Samus Aran', explanation: 'Heroine of the Metroid series' },
                { title: 'Sonic the Hedgehog', explanation: 'Mascot of Sega, not Nintendo!' },
                { title: 'Pikachu', explanation: 'Famous Pokémon character' },
            ],
        },
        note: '',
        title: 'Which character belongs to a Nintendo franchise?',
    });

    // Progressive Clues questions
    await setDocument('questions', Q_PROGRESSIVE_CLUES_1, {
        type: 'progressive_clues',
        topic: 'movie',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            answer: {
                image: 'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg',
                title: 'Inception',
            },
            clues: [
                'A mind-bending thriller.',
                'Released in 2010.',
                'Directed by Christopher Nolan.',
                'Features a team that enters people\'s dreams to steal secrets.',
                'Stars Leonardo DiCaprio as the main character, Dom Cobb.',
                'The iconic spinning top is a key symbol in the movie.',
                'The plot revolves around the concept of "inception", planting an idea in someone\'s mind through their dreams.',
            ],
            note: '',
            title: 'Guess the movie',
        },
    });

    await setDocument('questions', Q_PROGRESSIVE_CLUES_2, {
        type: 'progressive_clues',
        topic: 'video_game',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            answer: {
                image: 'https://upload.wikimedia.org/wikipedia/en/b/b6/Minecraft_2024_cover_art.png',
                description: 'Minecraft',
            },
            clues: [
                'A hugely popular sandbox game.',
                'Released in 2011.',
                'Created by Markus Persson and later acquired by Microsoft.',
                'Players can build and explore blocky, procedurally generated worlds.',
                'The game has multiple modes, including Survival and Creative.',
                'It features iconic mobs like Creepers and Endermen.',
                'The game\'s soundtrack was composed by C418.',
            ],
            note: '',
            title: 'Guess the game',
        },
    });

    // Quote questions
    await setDocument('questions', Q_QUOTE_1, {
        type: 'quote',
        topic: 'movie',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            author: 'Vito Corleone',
            quote: "I'm gonna make him an offer he can't refuse.",
            quoteParts: [
                { startIdx: 37, endIdx: 43 },
            ],
            source: 'The Godfather',
            toGuess: ['author', 'quote', 'source'],
        },
    });

    await setDocument('questions', Q_QUOTE_2, {
        type: 'quote',
        topic: 'tv',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            author: 'Walter White',
            quote: "I am the one who knocks!",
            quoteParts: [],
            source: 'Breaking Bad',
            toGuess: ['author', 'source'],
        },
    });

    // Reordering questions
    await setDocument('questions', Q_REORDERING_1, {
        type: 'reordering',
        topic: 'history',
        approved: true,
        createdAt: now,
        createdBy: USER_1_ID,
        lang: 'en',
        details: {
            items: [
                { title: 'Signing of the Declaration of Independence', date: '1776-07-04' },
                { title: 'French Revolution begins', date: '1789-07-14' },
                { title: 'Start of World War I', date: '1914-07-28' },
                { title: 'Moon landing', date: '1969-07-20' },
                { title: 'Fall of the Berlin Wall', date: '1989-11-09' },
            ],
            note: '',
            title: 'Put these historical events in chronological order',
        },
    });

    await setDocument('questions', Q_REORDERING_2, {
        type: 'reordering',
        topic: 'tech',
        approved: true,
        createdAt: now,
        createdBy: USER_2_ID,
        lang: 'en',
        details: {
            items: [
                { title: 'Release of the first iPhone', date: '2007-06-29' },
                { title: 'Launch of Netflix streaming service', date: '2007-01-16' },
                { title: 'YouTube founded', date: '2005-02-14' },
                { title: 'Facebook founded', date: '2004-02-04' },
                { title: 'Twitter founded', date: '2006-03-21' },
            ],
            note: '',
            title: 'Put these tech milestones in chronological order',
        },
    });
}

async function seedGame1() {
    console.log('  Seeding game 1 (rounds type)...');

    // Main game document
    await setDocument('games', GAME_1_ID, {
        title: 'Dev Quiz Night',
        type: 'rounds',
        createdAt: now,
        createdBy: USER_1_ID,
        maxPlayers: 4,
        status: 'build',
        dateStart: now,
        dateEnd: null,
        currentQuestion: '',
        currentQuestionType: '',
        currentRound: '',
        rounds: [ROUND_BASIC_ID, ROUND_BLINDTEST_ID, ROUND_EMOJI_ID, ROUND_ENUMERATION_ID, ROUND_IMAGE_ID, ROUND_LABELLING_ID, ROUND_MATCHING_ID, ROUND_MCQ_ID, ROUND_NAGUI_ID, ROUND_ODD_ONE_OUT_ID, ROUND_PROGRESSIVE_CLUES_ID, ROUND_QUOTE_ID, ROUND_REORDERING_ID],
        roundScorePolicy: 'completion_rate',
    });

    // Teams
    await setDocument(`games/${GAME_1_ID}/teams`, TEAM_1_ID, {
        name: 'Red Team',
        color: '#FF4444',
        teamAllowed: true,
    });
    await setDocument(`games/${GAME_1_ID}/teams`, TEAM_2_ID, {
        name: 'Blue Team',
        color: '#4444FF',
        teamAllowed: true,
    });

    // Organizer
    await setDocument(`games/${GAME_1_ID}/organizers`, USER_1_ID, {
        name: 'Alice',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    });

    // Players
    await setDocument(`games/${GAME_1_ID}/players`, USER_2_ID, {
        name: 'Bob',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
        teamId: TEAM_1_ID,
        status: 'idle',
    });

    // Rounds
    await setDocument(`games/${GAME_1_ID}/rounds`, ROUND_BASIC_ID, {
        createdAt: now,
        currentQuestionIdx: null,
        dateEnd: null,
        dateStart: null,
        invalidateTeam: false,
        maxPoints: null,
        maxTries: 2,
        order: null,
        questions: [Q_BASIC_1, Q_BASIC_2],
        rewardsPerQuestion: 1,
        thinkingTime: 15,
        title: 'Basic Round',
        type: 'basic',
    });

    await setDocument(`games/${GAME_1_ID}/rounds`, ROUND_BLINDTEST_ID, {
        createdAt: now,
        currentQuestionIdx: null,
        dateEnd: null,
        dateStart: null,
        invalidateTeam: false,
        maxPoints: null,
        maxTries: 2,
        order: null,
        questions: [Q_BLINDTEST_1, Q_BLINDTEST_2],
        rewardsPerQuestion: 1,
        thinkingTime: 15,
        title: 'Blindtest Round',
        type: 'blindtest',
    });

    await setDocument(`games/${GAME_1_ID}/rounds`, ROUND_EMOJI_ID, {
        createdAt: now,
        currentQuestionIdx: null,
        dateEnd: null,
        dateStart: null,
        invalidateTeam: false,
        maxPoints: null,
        maxTries: 2,
        order: null,
        questions: [Q_EMOJI_1, Q_EMOJI_2],
        rewardsPerQuestion: 1,
        thinkingTime: 15,
        title: 'Emoji Round',
        type: 'emoji',
    });

    await setDocument(`games/${GAME_1_ID}/rounds`, ROUND_IMAGE_ID, {
        createdAt: now,
        currentQuestionIdx: null,
        dateEnd: null,
        dateStart: null,
        invalidateTeam: false,
        maxPoints: null,
        maxTries: 2,
        order: null,
        questions: [Q_IMAGE_1, Q_IMAGE_2],
        rewardsPerQuestion: 1,
        thinkingTime: 15,
        title: 'Image Round',
        type: 'image',
    });

    await setDocument(`games/${GAME_1_ID}/rounds`, ROUND_LABELLING_ID, {
        createdAt: now,
        currentQuestionIdx: null,
        dateEnd: null,
        dateStart: null,
        invalidateTeam: false,
        maxPoints: null,
        maxTries: 1,
        order: null,
        questions: [Q_LABELLING_1, Q_LABELLING_2],
        rewardsPerElement: 1,
        thinkingTime: 30,
        title: 'Labelling Round',
        type: 'labelling',
    });

    await setDocument(`games/${GAME_1_ID}/rounds`, ROUND_MCQ_ID, {
        createdAt: now,
        currentQuestionIdx: null,
        dateEnd: null,
        dateStart: null,
        invalidateTeam: false,
        maxPoints: null,
        maxTries: 2,
        order: null,
        questions: [Q_MCQ_1, Q_MCQ_2],
        rewardsPerQuestion: 1,
        thinkingTime: 30,
        title: 'MCQ Round',
        type: 'mcq',
    });



    // Game questions (runtime state) for round 1
    await setDocument(
        `games/${GAME_1_ID}/rounds/${ROUND_MCQ_ID}/questions`,
        Q_MCQ_1,
        {
            type: 'mcq',
            dateStart: null,
            dateEnd: null,
            managedBy: USER_1_ID,
            winner: { teamId: '', playerId: '' },
            thinkingTime: 30,
            correct: null,
            choiceIdx: null,
            playerId: null,
            reward: null,
            teamId: null,
        }
    );

    await setDocument(
        `games/${GAME_1_ID}/rounds/${ROUND_MCQ_ID}/questions`,
        Q_MCQ_2,
        {
            type: 'mcq',
            dateStart: null,
            dateEnd: null,
            managedBy: USER_1_ID,
            winner: { teamId: '', playerId: '' },
            thinkingTime: 30,
            correct: null,
            choiceIdx: null,
            playerId: null,
            reward: null,
            teamId: null,
        }
    );

    // Game questions for round 2
    await setDocument(
        `games/${GAME_1_ID}/rounds/${ROUND_BASIC_ID}/questions`,
        Q_BASIC_1,
        {
            type: 'basic',
            dateStart: null,
            dateEnd: null,
            managedBy: USER_1_ID,
            winner: { teamId: '', playerId: '' },
            reward: 1,
            thinkingTime: 15,
        }
    );

    await setDocument(
        `games/${GAME_1_ID}/rounds/${ROUND_BASIC_ID}/questions`,
        Q_BASIC_2,
        {
            type: 'basic',
            dateStart: null,
            dateEnd: null,
            managedBy: USER_1_ID,
            winner: { teamId: '', playerId: '' },
            reward: 1,
            thinkingTime: 15,
        }
    );

    // Realtime: scores
    await setDocument(`games/${GAME_1_ID}/realtime`, 'scores', {
        gameSortedTeams: [TEAM_1_ID, TEAM_2_ID],
        scores: { [TEAM_1_ID]: 0, [TEAM_2_ID]: 0 },
        scoresProgress: {
            [TEAM_1_ID]: {},
            [TEAM_2_ID]: {},
        },
    });

    // Realtime: timer
    await setDocument(`games/${GAME_1_ID}/realtime`, 'timer', {
        status: 'reset',
        duration: 30000,
        timestamp: now,
        forward: false,
        authorized: true,
        managedBy: USER_1_ID,
    });

    // Realtime: chooser states
    await setDocument(`games/${GAME_1_ID}/realtime`, 'states', {
        chooserOrder: [TEAM_1_ID, TEAM_2_ID],
        chooserIdx: 0,
    });

    // Realtime: ready
    await setDocument(`games/${GAME_1_ID}/realtime`, 'ready', {
        numPlayers: 4,
        numReady: 0,
    });

    // Round scores for round 1
    await setDocument(`games/${GAME_1_ID}/rounds/${ROUND_MCQ_ID}/realtime`, 'scores', {
        scores: { [TEAM_1_ID]: 0, [TEAM_2_ID]: 0 },
        scoresProgress: {
            [TEAM_1_ID]: {},
            [TEAM_2_ID]: {},
        },
        roundCompletionRates: { [TEAM_1_ID]: 0, [TEAM_2_ID]: 0 },
        roundSortedTeams: [TEAM_1_ID, TEAM_2_ID],
        gameSortedTeams: [TEAM_1_ID, TEAM_2_ID],
        rankingDiffs: { [TEAM_1_ID]: 0, [TEAM_2_ID]: 0 },
        teamsScoresSequences: { [TEAM_1_ID]: [], [TEAM_2_ID]: [] },
    });
}

async function seedNextAuthData() {
    console.log('  Seeding NextAuth accounts/sessions...');

    // A mock NextAuth account entry
    await setDocument('accounts', 'account_alice_google', {
        userId: USER_1_ID,
        type: 'oauth',
        provider: 'google',
        providerAccountId: '123456789',
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        scope: 'openid email profile',
    });

    // A mock NextAuth session
    await setDocument('sessions', 'session_alice_1', {
        userId: USER_1_ID,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        sessionToken: 'mock-session-token-alice',
    });
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
    console.log(`Seeding Firebase Emulator (Firestore at ${FIRESTORE_HOST})...\n`);

    // Verify emulator is running
    try {
        const res = await fetch(`http://${FIRESTORE_HOST}/`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
    } catch {
        console.error(
            '❌ Cannot reach Firestore emulator at ' + FIRESTORE_HOST + '.\n' +
            '   Start emulators first: npm run emulators'
        );
        process.exit(1);
    }

    await seedUsers();
    await seedQuestions();
    await seedGame1();
    await seedNextAuthData();

    console.log('\n✅ Seed data loaded successfully!');
    console.log('   View in Emulator UI: http://localhost:4000/firestore');
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
