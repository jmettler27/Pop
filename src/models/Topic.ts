import { DEFAULT_LOCALE, type Locale } from '@/frontend/helpers/locales';
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
} as const;

export type Topic = (typeof Topic)[keyof typeof Topic];

export function isValidTopic(topic: string): topic is Topic {
  return (Object.values(Topic) as string[]).includes(topic);
}

export const TopicToEmoji: Record<Topic, string> = {
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

export const TopicToTitle: Record<Locale, Record<Topic, string>> = {
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

export function topicToTitle(topic: Topic, locale: Locale = DEFAULT_LOCALE): string {
  return TopicToTitle[locale]?.[topic] || topic;
}

export function topicToEmoji(topic: Topic): string {
  return TopicToEmoji[topic];
}

export function prependTopicWithEmoji(topic: Topic, locale: Locale = DEFAULT_LOCALE): string {
  const emoji = topicToEmoji(topic);
  const title = topicToTitle(topic, locale);
  return prependWithEmojiAndSpace(emoji, title);
}

export function allTopicsToTitle(lang: Locale = DEFAULT_LOCALE, withEmoji = true): [Topic, string][] {
  return (Object.keys(TopicToTitle[lang]) as Topic[])
    .sort((a, b) => topicToTitle(a, lang).localeCompare(topicToTitle(b, lang)))
    .map((topic) => [topic, withEmoji ? prependTopicWithEmoji(topic, lang) : topicToTitle(topic, lang)]);
}
