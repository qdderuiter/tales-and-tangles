import type { Slot, WardrobeItem } from './types.ts';

export const OUTFIT_DEFAULT: Record<Slot, string> = { hat: 'deerstalker', face: 'none', neck: 'tie' };

export const NOIR_OUTFIT: Record<Slot, string> = { hat: 'fedora', face: 'none', neck: 'cape' };

export const flowerSvg = (x: number, y: number, c: string) => '<circle cx="' + (x - 5) + '" cy="' + y + '" r="5.5" fill="' + c + '"/><circle cx="' + (x + 5) + '" cy="' + y + '" r="5.5" fill="' + c + '"/>' +
  '<circle cx="' + x + '" cy="' + (y - 5) + '" r="5.5" fill="' + c + '"/><circle cx="' + x + '" cy="' + (y + 5) + '" r="5.5" fill="' + c + '"/><circle cx="' + x + '" cy="' + y + '" r="3.4" fill="#ffd54f"/>';

export const heartSvg = (x: number, y: number) => '<path transform="translate(' + x + ' ' + y + ')" d="M0 4 C-11 -7 -15 7 0 16 C15 7 11 -7 0 4 Z" fill="rgba(244,143,177,.78)" stroke="#d81b60" stroke-width="2.4" stroke-linejoin="round"/>';

/* a five-pointed star centred on (x, y) */
export const starSvg = (x: number, y: number, r: number, attrs: string) => '<path d="M' + Array.from({ length: 10 }, (_, i) => {
  const a = Math.PI * (i / 5 - 0.5), k = i % 2 ? r * 0.45 : r;
  return (x + Math.cos(a) * k).toFixed(1) + ' ' + (y + Math.sin(a) * k).toFixed(1);
}).join(' L') + ' Z" ' + attrs + '/>';

export const WARDROBE: WardrobeItem[] = [
  { id: 'deerstalker', slot: 'hat', name: 'Detective cap', cost: 0, svg:
    '<path d="M54 64 Q56 22 100 20 Q144 22 146 64 Q100 52 54 64 Z" fill="url(#hat)"/>' +
    '<path d="M70 40 Q100 30 130 40 M64 52 Q100 42 136 52" stroke="#8f6b3f" stroke-width="2.4" fill="none" opacity=".55"/>' +
    '<path d="M48 66 Q100 50 152 66 Q100 76 48 66 Z" fill="#8f6b3f"/><circle cx="100" cy="21" r="5.5" fill="#6d4a30"/>' },
  { id: 'party', slot: 'hat', name: 'Party hat', cost: 3, svg:
    '<path d="M72 62 L100 4 L128 62 Z" fill="#f48fb1"/><path d="M82 44 L118 44 M89 30 L111 30" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>' +
    '<ellipse cx="100" cy="62" rx="30" ry="6" fill="#f06292"/><circle cx="100" cy="5" r="8" fill="#ffd54f"/>' },
  { id: 'chef', slot: 'hat', name: 'Chef hat', cost: 4, svg:
    '<g fill="#fff" stroke="#cfd8dc" stroke-width="2.4"><circle cx="76" cy="30" r="16"/><circle cx="124" cy="30" r="16"/><circle cx="100" cy="20" r="20"/><rect x="72" y="34" width="56" height="28" rx="6"/></g>' +
    '<rect x="70" y="52" width="60" height="11" rx="4" fill="#eceff1" stroke="#cfd8dc" stroke-width="2.4"/>' },
  { id: 'flowers', slot: 'hat', name: 'Flower crown', cost: 5, svg:
    '<path d="M56 64 Q100 46 144 64" stroke="#6fbf88" stroke-width="6" fill="none" stroke-linecap="round"/>' +
    flowerSvg(68, 58, '#f48fb1') + flowerSvg(84, 52, '#fff176') + flowerSvg(100, 50, '#ce93d8') + flowerSvg(116, 52, '#fff176') + flowerSvg(132, 58, '#f48fb1') },
  { id: 'crown', slot: 'hat', name: 'Little crown', cost: 8, svg:
    '<path d="M62 64 L66 30 L83 47 L100 22 L117 47 L134 30 L138 64 Z" fill="#f7c948" stroke="#d99a0b" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="100" cy="27" r="4.5" fill="#e86a6a"/><circle cx="66" cy="32" r="3.5" fill="#6fb0dc"/><circle cx="134" cy="32" r="3.5" fill="#6fb0dc"/>' },
  { id: 'none', slot: 'face', name: 'No glasses', cost: 0, svg: '' },
  { id: 'sunglasses', slot: 'face', name: 'Sunglasses', cost: 3, svg:
    '<rect x="66" y="84" width="30" height="21" rx="9" fill="#2d2118"/><rect x="104" y="84" width="30" height="21" rx="9" fill="#2d2118"/>' +
    '<path d="M96 91 L104 91" stroke="#2d2118" stroke-width="3.4"/><path d="M71 89 L81 89 M109 89 L119 89" stroke="#fff" stroke-width="2.4" opacity=".5" stroke-linecap="round"/>' },
  { id: 'monocle', slot: 'face', name: 'Monocle', cost: 2, svg:
    '<circle cx="118" cy="94" r="14" fill="rgba(255,255,255,.22)" stroke="#d9a441" stroke-width="3.4"/><path d="M130 103 Q140 130 128 152" stroke="#d9a441" stroke-width="2.2" fill="none"/>' },
  { id: 'hearts', slot: 'face', name: 'Heart glasses', cost: 4, svg: heartSvg(82, 87) + heartSvg(118, 87) },
  { id: 'tie', slot: 'neck', name: 'Red tie', cost: 0, svg: '<path d="M100 164 L93 178 L100 198 L107 178 Z" fill="#c75b5b"/>' },
  { id: 'bowtie', slot: 'neck', name: 'Bow tie', cost: 2, svg:
    '<path d="M100 160 L82 150 L82 170 Z M100 160 L118 150 L118 170 Z" fill="#7e57c2" stroke="#5e35b1" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="160" r="5.5" fill="#5e35b1"/>' },
  { id: 'scarf', slot: 'neck', name: 'Cozy scarf', cost: 3, svg:
    '<path d="M70 147 Q100 164 130 147 L131 162 Q100 178 69 162 Z" fill="#e57373"/><path d="M70 153 Q100 170 130 153 M70 159 Q100 175 130 159" stroke="#fff" stroke-width="2.4" fill="none" opacity=".55"/>' +
    '<path d="M112 168 L127 206 L109 209 L103 173 Z" fill="#ef9a9a"/>' },
  { id: 'bandana', slot: 'neck', name: 'Bandana', cost: 3, svg:
    '<path d="M72 147 Q100 156 128 147 L100 190 Z" fill="#4fc3f7" stroke="#0288d1" stroke-width="2" stroke-linejoin="round"/>' +
    '<circle cx="92" cy="158" r="2.6" fill="#fff"/><circle cx="108" cy="158" r="2.6" fill="#fff"/><circle cx="100" cy="171" r="2.6" fill="#fff"/><circle cx="100" cy="153" r="2.2" fill="#fff"/>' },
  /* ----- the fancy shelf: worth saving up for ----- */
  { id: 'wizard', slot: 'hat', name: 'Wizard hat', cost: 25, svg:
    '<path d="M64 62 Q86 30 112 0 Q112 34 136 62 Z" fill="#5e35b1"/><path d="M112 0 Q122 6 118 16 Q114 8 108 8 Z" fill="#4527a0"/>' +
    '<ellipse cx="100" cy="63" rx="47" ry="8" fill="#4527a0"/><path d="M68 58 Q100 50 132 58" stroke="#ffd54f" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    starSvg(98, 36, 7, 'fill="#ffd54f"') + starSvg(113, 22, 4, 'fill="#fff59d"') + starSvg(84, 49, 4, 'fill="#fff59d"') },
  { id: 'tophat', slot: 'hat', name: 'Top hat', cost: 30, svg:
    '<ellipse cx="100" cy="62" rx="45" ry="7.5" fill="#2b2433"/><path d="M72 62 L70 14 Q100 6 130 14 L128 62 Z" fill="#3a3144"/>' +
    '<path d="M71 44 Q100 50 129 44 L128.5 56 Q100 62 71.5 56 Z" fill="#d9a441"/><path d="M80 20 L79 40" stroke="#fff" stroke-width="3" opacity=".18" stroke-linecap="round"/>' },
  { id: 'pirate', slot: 'hat', name: 'Pirate hat', cost: 40, svg:
    '<path d="M46 62 Q54 40 76 38 Q84 14 100 12 Q116 14 124 38 Q146 40 154 62 Q100 48 46 62 Z" fill="#2b2433"/>' +
    '<path d="M46 62 Q100 48 154 62" stroke="#d9a441" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<path d="M90 26 L110 42 M110 26 L90 42" stroke="#f5f0e6" stroke-width="3.6" stroke-linecap="round"/><circle cx="100" cy="32" r="7.5" fill="#f5f0e6"/>' +
    '<circle cx="97" cy="31" r="1.8" fill="#2b2433"/><circle cx="103" cy="31" r="1.8" fill="#2b2433"/>' },
  { id: 'helmet', slot: 'hat', name: 'Space helmet', cost: 60, svg:
    '<path d="M100 30 L100 12" stroke="#cfd8dc" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="10" r="6" fill="#ef5350"/>' +
    '<circle cx="100" cy="92" r="63" fill="rgba(190,230,255,.2)" stroke="#eceff1" stroke-width="5"/>' +
    '<path d="M56 62 Q66 42 88 36" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>' +
    '<path d="M60 146 Q100 160 140 146 L138 156 Q100 170 62 156 Z" fill="#cfd8dc" stroke="#90a4ae" stroke-width="2"/>' },
  { id: 'royal', slot: 'hat', name: 'Royal crown', cost: 100, svg:
    '<path d="M58 62 L54 24 L76 42 L100 8 L124 42 L146 24 L142 62 Q100 52 58 62 Z" fill="#f7c948" stroke="#d99a0b" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M64 60 Q100 51 136 60 L137 50 Q100 41 63 50 Z" fill="#c62828"/>' +
    '<circle cx="100" cy="9" r="6" fill="#e53935" stroke="#d99a0b" stroke-width="2"/><circle cx="54" cy="24" r="5" fill="#42a5f5" stroke="#d99a0b" stroke-width="2"/><circle cx="146" cy="24" r="5" fill="#42a5f5" stroke="#d99a0b" stroke-width="2"/>' +
    '<circle cx="100" cy="52" r="4.5" fill="#66bb6a"/><circle cx="80" cy="54" r="3" fill="#fff"/><circle cx="120" cy="54" r="3" fill="#fff"/>' + starSvg(100, 31, 6, 'fill="#fff8e1"') },
  { id: 'starglasses', slot: 'face', name: 'Star glasses', cost: 20, svg:
    '<path d="M94 93 L106 93" stroke="#ef6c00" stroke-width="3.4"/>' +
    starSvg(82, 94, 17, 'fill="rgba(255,213,79,.8)" stroke="#ef6c00" stroke-width="2.4" stroke-linejoin="round"') +
    starSvg(118, 94, 17, 'fill="rgba(255,213,79,.8)" stroke="#ef6c00" stroke-width="2.4" stroke-linejoin="round"') },
  { id: 'eyepatch', slot: 'face', name: 'Eye patch', cost: 25, svg:
    '<path d="M54 76 L146 100" stroke="#2d2118" stroke-width="3.4" stroke-linecap="round"/><path d="M105 86 Q118 78 131 88 Q133 104 118 108 Q104 104 105 86 Z" fill="#2d2118"/>' },
  { id: 'mask', slot: 'face', name: 'Masquerade mask', cost: 35, svg:
    '<path fill-rule="evenodd" d="M60 84 Q82 72 100 84 Q118 72 140 84 Q144 104 120 109 Q105 109 100 99 Q95 109 80 109 Q56 104 60 84 Z M73 94 a9 8 0 1 0 18 0 a9 8 0 1 0 -18 0 Z M109 94 a9 8 0 1 0 18 0 a9 8 0 1 0 -18 0 Z" fill="#7e57c2" stroke="#ffd54f" stroke-width="2.6" stroke-linejoin="round"/>' +
    '<path d="M140 84 Q150 70 146 58 M140 84 Q156 76 158 66" stroke="#ef5350" stroke-width="3" fill="none" stroke-linecap="round"/>' },
  { id: 'medal', slot: 'neck', name: 'Gold medal', cost: 30, svg:
    '<path d="M84 149 L100 180 L116 149" stroke="#1e88e5" stroke-width="8" fill="none" stroke-linejoin="round"/><path d="M84 149 L100 180 L116 149" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round" opacity=".7"/>' +
    '<circle cx="100" cy="186" r="12" fill="#f7c948" stroke="#d99a0b" stroke-width="3"/>' + starSvg(100, 186, 6.5, 'fill="#fff8e1"') },
  { id: 'herocape', slot: 'neck', name: 'Hero cape', cost: 50,
    back: '<path d="M66 150 Q100 142 134 150 Q182 158 196 224 Q148 205 100 212 Q52 205 4 224 Q18 158 66 150 Z" fill="#e53935"/>' +
      '<path d="M30 186 Q22 204 15 219 M170 186 Q178 204 185 219" stroke="#b71c1c" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>',
    svg:
    '<path d="M68 149 Q100 166 132 149" stroke="#b71c1c" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="100" cy="160" r="7" fill="#f7c948" stroke="#d99a0b" stroke-width="2.4"/>' + starSvg(100, 160, 4, 'fill="#fff8e1"') },
  { id: 'fedora', slot: 'hat', name: 'Noir fedora', cost: 0, unlock: 1, svg:
    '<ellipse cx="100" cy="64" rx="40" ry="7" fill="#241d30"/><path d="M68 64 Q70 32 100 30 Q130 32 132 64 Z" fill="#362e46"/>' +
    '<path d="M70 55 Q100 62 130 55 L131 62 Q100 69 69 62 Z" fill="#c0392b"/>' },
  { id: 'horns', slot: 'hat', name: 'Little horns', cost: 0, unlock: 3, svg:
    '<path d="M64 62 Q50 34 68 14 Q66 38 84 52 Z" fill="#d9363e"/><path d="M136 62 Q150 34 132 14 Q134 38 116 52 Z" fill="#d9363e"/>' },
  { id: 'cape', slot: 'neck', name: 'Noir cape', cost: 0, unlock: 5,     // the cape hangs behind him; only its collar crosses his chest
    back: '<path d="M66 150 Q100 142 134 150 Q182 158 196 224 Q148 205 100 212 Q52 205 4 224 Q18 158 66 150 Z" fill="#5b2a6b"/>' +
      '<path d="M30 186 Q22 204 15 219 M170 186 Q178 204 185 219" stroke="#3d1a49" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>',
    svg: '<path d="M66 149 Q100 166 134 149" stroke="#d9363e" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="100" cy="160" r="5" fill="#d9363e"/>' }
];

export const WARDROBE_BY_ID: Record<string, WardrobeItem | undefined> = Object.assign(Object.create(null), Object.fromEntries(WARDROBE.map(i => [i.id, i])));   // null-proto: ids like 'constructor' from a corrupted save don't resolve

export const SLOTS = Object.keys(OUTFIT_DEFAULT) as Slot[];
