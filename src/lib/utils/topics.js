/* TOPICS */
export const TOPICS = [
    'video_game',
    'anime_manga',
    'movie',
    'tv',
    'music',
    'literature',
    'internet',
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