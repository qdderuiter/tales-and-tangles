import type { Line } from '../data/types.ts';
import { registerLines } from '../dialogue/speakers.ts';

export const NOIR_LINES: Line[] = [
  { id: 'noir_01', e: 'happy', who: 'Barnaby Noir', t: 'Seven flawless finds. Impressive. Almost suspicious.' },
  { id: 'noir_02', e: 'thinking', who: 'Barnaby Noir', t: 'You solve my sunny cases like a cat in a sunbeam. Care to try this one... my way?',
    choices: [
      { label: 'Bring it on.', evil: true, reply: { e: 'happy', t: 'Delicious. Hold on to something, partner. Things are about to come apart.' } },
      { label: 'Not today.', evil: false, reply: { e: 'sad', t: 'Pity. Ask me again when you have a few more perfect clears to your name.' } }
    ] }
];

registerLines(NOIR_LINES);
