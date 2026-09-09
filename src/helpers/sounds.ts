/**
 * Soundboard sound-effect catalogue. Each name maps to a file at
 * `public/sounds/<name>.mp3`, so the list is just the names — the URL is derived
 * (`soundUrl`), and the wire value passed to the Go `addSound` endpoint is the
 * bare name.
 */
export const SOUND_NAMES = [
  'ah_oui_nan_nan',
  'akeryo_en_susu',
  'anime_wow',
  'bien',
  'black_ops_knife_stab',
  'cartoon_mystery_musical_tone_002',
  'cash_register',
  'cest_carre',
  'cest_lheure_du_duo',
  'continue',
  'elu',
  'euh_non_jcrois_pas',
  'fart_perfecter',
  'ffxvi_victory_fanfare',
  'hmmm_nan',
  'hysterical5',
  'ing',
  'itai',
  'jpp_de_lair',
  'level_passed',
  'mario_64_coin',
  'mec_vener_mais_pas_trop',
  'message_incoming',
  'miguel_ohara',
  'minecraft_button_plate',
  'mmmhhhh',
  'oof',
  'oui',
  'pop',
  'qiling',
  'quest_ce_que_laudace',
  'robinet_desert',
  'roblox_oof',
  'sfx_menu_validate',
  'skyrim_skill_increase',
  'super_mario_odyssey_moon',
  'super_mario_world_coin',
  'terraria_male_damage',
  'tiphaine',
  'ui_confirmation_alert_b2',
  'vitor',
  'wilhelm_scream',
  'zelda_secret_door',
  'zelda_wind_waker_game_over',
  'zelda_wind_waker_kaboom',
  'zelda_wind_waker_sploosh',
] as const;

export type SoundName = (typeof SOUND_NAMES)[number];

const soundNameSet: ReadonlySet<string> = new Set(SOUND_NAMES);

/** True when `name` is a known soundboard sound. */
export const isSoundName = (name: string): name is SoundName => soundNameSet.has(name);

/** Public URL of a sound file. */
export const soundUrl = (name: SoundName): string => `/sounds/${name}.mp3`;
