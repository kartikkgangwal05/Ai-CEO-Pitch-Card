import type { LeaderTheme, Specialisation } from '../types/pitch';

export type StreamIcon = 'people' | 'heart' | 'handshake' | 'chart' | 'target' | 'bulb' | 'coins' | 'trend' | 'shield' | 'megaphone' | 'like' | 'play' | 'crown' | 'rocket' | 'star';

/** "Magic academy" theme per PGDM stream (original design; colours by stream). */
export interface StreamTheme {
  id: Specialisation;
  short: string;
  /** Archetype shown when the AI title is still loading / as a fallback. */
  archetype: string;
  /** Hex colours: glow is the magic light; deep is the backdrop; frame is the gold trim. */
  glow: string;
  light: string;
  deep: string;
  ink: string;
  frame: [string, string, string];
  /** Richer (lighter) panel colours used in print so the stream hue survives on press. */
  printDeep?: string;
  printInk?: string;
  /** Icons floating in the portrait and on the stats row. */
  icons: [StreamIcon, StreamIcon, StreamIcon];
  /** Words used when the visitor leaves stats on "AI decides" and AI is offline. */
  words: [string, string, string];
  /** Hint for the AI title writer. */
  flavor: string;
}

const GOLD: [string, string, string] = ['#FFF1B8', '#E7B547', '#8A5A12'];

export const STREAMS: Record<Specialisation, StreamTheme> = {
  HR: {
    id: 'HR',
    short: 'HR Stream',
    archetype: 'The People Champion',
    glow: '#FFB020',
    light: '#FFE08A',
    deep: '#2A1604',
    printDeep: '#4A2A08',
    printInk: '#2E1904',
    ink: '#1A0E02',
    frame: GOLD,
    icons: ['people', 'heart', 'handshake'],
    words: ['Empathy', 'Leadership', 'Culture'],
    flavor: 'an HR wizard who casts spells of empathy, hiring and team culture',
  },
  'Business Analytics': {
    id: 'Business Analytics',
    short: 'BA Stream',
    archetype: 'The Analytics Wizard',
    glow: '#2F8CFF',
    light: '#9CCBFF',
    deep: '#030F2E',
    printDeep: '#0A2350',
    printInk: '#061738',
    ink: '#020818',
    frame: ['#E8F1FF', '#9DB7E0', '#5B79AD'],
    icons: ['chart', 'target', 'bulb'],
    words: ['Analyse', 'Strategise', 'Innovate'],
    flavor: 'a data wizard who conjures dashboards, SQL and predictions',
  },
  Finance: {
    id: 'Finance',
    short: 'Finance Stream',
    archetype: 'The Financial Strategist',
    glow: '#FF3B2F',
    light: '#FFB199',
    deep: '#2A0404',
    printDeep: '#4A0B0B',
    printInk: '#2C0606',
    ink: '#160202',
    frame: GOLD,
    icons: ['coins', 'trend', 'shield'],
    words: ['Plan', 'Invest', 'Grow'],
    flavor: 'a finance sorcerer who multiplies money, models and valuations',
  },
  Marketing: {
    id: 'Marketing',
    short: 'Marketing Stream',
    archetype: 'The Marketing Maverick',
    glow: '#22D36B',
    light: '#A6F5C4',
    deep: '#03200F',
    printDeep: '#0B3A1F',
    printInk: '#06261A',
    ink: '#021208',
    frame: GOLD,
    icons: ['megaphone', 'like', 'play'],
    words: ['Create', 'Connect', 'Grow'],
    flavor: 'a marketing magician who makes brands go viral and campaigns sparkle',
  },
  'Executive Leadership': {
    id: 'Executive Leadership',
    short: 'Leadership',
    archetype: 'The Visionary Leader',
    glow: '#A855F7',
    light: '#DDB8FF',
    deep: '#16052A',
    printDeep: '#2E0C4E',
    printInk: '#1A0530',
    ink: '#0C0218',
    frame: GOLD,
    icons: ['crown', 'rocket', 'star'],
    words: ['Vision', 'Mentor', 'Scale'],
    flavor: 'a visionary leader and founder who summons growth, partnerships and big bets',
  },
};

/** Leadership's second look: the golden lion (gold glow on a deep bronze panel). */
export const LEADER_GOLD: StreamTheme = {
  ...STREAMS['Executive Leadership'],
  short: 'Leadership',
  archetype: 'The Lion Leader',
  glow: '#F5B700',
  light: '#FFE9A3',
  deep: '#2A1A02',
  printDeep: '#4A3006',
  printInk: '#2E1C03',
  ink: '#170D01',
  frame: GOLD,
};

/** The two Leadership looks, as shown in the booth. */
export const LEADER_THEMES: { id: LeaderTheme; label: string; animal: string }[] = [
  { id: 'purple', label: 'Royal Purple', animal: 'Griffin' },
  { id: 'gold', label: 'Golden Lion', animal: 'Lion' },
];

/** Theme for a card: the stream's, or the golden lion look for a gold Leadership card. */
export function themeFor(stream: Specialisation, leaderTheme?: LeaderTheme): StreamTheme {
  if (stream === 'Executive Leadership' && leaderTheme === 'gold') return LEADER_GOLD;
  return STREAMS[stream] ?? STREAMS['Business Analytics'];
}

export const STREAM_ORDER: Specialisation[] = ['HR', 'Business Analytics', 'Finance', 'Marketing', 'Executive Leadership'];

/** Simple vector glyphs (24x24 grid) usable both as SVG paths and as canvas Path2D. */
export const ICON_PATHS: Record<StreamIcon, string> = {
  people:
    'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M10 20c0-3.3 2.7-6 6-6s6 2.7 6 6',
  heart: 'M12 20s-7-4.5-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.5-9 9-9 9z',
  handshake: 'M2 12l4-4 4 2 3-2 3 2 4-2 2 2M6 13l4 4a2 2 0 0 0 3 0l5-5M9 16l-1 1M12 18l-1 1',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
  coins: 'M12 7c4 0 7-1.3 7-3s-3-3-7-3-7 1.3-7 3 3 3 7 3zM5 4v6c0 1.7 3 3 7 3s7-1.3 7-3V4M5 10v6c0 1.7 3 3 7 3s7-1.3 7-3v-6',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  shield: 'M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z',
  megaphone: 'M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1zM17 8a5 5 0 0 1 0 8M20 5a9 9 0 0 1 0 14',
  like: 'M7 10v11H3V10h4zM7 10l4-8a3 3 0 0 1 3 3v4h5a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 21H7',
  play: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM10 8l6 4-6 4V8z',
  crown: 'M3 18h18M4 16L2 7l6 4 4-7 4 7 6-4-2 9H4z',
  rocket: 'M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1.5-5 6-9 13-9 0 7-4 11.5-9 13l-1-1zM15 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  star: 'M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.3 3.2L7 14.2 2 9.4l7-.9L12 2z',
};
