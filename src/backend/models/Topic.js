import { DEFAULT_LOCALE } from '@/frontend/helpers/locales';
import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';

export const Topic = {
  VIDEO_GAME: 'video_game',
  ANIME_MANGA: 'anime_manga',
  MOVIE: 'movie',
  TV: 'tv',
  MUSIC: 'music',
  LITERATURE: 'literature',
  INTERNET: 'internet',
  NEWS: 'news',
  POLITICS: 'politics',
  SCIENCE: 'science',
  ECONOMICS: 'economics',
  TECHNOLOGY: 'tech',
  HISTORY: 'history',
  GEOGRAPHY: 'geography',
  PHILOSOPHY: 'philosophy',
  LANGUAGE: 'language',
  SPORTS: 'sports',
  FOOD: 'food',
  EDUCATION: 'education',
  TRANSPORT: 'transport',
  ANIMALS: 'animals',
  ENTERTAINMENT: 'entertainment',
  MISC: 'misc',
};

export function isValidTopic(topic) {
  return Object.values(Topic).includes(topic);
}

export const TopicToEmoji = {
  [Topic.VIDEO_GAME]: '🎮',
  [Topic.ANIME_MANGA]: '🇯🇵',
  [Topic.MOVIE]: '🍿',
  [Topic.TV]: '📺',
  [Topic.MUSIC]: '🎵',
  [Topic.LITERATURE]: '📚',
  [Topic.INTERNET]: '🌐',
  [Topic.NEWS]: '🗞️',
  [Topic.POLITICS]: '🗳️',
  [Topic.SCIENCE]: '🔬',
  [Topic.ECONOMICS]: '💰',
  [Topic.TECHNOLOGY]: '💻',
  [Topic.HISTORY]: '🏺',
  [Topic.GEOGRAPHY]: '🌍',
  [Topic.PHILOSOPHY]: '🤔',
  [Topic.LANGUAGE]: '🗣️',
  [Topic.SPORTS]: '🏀',
  [Topic.FOOD]: '🍽️',
  [Topic.EDUCATION]: '🎓',
  [Topic.TRANSPORT]: '🚗',
  [Topic.ANIMALS]: '🐾',
  [Topic.ENTERTAINMENT]: '🎭',
  [Topic.MISC]: '🔄',
};

export const TopicToTitle = {
  en: {
    [Topic.VIDEO_GAME]: 'Video Game',
    [Topic.ANIME_MANGA]: 'Anime & Manga',
    [Topic.MOVIE]: 'Movie',
    [Topic.TV]: 'TV',
    [Topic.MUSIC]: 'Music',
    [Topic.LITERATURE]: 'Literature',
    [Topic.INTERNET]: 'Internet',
    [Topic.NEWS]: 'News',
    [Topic.POLITICS]: 'Politics',
    [Topic.SCIENCE]: 'Science',
    [Topic.ECONOMICS]: 'Economics',
    [Topic.TECHNOLOGY]: 'Technology',
    [Topic.HISTORY]: 'History',
    [Topic.GEOGRAPHY]: 'Geography',
    [Topic.PHILOSOPHY]: 'Philosophy',
    [Topic.LANGUAGE]: 'Language',
    [Topic.SPORTS]: 'Sports',
    [Topic.FOOD]: 'Food',
    [Topic.EDUCATION]: 'Education',
    [Topic.TRANSPORT]: 'Transport',
    [Topic.ANIMALS]: 'Animals',
    [Topic.ENTERTAINMENT]: 'Entertainment',
    [Topic.MISC]: 'Misc',
  },
  fr: {
    [Topic.VIDEO_GAME]: 'Jeux Vidéo',
    [Topic.ANIME_MANGA]: 'Anime & Manga',
    [Topic.MOVIE]: 'Film',
    [Topic.TV]: 'Télévision',
    [Topic.MUSIC]: 'Musique',
    [Topic.LITERATURE]: 'Littérature',
    [Topic.INTERNET]: 'Internet',
    [Topic.NEWS]: 'Actualités',
    [Topic.POLITICS]: 'Politique',
    [Topic.SCIENCE]: 'Science',
    [Topic.ECONOMICS]: 'Économie',
    [Topic.TECHNOLOGY]: 'Technologie',
    [Topic.HISTORY]: 'Histoire',
    [Topic.GEOGRAPHY]: 'Géographie',
    [Topic.PHILOSOPHY]: 'Philosophie',
    [Topic.LANGUAGE]: 'Langue',
    [Topic.SPORTS]: 'Sports',
    [Topic.FOOD]: 'Cuisine',
    [Topic.EDUCATION]: 'Éducation',
    [Topic.TRANSPORT]: 'Transport',
    [Topic.ANIMALS]: 'Animaux',
    [Topic.ENTERTAINMENT]: 'Divertissement',
    [Topic.MISC]: 'Divers',
  },
};

export function topicToTitle(topic, locale = DEFAULT_LOCALE) {
  return TopicToTitle[locale]?.[topic] || topic;
}

export function topicToEmoji(topic) {
  return TopicToEmoji[topic];
}

export function prependTopicWithEmoji(topic, locale = DEFAULT_LOCALE) {
  const emoji = topicToEmoji(topic);
  const title = topicToTitle(topic, locale);
  return prependWithEmojiAndSpace(emoji, title);
}

export function allTopicsToTitle(lang = DEFAULT_LOCALE, withEmoji = true) {
  return Object.keys(TopicToTitle[lang]).map((topic) => {
    return [topic, withEmoji ? prependTopicWithEmoji(topic, lang) : topicToTitle(topic, lang)];
  });
}
