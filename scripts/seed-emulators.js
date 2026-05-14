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
const USER_1_ID = 'alice';
const USER_2_ID = 'bob';
const USER_3_ID = 'charlie';
const USER_4_ID = 'david';
const USER_5_ID = 'eve';
const USER_6_ID = 'frank';

// Uppercase only the first letter
function testUser(userId) {
  const name = userId.charAt(0).toUpperCase() + userId.slice(1);
  const image = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId.toLowerCase()}`;
  return {
    id: userId,
    name: name,
    image: image,
  };
}

const userAlice = testUser(USER_1_ID);
const userBob = testUser(USER_2_ID);
const userCharlie = testUser(USER_3_ID);
const userDavid = testUser(USER_4_ID);
const userEve = testUser(USER_5_ID);
const userFrank = testUser(USER_6_ID);
const users = [userAlice, userBob, userCharlie, userDavid, userEve, userFrank];

// Games
const GAME_1_ID = 'game_1';

// Teams
const TEAM_1_ID = 'team_1';
const TEAM_2_ID = 'team_2';
const teamIds = [TEAM_1_ID, TEAM_2_ID];

// Rounds
const ROUND_BASIC_ID = 'round_basic';
const ROUND_BLINDTEST_ID = 'round_blindtest';
const ROUND_EMOJI_ID = 'round_emoji';
const ROUND_ENUMERATION_ID = 'round_enumeration';
const ROUND_ESTIMATION_ID = 'round_estimation';
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
const Q_BASIC_1 = 'basic_1';
const Q_BASIC_2 = 'basic_2';
const Q_BLINDTEST_1 = 'blindtest_1';
const Q_BLINDTEST_2 = 'blindtest_2';
const Q_EMOJI_1 = 'emoji_1';
const Q_EMOJI_2 = 'emoji_2';
const Q_ENUMERATION_1 = 'enumeration_1';
const Q_ENUMERATION_2 = 'enumeration_2';
const Q_ESTIMATION_1 = 'estimation_1';
const Q_ESTIMATION_2 = 'estimation_2';
const Q_ESTIMATION_3 = 'estimation_3';
const Q_ESTIMATION_4 = 'estimation_4';
const Q_IMAGE_1 = 'image_1';
const Q_IMAGE_2 = 'image_2';
const Q_LABELLING_1 = 'labelling_1';
const Q_LABELLING_2 = 'labelling_2';
const Q_MATCHING_1 = 'matching_1';
const Q_MATCHING_2 = 'matching_2';
const Q_MCQ_1 = 'mcq_1';
const Q_MCQ_2 = 'mcq_2';
const Q_NAGUI_1 = 'nagui_1';
const Q_NAGUI_2 = 'nagui_2';
const Q_ODD_1 = 'odd_1';
const Q_ODD_2 = 'odd_2';
const Q_PROGRESSIVE_CLUES_1 = 'progressive_clues_1';
const Q_PROGRESSIVE_CLUES_2 = 'progressive_clues_2';
const Q_QUOTE_1 = 'quote_1';
const Q_QUOTE_2 = 'quote_2';
const Q_REORDERING_1 = 'reordering_1';
const Q_REORDERING_2 = 'reordering_2';

// Constants
const MAX_TRIES = 2;

async function seedUsers() {
  console.log('  Seeding users...');

  // Iterate over "users" collection and create a document for each user
  for (const user of users) {
    await setDocument('users', user.id, user);
  }
}

function testBaseBasicQuestion1() {
  return {
    id: Q_BASIC_1,
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
  };
}

function testBaseBasicQuestion2() {
  return {
    id: Q_BASIC_2,
    type: 'basic',
    topic: 'movie',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      title: 'Who directed this movie?',
      answer: 'Christopher Nolan',
      explanation: 'Inception (2010) was directed by Christopher Nolan.',
      note: '',
      source: 'Inception',
    },
  };
}

function testBaseBasicQuestions() {
  return [testBaseBasicQuestion1(), testBaseBasicQuestion2()];
}

function testGameBasicQuestion(baseBasicQuestion, reward, thinkingTime) {
  return {
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    reward: reward,
    thinkingTime: thinkingTime,
    type: 'basic',
    winner: {},
  };
}

function testBaseBlindtestQuestion1() {
  return {
    id: Q_BLINDTEST_1,
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
  };
}

function testBaseBlindtestQuestion2() {
  return {
    id: Q_BLINDTEST_2,
    type: 'blindtest',
    topic: 'music',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
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
  };
}

function testBaseBlindtestQuestions() {
  return [testBaseBlindtestQuestion1(), testBaseBlindtestQuestion2()];
}

function testGameBlindtestQuestion(baseBlindtestQuestion, maxTries, reward, thinkingTime) {
  return {
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    maxTries: maxTries,
    reward: reward,
    thinkingTime: thinkingTime,
    type: 'blindtest',
    winner: null,
  };
}

function testBaseEmojiQuestion1() {
  return {
    id: Q_EMOJI_1,
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
  };
}

function testBaseEmojiQuestion2() {
  return {
    id: Q_EMOJI_2,
    type: 'emoji',
    topic: 'tv',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      title: 'Guess the TV show',
      clue: '👨‍⚕️🧑‍⚕️🏥',
      answer: {
        title: "Grey's Anatomy",
        image: 'https://upload.wikimedia.org/wikipedia/en/7/7e/Grey%27s_Anatomy_21_poster.jpg',
      },
    },
  };
}

function testBaseEmojiQuestions() {
  return [testBaseEmojiQuestion1(), testBaseEmojiQuestion2()];
}

function testGameEmojiQuestion(baseEmojiQuestion, maxTries, reward, thinkingTime) {
  return {
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    maxTries: maxTries,
    reward: reward,
    thinkingTime: thinkingTime,
    type: 'emoji',
    winner: null,
  };
}

function testBaseEnumerationQuestion1() {
  return {
    id: Q_ENUMERATION_1,
    type: 'enumeration',
    topic: 'literature',
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
  };
}

function testBaseEnumerationQuestion2() {
  return {
    id: Q_ENUMERATION_2,
    type: 'enumeration',
    topic: 'sports',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answer: ['Soccer', 'Basketball', 'Tennis', 'Baseball', 'Golf'],
      challengeTime: 20,
      maxIsKnown: false,
      note: 'In terms of global popularity and fanbase size',
      thinkingTime: 45,
      title: 'Name the 5 most popular sports worldwide',
    },
  };
}

function testGameEnumerationQuestion(baseEnumerationQuestion, challengeTime, thinkingTime, reward, rewardsForBonus) {
  return {
    challengeTime: challengeTime,
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    reward: reward,
    rewardsForBonus: rewardsForBonus,
    status: 'reflection_active',
    thinkingTime: thinkingTime,
    type: 'enumeration',
    winner: null,
  };
}

function testBaseEnumerationQuestions() {
  return [testBaseEnumerationQuestion1(), testBaseEnumerationQuestion2()];
}


function testBaseEstimationQuestion1() {
  return {
    id: Q_ESTIMATION_1,
    type: 'estimation',
    topic: 'literature',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answer: '7',
      answerType: 'integer',
      explanation: '',
      note: '',
      source: '',
      title: 'How many episodes of the Harry Potter series are there?',
    },
  };
}

function testBaseEstimationQuestion2() {
  return {
    id: Q_ESTIMATION_2,
    type: 'estimation',
    topic: 'sports',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answer: '4.38',
      answerType: 'decimal',
      explanation: '',
      note: '',
      source: '',
      title: 'What is the average number of goals scored in a soccer match?',
    },
  };
}

function testBaseEstimationQuestion3() {
  return {
    id: Q_ESTIMATION_3,
    type: 'estimation',
    topic: 'science',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answer: '1957',
      answerType: 'year',
      explanation: '',
      note: '',
      source: '',
      title: 'In which year was the first artificial satellite launched?',
    },
  };
}

function testBaseEstimationQuestion4() {
  return {
    id: Q_ESTIMATION_4,
    type: 'estimation',
    topic: 'video_game',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answer: '1985-09-13',
      answerType: 'date',
      explanation: '',
      note: '',
      source: '',
      title: 'When was released the first Super Mario Bros. game in Japan?',
    },
  };
}


function testBaseEstimationQuestions() {
  return [testBaseEstimationQuestion1(), testBaseEstimationQuestion2(), testBaseEstimationQuestion3(), testBaseEstimationQuestion4()];
}

function testGameEstimationQuestion(baseEstimationQuestion, reward, thinkingTime) {
  return {
    bets: null,
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    reward: reward,
    thinkingTime: thinkingTime,
    type: 'estimation',
    winners: [],
  };
}

function testBaseImageQuestion1() {
  return {
    id: Q_IMAGE_1,
    type: 'image',
    topic: 'video_game',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      title: 'Name the item and the game',
      image: 'https://minecraft.wiki/images/Wooden_Pickaxe_JE3_BE3.png?fa797',
      answer: {
        description: 'Pickaxe',
        source: 'Minecraft',
      },
    },
  };
}

function testBaseImageQuestion2() {
  return {
    id: Q_IMAGE_2,
    type: 'image',
    topic: 'painting',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      title: 'Name this painting',
      image:
        'https://upload.wikimedia.org/wikipedia/commons/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
      answer: {
        description: 'Mona Lisa',
        source: '',
      },
    },
  };
}

function testBaseImageQuestions() {
  return [testBaseImageQuestion1(), testBaseImageQuestion2()];
}

function testGameImageQuestion(baseImageQuestion, maxTries, reward, thinkingTime) {
  return {
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    maxTries: maxTries,
    reward: reward,
    thinkingTime: thinkingTime,
    type: 'emoji',
    winner: null,
  };
}

function testBaseLabellingQuestion1() {
  return {
    id: Q_LABELLING_1,
    type: 'labelling',
    topic: 'geography',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      image: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/BlankMap-World.svg',
      labels: ['France', 'Brazil'],
      title: 'Label this map',
    },
  };
}

function testBaseLabellingQuestion2() {
  return {
    id: Q_LABELLING_2,
    type: 'labelling',
    topic: 'science',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      image: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Gray505.png',
      labels: ['Heart', 'Lungs', 'Liver', 'Stomach', 'Intestines'],
      title: 'Label this diagram',
    },
  };
}

function testBaseLabellingQuestions() {
  return [testBaseLabellingQuestion1(), testBaseLabellingQuestion2()];
}

function testGameLabellingQuestion(baseLabellingQuestion, maxTries, reward, thinkingTime) {
  return {
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    maxTries: maxTries,
    revealed: Array.from({ length: baseLabellingQuestion.details.labels.length }, () => ({})),
    reward: reward,
    thinkingTime: thinkingTime,
    type: 'labelling',
  };
}

function testBaseMatchingQuestion1() {
  // 2 columns
  return {
    id: Q_MATCHING_1,
    type: 'matching',
    topic: 'literature',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answer: {
        0: ['William Shakespeare', 'Romeo and Juliet'],
        1: ['Jane Austen', 'Pride and Prejudice'],
        2: ['Mark Twain', 'Adventures of Huckleberry Finn'],
        3: ['Leo Tolstoy', 'War and Peace'],
        4: ['Homer', 'The Odyssey'],
        5: ['F. Scott Fitzgerald', 'The Great Gatsby'],
        6: ['Mary Shelley', 'Frankenstein'],
        7: ['J.K. Rowling', 'Harry Potter'],
        8: ['J.R.R. Tolkien', 'The Lord of the Rings'],
        9: ['George R.R. Martin', 'A Song of Ice and Fire'],
      },
      note: '',
      numCols: 2,
      numRows: 10,
      title: 'Match the author to their famous work',
    },
  };
}

function testBaseMatchingQuestion2() {
  // 3 columns
  return {
    id: Q_MATCHING_2,
    type: 'matching',
    topic: 'science',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answer: {
        0: ['Mercury', 'Smallest planet in the Solar System', '1st'],
        1: ['Venus', 'Hottest planet in the Solar System', '2nd'],
        2: ['Earth', 'Our home', '3rd'],
        3: ['Mars', 'The Red Planet', '4th'],
        4: ['Jupiter', 'Largest planet in the Solar System', '5th'],
        5: ['Saturn', 'Famous for its rings', '6th'],
        6: ['Uranus', 'Rotates on its side', '7th'],
        7: ['Neptune', 'Known for its strong winds', '8th'],
      },
      note: '',
      numCols: 3,
      numRows: 8,
      title: 'Match each planet to its description and position in the Solar System',
    },
  };
}

function testBaseMatchingQuestions() {
  return [testBaseMatchingQuestion1(), testBaseMatchingQuestion2()];
}

function testGameMatchingQuestion(baseMatchingQuestion, maxTries, reward, thinkingTime) {
  return {
    canceled: [],
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    teamNumMistakes: {},
    thinkingTime: thinkingTime,
    type: 'matching',
  };
}

function testBaseMCQQuestion1() {
  return {
    id: Q_MCQ_1,
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
  };
}

function testBaseMCQQuestion2() {
  return {
    id: Q_MCQ_2,
    type: 'mcq',
    topic: 'geography',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answerIdx: 2,
      choices: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
      explanation: 'Canberra is the capital of Australia, not Sydney.',
      note: '',
      source: '',
      title: 'What is the capital of Australia?',
    },
  };
}

function testBaseMCQQuestions() {
  return [testBaseMCQQuestion1(), testBaseMCQQuestion2()];
}

function testGameMCQQuestion(baseMCQQuestion, thinkingTime) {
  return {
    choiceIdx: null,
    correct: null,
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    playerId: null,
    type: 'mcq',
    reward: null,
    teamId: null,
    thinkingTime: thinkingTime,
  };
}

function testBaseNaguiQuestion1() {
  return {
    id: Q_NAGUI_1,
    type: 'nagui',
    topic: 'video_game',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answerIdx: 0,
      choices: [
        'By shooting him with an Ancient Arrow',
        'By doing a circular attack with the Master Sword',
        'By using the Thunder Helm to call down lightning',
        'By paragliding and dropping a bomb on him',
      ],
      duoIdx: 1,
      explanation: '',
      note: '',
      source: 'The Legend of Zelda: Breath of the Wild',
      title: 'How to one shot a Guardian?',
    },
  };
}

function testBaseNaguiQuestion2() {
  return {
    id: Q_NAGUI_2,
    type: 'nagui',
    topic: 'movie',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answerIdx: 2,
      choices: [
        'By using the Infinity Gauntlet',
        'By destroying the Mind Stone',
        'By snapping his fingers while wearing the Infinity Gauntlet',
        'By being worthy to wield Mjolnir',
      ],
      duoIdx: 0,
      explanation: '',
      note: '',
      source: 'Avengers: Infinity War',
      title: 'How does Thanos eliminate half of all life in the universe?',
    },
  };
}

function testBaseNaguiQuestions() {
  return [testBaseNaguiQuestion1(), testBaseNaguiQuestion2()];
}

function testGameNaguiQuestion(baseNaguiQuestion, thinkingTime) {
  return {
    choiceIdx: null,
    correct: null,
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    option: null,
    playerId: null,
    reward: null,
    teamId: null,
    thinkingTime: thinkingTime,
    type: 'nagui',
  };
}

function testBaseOddOneOutQuestion1() {
  return {
    id: Q_ODD_1,
    type: 'odd_one_out',
    topic: 'music',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
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
  };
}

function testBaseOddOneOutQuestion2() {
  return {
    id: Q_ODD_2,
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
  };
}

function testBaseOddOneOutQuestions() {
  return [testBaseOddOneOutQuestion1(), testBaseOddOneOutQuestion2()];
}

function testGameOddOneOutQuestion(baseOddOneOutQuestion, thinkingTime) {
  return {
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    selectedItems: [],
    thinkingTime: thinkingTime,
    type: 'odd_one_out',
    winner: null,
  };
}

function testBaseProgressiveCluesQuestion1() {
  return {
    id: Q_PROGRESSIVE_CLUES_1,
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
        "Features a team that enters people's dreams to steal secrets.",
        'Stars Leonardo DiCaprio as the main character, Dom Cobb.',
        'The iconic spinning top is a key symbol in the movie.',
        'The plot revolves around the concept of "inception", planting an idea in someone\'s mind through their dreams.',
      ],
      note: '',
      title: 'Guess the movie',
    },
  };
}

function testBaseProgressiveCluesQuestion2() {
  return {
    id: Q_PROGRESSIVE_CLUES_2,
    type: 'progressive_clues',
    topic: 'video_game',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      answer: {
        image: 'https://upload.wikimedia.org/wikipedia/fr/0/03/Minecraft_Logo.svg',
        title: 'Minecraft',
      },
      clues: [
        'A hugely popular sandbox game.',
        'Released in 2011.',
        'Created by Markus Persson and later acquired by Microsoft.',
        'Players can build and explore blocky, procedurally generated worlds.',
        'The game has multiple modes, including Survival and Creative.',
        'It features iconic mobs like Creepers and Endermen.',
        "The game's soundtrack was composed by C418.",
      ],
      note: '',
      title: 'Guess the game',
    },
  };
}

function testBaseProgressiveCluesQuestions() {
  return [testBaseProgressiveCluesQuestion1(), testBaseProgressiveCluesQuestion2()];
}

function testGameProgressiveCluesQuestion(baseProgressiveCluesQuestion, delay, maxTries, reward, thinkingTime) {
  return {
    currentClueIdx: -1,
    dateEnd: null,
    dateStart: null,
    delay: delay,
    managedBy: USER_1_ID,
    maxTries: maxTries,
    reward: reward,
    thinkingTime: thinkingTime,
    type: 'progressive_clues',
    winner: null,
  };
}

function testBaseQuoteQuestion1() {
  return {
    id: Q_QUOTE_1,
    type: 'quote',
    topic: 'movie',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      author: 'Vito Corleone',
      quote: "I'm gonna make him an offer he can't refuse.",
      quoteParts: [{ startIdx: 37, endIdx: 43 }],
      source: 'The Godfather',
      toGuess: ['author', 'quote', 'source'],
    },
  };
}

function testBaseQuoteQuestion2() {
  return {
    id: Q_QUOTE_2,
    type: 'quote',
    topic: 'tv',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      author: 'Walter White',
      quote: 'I am the one who knocks!',
      quoteParts: [],
      source: 'Breaking Bad',
      toGuess: ['author', 'source'],
    },
  };
}

function testBaseQuoteQuestions() {
  return [testBaseQuoteQuestion1(), testBaseQuoteQuestion2()];
}

function testGameQuoteQuestion(baseQuestion, thinkingTime) {
  return {
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    revealed: {},
    thinkingTime: thinkingTime,
    type: 'quote',
  };
}

function testBaseReorderingQuestion1() {
  return {
    id: Q_REORDERING_1,
    type: 'reordering',
    topic: 'history',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      items: [
        { title: 'Signing of the Declaration of Independence', explanation: '1776-07-04' },
        { title: 'French Revolution begins', explanation: '1789-07-14' },
        { title: 'Start of World War I', explanation: '1914-07-28' },
        { title: 'Moon landing', explanation: '1969-07-20' },
        { title: 'Fall of the Berlin Wall', explanation: '1989-11-09' },
      ],
      note: '',
      title: 'Put these historical events in chronological order',
    },
  };
}

function testBaseReorderingQuestion2() {
  return {
    id: Q_REORDERING_2,
    type: 'reordering',
    topic: 'tech',
    approved: true,
    createdAt: now,
    createdBy: USER_1_ID,
    lang: 'en',
    details: {
      items: [
        { title: 'Renens VD, gare', explanation: '' },
        { title: 'Ecublens VD, Epenex', explanation: '' },
        { title: 'Chavannes-R., Crochy', explanation: '' },
        { title: 'Ecublens VD, Cerisaie', explanation: '' },
        { title: 'Ecublens VD, Bassenges', explanation: '' },
        { title: 'Ecublens VD, EPFL', explanation: '' },
        { title: 'Ecublens VD, UNIL-Sorge', explanation: '' },
        { title: 'Chavannes-R., UNIL-Mouline', explanation: '' },
        { title: 'Chavannes-R., UNIL-Chamberonne', explanation: '' },
        { title: 'Lausanne, Bourdonnette', explanation: '' },
        { title: 'Lausanne, Malley', explanation: '' },
        { title: 'Lausanne, Provence', explanation: '' },
        { title: 'Lausanne, Montelly', explanation: '' },
        { title: 'Lausanne, Vigie', explanation: '' },
        { title: 'Lausanne, Flon', explanation: '' },
      ],
      note: '',
      title: 'Order these M1 stations in Lausanne from west to east',
    },
  };
}

function testGameReorderingQuestion(baseReorderingQuestion, thinkingTime) {
  return {
    dateEnd: null,
    dateStart: null,
    managedBy: USER_1_ID,
    orderings: null,
    thinkingTime: thinkingTime,
    type: 'reordering',
    winner: null,
  };
}

function testBaseReorderingQuestions() {
  return [testBaseReorderingQuestion1(), testBaseReorderingQuestion2()];
}

async function seedBaseQuestions() {
  console.log('  Seeding questions...');

  // Basic questions
  await setDocument('questions', Q_BASIC_1, testBaseBasicQuestion1());
  await setDocument('questions', Q_BASIC_2, testBaseBasicQuestion2());

  // Blindtest questions
  await setDocument('questions', Q_BLINDTEST_1, testBaseBlindtestQuestion1());
  await setDocument('questions', Q_BLINDTEST_2, testBaseBlindtestQuestion2());

  // Emoji questions
  await setDocument('questions', Q_EMOJI_1, testBaseEmojiQuestion1());
  await setDocument('questions', Q_EMOJI_2, testBaseEmojiQuestion2());

  // Enumeration questions
  await setDocument('questions', Q_ENUMERATION_1, testBaseEnumerationQuestion1());
  await setDocument('questions', Q_ENUMERATION_2, testBaseEnumerationQuestion2());

  // Estimation questions
  await setDocument('questions', Q_ESTIMATION_1, testBaseEstimationQuestion1());
  await setDocument('questions', Q_ESTIMATION_2, testBaseEstimationQuestion2());
  await setDocument('questions', Q_ESTIMATION_3, testBaseEstimationQuestion3());
  await setDocument('questions', Q_ESTIMATION_4, testBaseEstimationQuestion4());

  // Image questions
  await setDocument('questions', Q_IMAGE_1, testBaseImageQuestion1());
  await setDocument('questions', Q_IMAGE_2, testBaseImageQuestion2());

  // Labelling questions
  await setDocument('questions', Q_LABELLING_1, testBaseLabellingQuestion1());
  await setDocument('questions', Q_LABELLING_2, testBaseLabellingQuestion2());

  // Matching questions
  await setDocument('questions', Q_MATCHING_1, testBaseMatchingQuestion1());
  await setDocument('questions', Q_MATCHING_2, testBaseMatchingQuestion2());

  // MCQ questions
  await setDocument('questions', Q_MCQ_1, testBaseMCQQuestion1());
  await setDocument('questions', Q_MCQ_2, testBaseMCQQuestion2());

  // Nagui questions
  await setDocument('questions', Q_NAGUI_1, testBaseNaguiQuestion1());
  await setDocument('questions', Q_NAGUI_2, testBaseNaguiQuestion2());

  // Odd One Out question
  await setDocument('questions', Q_ODD_1, testBaseOddOneOutQuestion1());
  await setDocument('questions', Q_ODD_2, testBaseOddOneOutQuestion2());

  // Progressive Clues questions
  await setDocument('questions', Q_PROGRESSIVE_CLUES_1, testBaseProgressiveCluesQuestion1());
  await setDocument('questions', Q_PROGRESSIVE_CLUES_2, testBaseProgressiveCluesQuestion2());

  // Quote questions
  await setDocument('questions', Q_QUOTE_1, testBaseQuoteQuestion1());
  await setDocument('questions', Q_QUOTE_2, testBaseQuoteQuestion2());

  // Reordering questions
  await setDocument('questions', Q_REORDERING_1, testBaseReorderingQuestion1());
  await setDocument('questions', Q_REORDERING_2, testBaseReorderingQuestion2());
}

async function seedGame(gameId) {
  // Main game document
  await setDocument('games', gameId, {
    currentQuestion: null,
    currentQuestionType: null,
    currentRound: null,
    dateEnd: null,
    dateStart: now,
    lang: 'fr',
    launchedAt: null,
    maxPlayers: 4,
    roundScorePolicy: 'completion_rate',
    rounds: [
      ROUND_BASIC_ID,
      ROUND_BLINDTEST_ID,
      ROUND_EMOJI_ID,
      ROUND_ENUMERATION_ID,
      ROUND_ESTIMATION_ID,
      ROUND_IMAGE_ID,
      ROUND_LABELLING_ID,
      ROUND_MATCHING_ID,
      ROUND_MCQ_ID,
      ROUND_NAGUI_ID,
      ROUND_ODD_ONE_OUT_ID,
      ROUND_PROGRESSIVE_CLUES_ID,
      ROUND_QUOTE_ID,
      ROUND_REORDERING_ID,
    ],
    status: 'game_start',
    title: 'Test Game',
    type: 'rounds',
  });

  await setOrganizers(gameId);
  await seedPlayers(gameId);
  await seedRealtime(gameId);
  await seedRounds(gameId);
  await seedTeams(gameId);
}

async function setOrganizers(gameId) {
  await setDocument(`games/${gameId}/organizers`, USER_1_ID, {
    name: 'Alice',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
  });
}

async function seedPlayers(gameId) {
  await setDocument(`games/${gameId}/players`, USER_2_ID, {
    name: 'Bob',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    teamId: TEAM_1_ID,
    status: 'idle',
  });

  await setDocument(`games/${gameId}/players`, USER_3_ID, {
    name: 'Charlie',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    teamId: TEAM_1_ID,
    status: 'idle',
  });

  await setDocument(`games/${gameId}/players`, USER_4_ID, {
    name: 'David',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    teamId: TEAM_2_ID,
    status: 'idle',
  });

  await setDocument(`games/${gameId}/players`, USER_5_ID, {
    name: 'Eve',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve',
    teamId: TEAM_2_ID,
    status: 'idle',
  });
}

async function seedRealtime(gameId) {
  // Ready
  await setDocument(`games/${gameId}/realtime`, 'ready', {
    numPlayers: 4,
    numReady: 0,
  });

  // Seed scores
  await setDocument(`games/${gameId}/realtime`, 'scores', {
    scores: { [TEAM_1_ID]: 0, [TEAM_2_ID]: 0 },
    scoresProgress: {
      [TEAM_1_ID]: {},
      [TEAM_2_ID]: {},
    },
  });

  await setDocument(`games/${gameId}/realtime/sounds/queue`, 'sounds', {});

  // Chooser states
  await setDocument(`games/${gameId}/realtime`, 'states', {
    chooserIdx: 0,
    chooserOrder: teamIds,
  });

  // Timer
  await setDocument(`games/${gameId}/realtime`, 'timer', {
    authorized: false,
    duration: 5,
    forward: false,
    managedBy: USER_1_ID,
    status: 'reset',
  });
}

async function seedRounds(gameId) {
  await seedBasicRound(gameId, ROUND_BASIC_ID);
  await seedBlindtestRound(gameId, ROUND_BLINDTEST_ID);
  await seedEmojiRound(gameId, ROUND_EMOJI_ID);
  await seedEnumerationRound(gameId, ROUND_ENUMERATION_ID);
  await seedEstimationRound(gameId, ROUND_ESTIMATION_ID);
  await seedImageRound(gameId, ROUND_IMAGE_ID);
  await seedLabellingRound(gameId, ROUND_LABELLING_ID);
  await seedMatchingRound(gameId, ROUND_MATCHING_ID);
  await seedMCQRound(gameId, ROUND_MCQ_ID);
  await seedNaguiRound(gameId, ROUND_NAGUI_ID);
  await seedOOORound(gameId, ROUND_ODD_ONE_OUT_ID);
  await seedProgressiveCluesRound(gameId, ROUND_PROGRESSIVE_CLUES_ID);
  await seedQuoteRound(gameId, ROUND_QUOTE_ID);
  await seedReorderingRound(gameId, ROUND_REORDERING_ID);
}

async function seedRoundScores(gameId, roundId, teamIds) {
  await setDocument(`games/${gameId}/rounds/${roundId}/realtime`, 'scores', {
    gameSortedTeams: [],
    rankingDiffs: null,
    roundCompletionRates: {},
    roundSortedTeams: [],
    scores: Object.fromEntries(teamIds.map((id) => [id, 0])),
    scoresProgress: {},
    teamsScoresSequences: {},
  });
}

async function seedBasicRound(gameId, roundId) {
  const questions = testBaseBasicQuestions();
  const rewardsPerQuestion = 1;
  const thinkingTime = 15;

  await setDocument(`games/${GAME_1_ID}/rounds`, ROUND_BASIC_ID, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    maxPoints: null, // Unknown at this point since it depends on the number of teams
    maxTries: MAX_TRIES,
    order: null,
    invalidateTeam: false,
    questions: [Q_BASIC_1, Q_BASIC_2],
    rewardsPerQuestion: rewardsPerQuestion,
    thinkingTime: thinkingTime,
    title: 'Basic Round',
    type: 'basic',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameBasicQuestion(question, rewardsPerQuestion, thinkingTime)
    );
  }
  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedBlindtestRound(gameId, roundId) {
  const questions = testBaseBlindtestQuestions();
  const rewardsPerQuestion = 1;
  const maxPoints = questions.length * rewardsPerQuestion;
  const maxTries = MAX_TRIES;
  const thinkingTime = 15;

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    invalidateTeam: false,
    maxPoints: maxPoints,
    maxTries: maxTries,
    order: null,
    questions: [Q_BLINDTEST_1, Q_BLINDTEST_2],
    rewardsPerQuestion: rewardsPerQuestion,
    thinkingTime: thinkingTime,
    title: 'Blindtest Round',
    type: 'blindtest',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameBlindtestQuestion(question, maxTries, rewardsPerQuestion, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedEmojiRound(gameId, roundId) {
  const questions = testBaseEmojiQuestions();
  const rewardsPerQuestion = 1;
  const maxPoints = questions.length * rewardsPerQuestion;
  const maxTries = MAX_TRIES;
  const thinkingTime = 15;

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    invalidateTeam: false,
    maxPoints: maxPoints,
    maxTries: MAX_TRIES,
    order: null,
    questions: [Q_EMOJI_1, Q_EMOJI_2],
    rewardsPerQuestion: rewardsPerQuestion,
    thinkingTime: thinkingTime,
    title: 'Emoji Round',
    type: 'emoji',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameEmojiQuestion(question, maxTries, rewardsPerQuestion, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedEnumerationRound(gameId, roundId) {
  const questions = testBaseEnumerationQuestions();
  const challengeTime = 60;
  const thinkingTime = 60;
  const rewardsForBonus = 1;
  const rewardsPerQuestion = 1;
  const maxPoints = questions.length * (rewardsPerQuestion + rewardsForBonus);
  const maxTries = MAX_TRIES;

  await setDocument(`games/${gameId}/rounds`, roundId, {
    challengeTime: challengeTime,
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    maxPoints: maxPoints,
    maxTries: maxTries,
    order: null,
    questions: [Q_ENUMERATION_1, Q_ENUMERATION_2],
    reflectionTime: 60,
    rewardsForBonus: rewardsForBonus,
    rewardsPerQuestion: rewardsPerQuestion,
    thinkingTime: thinkingTime,
    title: 'Enumeration Round',
    type: 'enumeration',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameEnumerationQuestion(question, challengeTime, thinkingTime, rewardsPerQuestion, rewardsForBonus)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedEstimationRound(gameId, roundId) {
  const questions = testBaseEstimationQuestions();
  const thinkingTime = 90;
  const rewardsForBonus = 1;
  const rewardsPerQuestion = 1;
  const maxPoints = questions.length * (rewardsPerQuestion + rewardsForBonus);

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    maxPoints: maxPoints,
    order: null,
    questions: [Q_ESTIMATION_1, Q_ESTIMATION_2, Q_ESTIMATION_3, Q_ESTIMATION_4],
    rewardsPerQuestion: rewardsPerQuestion,
    thinkingTime: thinkingTime,
    title: 'Estimation Round',
    type: 'estimation',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameEstimationQuestion(question, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}


async function seedImageRound(gameId, roundId) {
  const questions = testBaseImageQuestions();
  const rewardsPerQuestion = 1;
  const maxPoints = questions.length * rewardsPerQuestion;
  const maxTries = MAX_TRIES;
  const thinkingTime = 15;

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    invalidateTeam: false,
    maxPoints: maxPoints,
    maxTries: maxTries,
    order: null,
    questions: [Q_IMAGE_1, Q_IMAGE_2],
    rewardsPerQuestion: rewardsPerQuestion,
    thinkingTime: thinkingTime,
    title: 'Image Round',
    type: 'image',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameImageQuestion(question, maxTries, rewardsPerQuestion, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedLabellingRound(gameId, roundId) {
  const questions = testBaseLabellingQuestions();
  const rewardsPerElement = 1;
  const maxTries = 1;
  const thinkingTime = 30;

  const maxPoints = questions.reduce((acc, baseQuestion) => {
    const numElements = baseQuestion.details.labels.length;
    return acc + numElements * rewardsPerElement;
  }, 0);

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    invalidateTeam: false,
    maxPoints: maxPoints,
    maxTries: maxTries,
    order: null,
    questions: [Q_LABELLING_1, Q_LABELLING_2],
    rewardsPerElement: rewardsPerElement,
    thinkingTime: thinkingTime,
    title: 'Labelling Round',
    type: 'labelling',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameLabellingQuestion(question, maxTries, rewardsPerElement, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedMatchingRound(gameId, roundId) {
  const questions = testBaseMatchingQuestions();
  const thinkingTime = 60;

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    maxMistake: 3,
    maxPoints: 0,
    mistakePenalty: -5,
    order: null,
    questions: [Q_MATCHING_1, Q_MATCHING_2],
    thinkingTime: thinkingTime,
    title: 'Matching Round',
    type: 'matching',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameMatchingQuestion(question, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedMCQRound(gameId, roundId) {
  const questions = testBaseMCQQuestions();
  const rewardsPerQuestion = 1;
  const thinkingTime = 30;
  const maxPoints = Math.ceil(questions.length / teamIds.length) * rewardsPerQuestion;

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    maxPoints: maxPoints,
    order: null,
    questions: [Q_MCQ_1, Q_MCQ_2],
    rewardsPerQuestion: rewardsPerQuestion,
    thinkingTime: thinkingTime,
    title: 'MCQ Round',
    type: 'mcq',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameMCQQuestion(question, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedNaguiRound(gameId, roundId) {
  const questions = testBaseNaguiQuestions();
  const rewardsPerQuestion = {
    duo: 2,
    hide: 5,
    square: 3,
  };
  const thinkingTime = 30;
  // const maxPoints = Math.ceil(questions.length / teamIds.length) * rewardsPerQuestion;

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    maxPoints: null, // Unknown at this point since it depends on the number of teams
    order: null,
    questions: [Q_NAGUI_1, Q_NAGUI_2],
    rewardsPerQuestion: rewardsPerQuestion,
    thinkingTime: thinkingTime,
    title: 'Nagui Round',
    type: 'nagui',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameNaguiQuestion(question, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedOOORound(gameId, roundId) {
  const questions = testBaseOddOneOutQuestions();
  const thinkingTime = 30;

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    maxPoints: 0,
    mistakePenalty: -10,
    order: null,
    questions: [Q_ODD_1, Q_ODD_2],
    thinkingTime: thinkingTime,
    title: 'Odd One Out Round',
    type: 'odd_one_out',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameOddOneOutQuestion(question, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedProgressiveCluesRound(gameId, roundId) {
  const questions = testBaseProgressiveCluesQuestions();
  const delay = 2;
  const maxTries = 2;
  const rewardsPerQuestion = 1;
  const thinkingTime = 15;
  const maxPoints = questions.length * rewardsPerQuestion;

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    delay: delay,
    invalidateTeam: false,
    maxPoints: maxPoints,
    maxTries: maxTries,
    order: null,
    questions: [Q_PROGRESSIVE_CLUES_1, Q_PROGRESSIVE_CLUES_2],
    rewardsPerQuestion: rewardsPerQuestion,
    thinkingTime: thinkingTime,
    title: 'Progressive Clues Round',
    type: 'progressive_clues',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameProgressiveCluesQuestion(question, delay, maxTries, rewardsPerQuestion, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedQuoteRound(gameId, roundId) {
  const questions = testBaseQuoteQuestions();
  const thinkingTime = 15;
  const rewardsPerElement = 1;
  const maxPoints =
    questions.reduce((acc, q) => {
      const toGuess = q.details.toGuess;
      const quoteParts = q.details.quoteParts;
      return acc + toGuess.length + (toGuess.includes('quote') ? quoteParts.length - 1 : 0);
    }, 0) * rewardsPerElement;

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    invalidateTeam: false,
    maxPoints: maxPoints,
    maxTries: MAX_TRIES,
    order: null,
    questions: [Q_QUOTE_1, Q_QUOTE_2],
    rewardsPerElement: rewardsPerElement,
    thinkingTime: thinkingTime,
    title: 'Quote Round',
    type: 'quote',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameQuoteQuestion(question, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedReorderingRound(gameId, roundId) {
  const questions = testBaseReorderingQuestions();

  const thinkingTime = 60;
  const rewardsPerElement = 1;
  const maxPoints = questions.reduce((sum, q) => sum + q.details.items.length * rewardsPerElement, 0);

  await setDocument(`games/${gameId}/rounds`, roundId, {
    createdAt: now,
    currentQuestionIdx: 0,
    dateEnd: null,
    dateStart: null,
    maxPoints: maxPoints,
    order: null,
    questions: [Q_REORDERING_1, Q_REORDERING_2],
    rewardsPerQuestion: rewardsPerElement,
    thinkingTime: thinkingTime,
    title: 'Reordering Round',
    type: 'reordering',
  });

  for (const question of questions) {
    await setDocument(
      `games/${gameId}/rounds/${roundId}/questions`,
      question.id,
      testGameReorderingQuestion(question, thinkingTime)
    );
  }

  await seedRoundScores(gameId, roundId, teamIds);
}

async function seedTeams(gameId) {
  await setDocument(`games/${gameId}/teams`, TEAM_1_ID, {
    name: 'Camembert',
    color: '#FF4444',
    teamAllowed: true,
  });
  await setDocument(`games/${gameId}/teams`, TEAM_2_ID, {
    name: 'Mimolette',
    color: '#6666FF',
    teamAllowed: true,
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
      '❌ Cannot reach Firestore emulator at ' + FIRESTORE_HOST + '.\n' + '   Start emulators first: npm run emulators'
    );
    process.exit(1);
  }

  await seedUsers();
  await seedBaseQuestions();
  await seedGame(GAME_1_ID);
  await seedNextAuthData();

  console.log('\n✅ Seed data loaded successfully!');
  console.log('   View in Emulator UI: http://localhost:4000/firestore');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
