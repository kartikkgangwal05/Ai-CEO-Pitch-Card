import type { CharacterId, ResolvedCharacterId, Specialisation, VisitorType } from '../types/pitch';

export interface CartoonCharacterOption {
  id: ResolvedCharacterId;
  label: string;
  archetype: string;
  inspiredBy: string;
  roleTitle: string;
  defaultSpec: Specialisation;
  accentHex: string;
  secondaryHex: string;
  stickerBadge: string;
}

export const CARTOON_CHARACTERS: readonly CartoonCharacterOption[] = [
  {
    id: 'gadget-cat',
    label: 'Robo-Cat Ace',
    archetype: 'Future Gadget Genius',
    inspiredBy: 'Doraemon-inspired',
    roleTitle: 'AI & Smart Systems Builder',
    defaultSpec: 'Business Analytics',
    accentHex: '#00D4FF',
    secondaryHex: '#FFFFFF',
    stickerBadge: '4D-TECH',
  },
  {
    id: 'mischief-maverick',
    label: 'Cheeky Maverick',
    archetype: 'Bold Brand Dynamo',
    inspiredBy: 'Shinchan-inspired',
    roleTitle: 'Viral GTM & Creative Spark',
    defaultSpec: 'Marketing',
    accentHex: '#38BDF8',
    secondaryHex: '#F43F5E',
    stickerBadge: 'SPARK-X',
  },
  {
    id: 'harmony-ace',
    label: 'Harmony Ace',
    archetype: 'Empathetic Connector',
    inspiredBy: 'Shizuka-inspired',
    roleTitle: 'People & Culture Champion',
    defaultSpec: 'HR',
    accentHex: '#60A5FA',
    secondaryHex: '#A78BFA',
    stickerBadge: 'TRUST+10',
  },
  {
    id: 'strategy-prodigy',
    label: 'Capital Prodigy',
    archetype: 'Sharp Precision Thinker',
    inspiredBy: 'Nobita/Scholar-inspired',
    roleTitle: 'Valuation & Risk Strategist',
    defaultSpec: 'Finance',
    accentHex: '#22D3EE',
    secondaryHex: '#34D399',
    stickerBadge: 'ALPHA-IQ',
  },
  {
    id: 'visionary-captain',
    label: 'Visionary Captain',
    archetype: 'Executive Trailblazer',
    inspiredBy: 'Founder / Director Hero',
    roleTitle: 'Owner, Director & CXO Crest',
    defaultSpec: 'Executive Leadership',
    accentHex: '#0EA5E9',
    secondaryHex: '#FACC15',
    stickerBadge: 'VIP-EXEC',
  },
  {
    id: 'data-wizard',
    label: 'Data Wizard',
    archetype: 'Neural Insight Caster',
    inspiredBy: 'Sci-Fi Anime Scholar',
    roleTitle: 'Analytics & Telemetry Ace',
    defaultSpec: 'Business Analytics',
    accentHex: '#3B82F6',
    secondaryHex: '#00D4FF',
    stickerBadge: 'DATA-CORE',
  },
];

export const CHARACTER_PICKER_OPTIONS: ReadonlyArray<{
  id: CharacterId;
  label: string;
  subtitle: string;
}> = [
  { id: 'auto', label: 'Auto-Match', subtitle: 'AI picks from details' },
  ...CARTOON_CHARACTERS.map((c) => ({
    id: c.id as CharacterId,
    label: c.label,
    subtitle: c.inspiredBy,
  })),
];

export function getCharacterById(id: ResolvedCharacterId | CharacterId): CartoonCharacterOption {
  if (id === 'auto') return CARTOON_CHARACTERS[0];
  return CARTOON_CHARACTERS.find((c) => c.id === id) ?? CARTOON_CHARACTERS[0];
}

export function getMascotForSpecialisation(spec: Specialisation): CartoonCharacterOption {
  const map: Record<Specialisation, ResolvedCharacterId> = {
    'Business Analytics': 'data-wizard',
    Marketing: 'mischief-maverick',
    Finance: 'strategy-prodigy',
    HR: 'harmony-ace',
    'Executive Leadership': 'visionary-captain',
  };
  return getCharacterById(map[spec]);
}

export function getDefaultCharacterForSpec(
  spec: Specialisation,
  visitorType: VisitorType = 'PGDM Student'
): ResolvedCharacterId {
  if (visitorType !== 'PGDM Student' && spec === 'Executive Leadership') {
    return 'visionary-captain';
  }
  return getMascotForSpecialisation(spec).id;
}
