/* TOPICS */
export const TOPICS = [
    'video_game',
    'anime_manga',
    'movie',
    'tv',
    'music',
    'literature',
    'internet',
    'news',
    'politics',
    'science',
    'economics',
    'tech',
    'history',
    'geography',
    'philosophy',
    'language',
    'sports',
    'food',
    'education',
    'transport',
    'animals',
    'entertainment',
    'misc'
]

export const TOPIC_TO_EMOJI = {
    'video_game': '🎮',
    'anime_manga': '🇯🇵',
    'movie': '🍿',
    'tv': '📺',
    'music': '🎵',
    'literature': '📚',
    'internet': '🌐',
    'news': '🗞️',
    'politics': '🗳️',
    'science': '🔬',
    'economics': '💰',
    'tech': '💻',
    'history': '🏺',
    'geography': '🌍',
    'sports': '🏀',
    'food': '🍽️',
    'language': '🗣️',
    'education': '🎓',
    'transport': '🚗',
    'philosophy': '🤔',
    'animals': '🐾',
    'entertainment': '🎭',
    'misc': '🔄'
}

export const TOPIC_TO_TITLE = {
    'en': {
        'video_game': "Video Games",
        'anime_manga': "Animes/Mangas",
        'movie': "Movies",
        'tv': "TV",
        'music': "Music",
        'literature': "Literature",
        'internet': "Internet",
        'news': "News",
        'politics': "Politics",
        'science': "Science",
        'economics': "Economics",
        'tech': "Technology",
        'history': "History",
        'geography': "Geography",
        'sports': "Sports",
        'food': "Food",
        'language': "Language",
        'education': "Education",
        'transport': "Transport",
        'philosophy': "Philosophy",
        'animals': "Animals",
        'entertainment': "Entertainment",
        'misc': "Miscellaneous"
    },
    'fr-FR': {
        'video_game': "Jeux-Vidéo",
        'anime_manga': "Animes/Mangas",
        'movie': "Films",
        'tv': "Séries TV",
        'music': "Musique",
        'literature': "Littérature",
        'internet': "Internet",
        'news': "Actualités",
        'politics': "Politique",
        'science': "Science",
        'economics': "Économie",
        'tech': "Technologies",
        'history': "Histoire",
        'geography': "Géographie",
        'sports': "Sport",
        'food': "Cuisine",
        'language': "Langues",
        'education': "Éducation",
        'transport': "Transports",
        'philosophy': "Philosophie",
        'animals': "Animaux",
        'entertainment': "Divertissement",
        'misc': "Divers"
    }
}

/* Validation */
import * as Yup from 'yup'
export const topicSchema = () => Yup.string()
    .oneOf(TOPICS, "Invalid question topic.")
    .required("Required.")

import { DEFAULT_LOCALE } from '@/lib/utils/locales';

/* Utility functions */
export function topicToTitle(topic, lang = DEFAULT_LOCALE) {
    return TOPIC_TO_TITLE[lang][topic]
}

export function topicToEmoji(topic) {
    return TOPIC_TO_EMOJI[topic]
}

export function prependTopicWithEmoji(topic, lang = DEFAULT_LOCALE) {
    return topicToEmoji(topic) + " " + topicToTitle(topic, lang)
}

export function allTopicsToTitle(lang = DEFAULT_LOCALE, withEmoji = true) {
    return Object.keys(TOPIC_TO_TITLE[lang]).map(topic => {
        return [topic, withEmoji ? prependTopicWithEmoji(topic, lang) : topicToTitle(topic, lang)]
    })
}