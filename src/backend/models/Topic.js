import { DEFAULT_LOCALE } from '@/frontend/helpers/locales';
import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';

export const Topic = {
  ANIMALS: 'animals',
  ANIME_MANGA: 'anime_manga',
  ECONOMICS: 'economics',
  EDUCATION: 'education',
  ENTERTAINMENT: 'entertainment',
  FOOD: 'food',
  GEOGRAPHY: 'geography',
  HISTORY: 'history',
  INTERNET: 'internet',
  LANGUAGE: 'language',
  LITERATURE: 'literature',
  MISC: 'misc',
  MOVIE: 'movie',
  MUSIC: 'music',
  NEWS: 'news',
  PAINTING: 'painting',
  PHILOSOPHY: 'philosophy',
  POLITICS: 'politics',
  SCIENCE: 'science',
  SPORTS: 'sports',
  TECHNOLOGY: 'tech',
  TRANSPORT: 'transport',
  TV: 'tv',
  VIDEO_GAME: 'video_game',
};

export function isValidTopic(topic) {
  return Object.values(Topic).includes(topic);
}

export const TopicToEmoji = {
  [Topic.ANIMALS]: '🐾',
  [Topic.ANIME_MANGA]: '🇯🇵',
  [Topic.ECONOMICS]: '💰',
  [Topic.EDUCATION]: '🎓',
  [Topic.ENTERTAINMENT]: '🎭',
  [Topic.FOOD]: '🍽️',
  [Topic.GEOGRAPHY]: '🌍',
  [Topic.HISTORY]: '🏺',
  [Topic.INTERNET]: '🌐',
  [Topic.LANGUAGE]: '🗣️',
  [Topic.LITERATURE]: '📚',
  [Topic.MISC]: '🔄',
  [Topic.MOVIE]: '🍿',
  [Topic.MUSIC]: '🎵',
  [Topic.NEWS]: '🗞️',
  [Topic.PAINTING]: '🎨',
  [Topic.PHILOSOPHY]: '🤔',
  [Topic.POLITICS]: '🗳️',
  [Topic.SCIENCE]: '🔬',
  [Topic.SPORTS]: '🏀',
  [Topic.TECHNOLOGY]: '💻',
  [Topic.TRANSPORT]: '🚗',
  [Topic.TV]: '📺',
  [Topic.VIDEO_GAME]: '🎮',
};

export const TopicToTitle = {
  en: {
    [Topic.ANIMALS]: 'Animals',
    [Topic.ANIME_MANGA]: 'Anime & Manga',
    [Topic.ECONOMICS]: 'Economics',
    [Topic.EDUCATION]: 'Education',
    [Topic.ENTERTAINMENT]: 'Entertainment',
    [Topic.FOOD]: 'Food',
    [Topic.GEOGRAPHY]: 'Geography',
    [Topic.HISTORY]: 'History',
    [Topic.INTERNET]: 'Internet',
    [Topic.LANGUAGE]: 'Language',
    [Topic.LITERATURE]: 'Literature',
    [Topic.MISC]: 'Misc',
    [Topic.MOVIE]: 'Movie',
    [Topic.MUSIC]: 'Music',
    [Topic.NEWS]: 'News',
    [Topic.PAINTING]: 'Painting',
    [Topic.PHILOSOPHY]: 'Philosophy',
    [Topic.POLITICS]: 'Politics',
    [Topic.SCIENCE]: 'Science',
    [Topic.SPORTS]: 'Sports',
    [Topic.TECHNOLOGY]: 'Technology',
    [Topic.TRANSPORT]: 'Transport',
    [Topic.TV]: 'TV',
    [Topic.VIDEO_GAME]: 'Video Game',
  },
  fr: {
    [Topic.ANIMALS]: 'Animaux',
    [Topic.ANIME_MANGA]: 'Anime & Manga',
    [Topic.ECONOMICS]: 'Économie',
    [Topic.EDUCATION]: 'Éducation',
    [Topic.ENTERTAINMENT]: 'Divertissement',
    [Topic.FOOD]: 'Cuisine',
    [Topic.GEOGRAPHY]: 'Géographie',
    [Topic.HISTORY]: 'Histoire',
    [Topic.INTERNET]: 'Internet',
    [Topic.LANGUAGE]: 'Langue',
    [Topic.LITERATURE]: 'Littérature',
    [Topic.MISC]: 'Divers',
    [Topic.MOVIE]: 'Film',
    [Topic.MUSIC]: 'Musique',
    [Topic.NEWS]: 'Actualités',
    [Topic.PAINTING]: 'Peinture',
    [Topic.PHILOSOPHY]: 'Philosophie',
    [Topic.POLITICS]: 'Politique',
    [Topic.SCIENCE]: 'Science',
    [Topic.SPORTS]: 'Sports',
    [Topic.TECHNOLOGY]: 'Technologie',
    [Topic.TRANSPORT]: 'Transport',
    [Topic.TV]: 'Télévision',
    [Topic.VIDEO_GAME]: 'Jeux Vidéo',
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
  return Object.keys(TopicToTitle[lang])
    .sort((a, b) => topicToTitle(a, lang).localeCompare(topicToTitle(b, lang)))
    .map((topic) => {
      return [topic, withEmoji ? prependTopicWithEmoji(topic, lang) : topicToTitle(topic, lang)];
    });
}
