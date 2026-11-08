export const OUTFIT_DEFAULT = { hat: 'deerstalker', face: 'none', neck: 'tie' };

export const NOIR_OUTFIT = { hat: 'fedora', face: 'none', neck: 'cape' };

export const flowerSvg = (x, y, c) => '<circle cx="' + (x - 5) + '" cy="' + y + '" r="5.5" fill="' + c + '"/><circle cx="' + (x + 5) + '" cy="' + y + '" r="5.5" fill="' + c + '"/>' +
  '<circle cx="' + x + '" cy="' + (y - 5) + '" r="5.5" fill="' + c + '"/><circle cx="' + x + '" cy="' + (y + 5) + '" r="5.5" fill="' + c + '"/><circle cx="' + x + '" cy="' + y + '" r="3.4" fill="#ffd54f"/>';

export const heartSvg = (x, y) => '<path transform="translate(' + x + ' ' + y + ')" d="M0 4 C-11 -7 -15 7 0 16 C15 7 11 -7 0 4 Z" fill="rgba(244,143,177,.78)" stroke="#d81b60" stroke-width="2.4" stroke-linejoin="round"/>';

export const WARDROBE = [
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
  { id: 'fedora', slot: 'hat', name: 'Noir fedora', cost: 0, unlock: 1, svg:
    '<ellipse cx="100" cy="64" rx="40" ry="7" fill="#241d30"/><path d="M68 64 Q70 32 100 30 Q130 32 132 64 Z" fill="#362e46"/>' +
    '<path d="M70 55 Q100 62 130 55 L131 62 Q100 69 69 62 Z" fill="#c0392b"/>' },
  { id: 'horns', slot: 'hat', name: 'Little horns', cost: 0, unlock: 3, svg:
    '<path d="M64 62 Q50 34 68 14 Q66 38 84 52 Z" fill="#d9363e"/><path d="M136 62 Q150 34 132 14 Q134 38 116 52 Z" fill="#d9363e"/>' },
  { id: 'cape', slot: 'neck', name: 'Noir cape', cost: 0, unlock: 5, svg:
    '<path d="M62 148 Q100 168 138 148 L150 218 Q100 198 50 218 Z" fill="#5b2a6b"/><path d="M62 148 Q100 168 138 148" stroke="#d9363e" stroke-width="5" fill="none" stroke-linecap="round"/>' }
];

export const WARDROBE_BY_ID = Object.assign(Object.create(null), Object.fromEntries(WARDROBE.map(i => [i.id, i])));   // null-proto: ids like 'constructor' from a corrupted save don't resolve

export const SLOTS = Object.keys(OUTFIT_DEFAULT);
