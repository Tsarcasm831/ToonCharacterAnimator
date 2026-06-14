import type { RPGNpcDef } from '../types';

// Briarhollow's residents. Dialogue entry node is always 'start'; '{name}' in
// text is replaced with the player's character name by the dialogue UI.

export const RPG_NPCS: RPGNpcDef[] = [
  // -- Marta, general goods --------------------------------------------------
  {
    id: 'marta',
    name: 'Marta',
    role: 'General Goods',
    appearance: {
      bodyType: 'female',
      outfit: 'peasant',
      hairStyle: 'crew',
      hairColor: '#5a3825',
      shirtColor: '#7c5cbf',
      pantsColor: '#3f3a33',
      skinColor: '#e8b48c',
    },
    position: [-14, -110],
    rotationY: Math.PI / 2,
    behavior: { mode: 'idle' },
    shop: {
      title: 'Marta’s Provisions',
      stock: [
        { name: 'Potion of Healing' },
        { name: 'Red Berries' },
        { name: 'Porkchop' },
        { name: 'Knife' },
        { name: 'Rope' },
        { name: 'Wooden Sword' },
        { name: 'Hood' },
        { name: 'Wooden Shoes' },
      ],
    },
    dialogue: {
      start: {
        id: 'start',
        text: 'Welcome to Briarhollow, traveler. Potions, provisions, rope that doesn’t snap — if you need it on the road, I stock it.',
        choices: [
          { label: 'Let me see your wares.', action: { type: 'openTrade' } },
          { label: 'Any advice for the vale?', next: 'advice' },
          { label: 'Farewell.', action: { type: 'close' } },
        ],
      },
      advice: {
        id: 'advice',
        text: 'Carry a skinning knife — a wolf’s worth twice as much if you take the pelt clean. And don’t let the sun set on you past the lake. They hunt in packs out there.',
        choices: [
          { label: 'Show me the knife, then.', action: { type: 'openTrade' } },
          { label: 'Thanks for the warning.', action: { type: 'close' } },
        ],
      },
    },
  },

  // -- Borin, blacksmith --------------------------------------------------------
  {
    id: 'borin',
    name: 'Borin',
    role: 'Blacksmith',
    appearance: {
      bodyType: 'male',
      bodyVariant: 'muscular',
      outfit: 'peasant',
      hairStyle: 'bald',
      skinColor: '#b07a52',
      shirtColor: '#6b3026',
      pantsColor: '#2e2a26',
    },
    position: [26, -128],
    rotationY: -Math.PI / 2,
    behavior: { mode: 'idle' },
    shop: {
      title: 'Borin’s Forge',
      stock: [
        { name: 'Sword' },
        { name: 'Axe' },
        { name: 'Helm' },
        { name: 'Shield' },
        { name: 'Leather Shirt' },
        { name: 'Leather Pants' },
        { name: 'Plate Mail' },
      ],
      buyMultipliers: { 'Bone Fragments': 1.5, 'Leather': 1.25 },
    },
    dialogue: {
      start: {
        id: 'start',
        text: 'Hmph. You’ve the look of someone who’s met the wolves already. Steel fixes that. Cheap steel fixes it slower.',
        choices: [
          { label: 'Show me your steel.', action: { type: 'openTrade' } },
          { label: 'What would you recommend?', next: 'recommend' },
          { label: 'Just passing through.', action: { type: 'close' } },
        ],
      },
      recommend: {
        id: 'recommend',
        text: 'Leather on your back before anything shiny in your hand. A dead hero swings no sword. After that — my blades hold an edge for years.',
        choices: [
          { label: 'Fair enough. Let’s trade.', action: { type: 'openTrade' } },
          { label: 'I’ll think on it.', action: { type: 'close' } },
        ],
      },
    },
  },

  // -- Hale, hunter ----------------------------------------------------------------
  {
    id: 'hale',
    name: 'Hale',
    role: 'Hunter',
    appearance: {
      bodyType: 'male',
      outfit: 'peasant',
      hairStyle: 'crew',
      hairColor: '#1f1a14',
      shirtColor: '#4a5d3a',
      pantsColor: '#37312a',
      skinColor: '#caa176',
      selectedItem: 'Bow',
    },
    position: [9, -90],
    rotationY: Math.PI,
    behavior: { mode: 'idle' },
    shop: {
      title: 'Hale’s Hunt Post',
      stock: [{ name: 'Knife' }, { name: 'Porkchop' }, { name: 'Rope' }],
      buyMultipliers: { 'Wolf Pelt': 2, 'Raw Meat': 1.5 },
    },
    dialogue: {
      start: {
        id: 'start',
        text: 'Wolves took three sheep this month, and old Fenn’s dog besides. I pay double for every pelt you bring me, {name}. Double. That’s town silver talking.',
        choices: [
          { label: 'I have goods to sell.', action: { type: 'openTrade' } },
          { label: 'Where do the packs run?', next: 'packs' },
          { label: 'I’ll bring you pelts.', action: { type: 'close' } },
        ],
      },
      packs: {
        id: 'packs',
        text: 'Three dens that I know of. East woods past the road, the briars west of the old lake, and a bold pack right outside our north wall. Skin them with a knife — torn pelts are worth nothing.',
        choices: [
          { label: 'Need a knife, actually.', action: { type: 'openTrade' } },
          { label: 'Consider them counted.', action: { type: 'close' } },
        ],
      },
    },
  },

  // -- Elder Rowan -------------------------------------------------------------------
  {
    id: 'rowan',
    name: 'Elder Rowan',
    role: 'Elder of Briarhollow',
    appearance: {
      bodyType: 'male',
      bodyVariant: 'slim',
      outfit: 'noble',
      hairStyle: 'bald',
      skinColor: '#d9a87e',
      robeColor: '#3b3a52',
      robeTrimColor: '#b59a55',
    },
    position: [4, -116],
    behavior: {
      mode: 'roam',
      speed: 0.9,
      waypoints: [
        [4, -116],
        [-8, -120],
        [-2, -130],
        [10, -122],
      ],
    },
    dialogue: {
      start: {
        id: 'start',
        text: 'Ah — a new face through the gate, and still in one piece. Welcome to Briarhollow, {name}. The vale is harsher than it was in my day.',
        choices: [
          { label: 'Tell me about this place.', next: 'lore' },
          { label: 'Anything I can do to help?', next: 'help' },
          { label: 'Good day, Elder.', action: { type: 'close' } },
        ],
      },
      lore: {
        id: 'lore',
        text: 'Briarhollow has stood behind these palisades for six generations. Thornwood Vale feeds us and bites us in equal measure — timber and game on one hand, wolf packs on the other. The old wardens kept the roads clear once. Their caches still rust out there, east past the deep woods.',
        choices: [
          { label: 'Wardens’ caches, you say?', next: 'cache' },
          { label: 'And I can help how?', next: 'help' },
          { label: 'Thank you, Elder.', action: { type: 'close' } },
        ],
      },
      cache: {
        id: 'cache',
        text: 'Far east, where the rim hills rise — a strongbox of the old road-wardens, if the stories hold. Whatever steel sleeps in it is yours, if the wolves let you reach it.',
        choices: [{ label: 'I’ll find it.', action: { type: 'close' } }],
      },
      help: {
        id: 'help',
        text: 'Thin the packs. Every pelt on Hale’s rack is a lamb still bleating come spring. Here — the town keeps a purse for new blades willing to try.',
        choices: [
          {
            label: 'Accept the town’s purse. (+20 gold)',
            action: { type: 'giveGold', amount: 20, onceFlag: 'rowan_purse' },
            hideIfFlag: 'rowan_purse',
            next: 'purse_given',
          },
          { label: 'I’ll see what I can do.', action: { type: 'close' } },
        ],
      },
      purse_given: {
        id: 'purse_given',
        text: 'Spend it at the forge, not the inn — though Sera will tell you otherwise. Good hunting, {name}.',
        choices: [{ label: 'Good day, Elder.', action: { type: 'close' } }],
      },
    },
  },

  // -- Sera, innkeeper -----------------------------------------------------------------
  {
    id: 'sera',
    name: 'Sera',
    role: 'Innkeeper, The Gilded Antler',
    appearance: {
      bodyType: 'female',
      outfit: 'noble',
      hairStyle: 'crew',
      hairColor: '#8c2f1b',
      skinColor: '#f0c39a',
      robeColor: '#5d2438',
      robeTrimColor: '#caa84e',
    },
    position: [-24, -132],
    rotationY: Math.PI / 3,
    behavior: { mode: 'idle' },
    shop: {
      title: 'The Gilded Antler',
      stock: [{ name: 'Porkchop' }, { name: 'Red Berries' }],
      buyMultipliers: { 'Raw Meat': 1.75 },
    },
    dialogue: {
      start: {
        id: 'start',
        text: 'Welcome to the Gilded Antler, dear. You look like the road’s been chewing on you. A warm bed and a hot meal put anyone right — ten gold for the night.',
        choices: [
          { label: 'I’ll take that bed. (10 gold — full heal)', action: { type: 'rest', cost: 10 } },
          { label: 'Buying meat? I hunt.', action: { type: 'openTrade' } },
          { label: 'Maybe later.', action: { type: 'close' } },
        ],
      },
      rested: {
        id: 'rested',
        text: 'There’s color back in your cheeks already. The vale can wait an hour longer — but it won’t wait forever.',
        choices: [{ label: 'Thank you, Sera.', action: { type: 'close' } }],
      },
      broke: {
        id: 'broke',
        text: 'Ten gold, dear. The Antler runs on coin, not promises — Hale pays well for pelts if your purse is light.',
        choices: [{ label: 'I’ll be back.', action: { type: 'close' } }],
      },
    },
  },

  // -- Tomm, gate guard -------------------------------------------------------------------
  {
    id: 'tomm',
    name: 'Tomm',
    role: 'Gate Watch',
    appearance: {
      bodyType: 'male',
      bodyVariant: 'heavy',
      outfit: 'warrior',
      hairStyle: 'crew',
      hairColor: '#3a2c1d',
      skinColor: '#c89671',
      selectedItem: 'Halberd',
    },
    position: [-6, -82],
    rotationY: 0,
    behavior: { mode: 'idle' },
    dialogue: {
      start: {
        id: 'start',
        text: 'Gate stands open sunrise to sunrise — the wolves haven’t learned doors yet. Mind yourself south of here; the west briars have been howling all week.',
        choices: [
          { label: 'Anything to report?', next: 'report' },
          { label: 'Stay sharp, Tomm.', action: { type: 'close' } },
        ],
      },
      report: {
        id: 'report',
        text: 'A pack’s denned up within sight of the north wall, bold as brass. Captain won’t spare me to deal with it. You look the sort who deals with things.',
        choices: [{ label: 'Maybe I am.', action: { type: 'close' } }],
      },
    },
  },

  // -- Ambient villagers ----------------------------------------------------------------------
  {
    id: 'villager_fenn',
    name: 'Old Fenn',
    role: 'Shepherd',
    appearance: {
      bodyType: 'male',
      bodyVariant: 'slim',
      outfit: 'peasant',
      hairStyle: 'bald',
      skinColor: '#d8a87f',
      shirtColor: '#8a7a5c',
      pantsColor: '#4a4039',
    },
    position: [-30, -100],
    behavior: {
      mode: 'roam',
      speed: 0.8,
      waypoints: [
        [-30, -100],
        [-38, -112],
        [-26, -120],
        [-18, -104],
      ],
    },
    dialogue: {
      start: {
        id: 'start',
        text: 'They got my dog, you know. Fourteen years that dog walked these walls with me. Put a few of those grey devils down, would you?',
        choices: [{ label: 'I will, Fenn.', action: { type: 'close' } }],
      },
    },
  },
  {
    id: 'villager_petra',
    name: 'Petra',
    role: 'Weaver',
    appearance: {
      bodyType: 'female',
      outfit: 'peasant',
      hairStyle: 'crew',
      hairColor: '#191512',
      skinColor: '#b97f57',
      shirtColor: '#3d6e8f',
      pantsColor: '#54483c',
    },
    position: [12, -140],
    behavior: {
      mode: 'roam',
      speed: 1.1,
      waypoints: [
        [12, -140],
        [-4, -144],
        [-16, -136],
        [2, -126],
      ],
    },
    dialogue: {
      start: {
        id: 'start',
        text: 'If you’re selling wolf pelts, sell the meat to Sera too — her stew’s the only reason half this town gets up in the morning.',
        choices: [{ label: 'Good tip.', action: { type: 'close' } }],
      },
    },
  },
  {
    id: 'kid_jory',
    name: 'Jory',
    role: 'Troublemaker',
    appearance: {
      bodyType: 'male',
      bodyVariant: 'slim',
      outfit: 'peasant',
      hairStyle: 'crew',
      hairColor: '#7a4a21',
      skinColor: '#eab489',
      shirtColor: '#a33b2e',
      pantsColor: '#46618a',
    },
    position: [-6, -106],
    scale: 0.78,
    behavior: {
      mode: 'roam',
      speed: 1.6,
      waypoints: [
        [-6, -106],
        [8, -112],
        [2, -124],
        [-12, -116],
      ],
    },
    dialogue: {
      start: {
        id: 'start',
        text: 'Did you REALLY fight a wolf? With a sword? Tomm says the new one by the north wall is big as a horse. Bigger, even!',
        choices: [{ label: 'Bigger than two horses.', action: { type: 'close' } }],
      },
    },
  },
];

export function getNpcDef(id: string): RPGNpcDef | undefined {
  return RPG_NPCS.find((n) => n.id === id);
}
