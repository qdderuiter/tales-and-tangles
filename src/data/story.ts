import type { RawLine, StoryPart } from './types.ts';

export const STORY_RAW: Record<number, Pick<Record<StoryPart, RawLine[]>, 'intro' | 'outro'>> = {
  1: {
    intro: [
      { e: 'surprised', t: 'Oh dear, oh dear! Partner, my honey jar has vanished from the pantry!' },
      { e: 'thinking', t: 'But look: sticky pawprints, and a very faint buzzing. The clues are all tangled up in this letter board.' },
      { e: 'neutral', t: 'Drag your finger across touching letters, in any direction, even diagonally, to spell each clue word. Ready?',
        choices: [
          { label: "Let's crack the case!", reply: { e: 'happy', t: "That's the spirit! Every single letter belongs to a word, so leave none behind." } },
          { label: 'Any tips first?', gift: true, reply: { e: 'proud', t: 'Of course! Take my spare notebook. It holds one free hint, on the house.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'The jar! It was Pip the bee, saving honey for a surprise tea party.' },
      { e: 'proud', t: 'Case closed, partner. But I hear the library is in a terrible muddle...' }
    ]
  },
  2: {
    intro: [
      { e: 'neutral', t: "Welcome to Miss Hoot's library. Shhh... can you hear that? Nothing. Not a single page turning." },
      { e: 'sad', t: 'Every book has been shuffled, and the titles have run together like spilled tea.' },
      { e: 'thinking', t: 'We need to sort the clues, word by word. Shall we?',
        choices: [
          { label: "Quietly, I'm on it.", reply: { e: 'happy', t: 'Excellent. Quiet detectives catch the most words.' } },
          { label: 'Can I peek at your notes?', gift: true, reply: { e: 'proud', t: 'Ah, a careful sleuth! One free hint, tucked inside a bookmark.' } }
        ] }
    ],
    outro: [
      { e: 'surprised', t: 'Miss Hoot was sleep-shelving again! She does it every full moon.' },
      { e: 'happy', t: 'Let us leave her to dream. Besides, the garden has gone terribly droopy...' }
    ]
  },
  3: {
    intro: [
      { e: 'sad', t: 'Oh, the poor garden. Every petal is drooping and the watering can is bone dry.' },
      { e: 'thinking', t: 'And someone, or something, has been digging. See those little mounds of soil?' },
      { e: 'neutral', t: 'Trace each word from letter to letter. Slide back onto the previous letter if you take a wrong turn.',
        choices: [
          { label: 'Follow the clues!', reply: { e: 'happy', t: 'Onward! A good detective never loses the trail.' } },
          { label: 'Got a spare hint?', gift: true, reply: { e: 'proud', t: 'A gardener never shares her secret seeds, but a detective may. One free hint.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Mabel the mole! She was digging for her lost spectacles, and struck a spring instead.' },
      { e: 'proud', t: 'Now the flowers drink happily. Look up, though... what happened to the moon?' }
    ]
  },
  4: {
    intro: [
      { e: 'surprised', t: 'The moon is gone! The sky is just a big, dark, empty blanket.' },
      { e: 'thinking', t: 'The night owls are fretting. They say the stars saw nothing, but the clocktower chimed thirteen.' },
      { e: 'neutral', t: 'Thirteen chimes. Something is afoot. Shall we pick the clues out of the night?',
        choices: [
          { label: 'Thirteen? Suspicious!', reply: { e: 'thinking', t: 'Precisely! Keep your eyes sharp and your finger steady.' } },
          { label: 'Light my way with a hint?', gift: true, reply: { e: 'happy', t: 'Gladly. One free hint, shining like a firefly.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'There it is, napping behind the clocktower! The moon was simply tired.' },
      { e: 'proud', t: 'We should celebrate. In fact... I have a feeling something sweet is about to happen.' }
    ]
  },
  5: {
    intro: [
      { e: 'sad', t: 'Partner... my birthday cake has gone missing. I only left for a moment!' },
      { e: 'thinking', t: 'Cream, berries, sugar... the pantry smells wonderful, but the cake is nowhere to be seen.' },
      { e: 'neutral', t: 'This is the last tangle, and the sweetest. Are you ready?',
        choices: [
          { label: 'Nothing escapes us now!', reply: { e: 'proud', t: "That's the detective I know!" } },
          { label: 'Maybe one last hint?', gift: true, reply: { e: 'happy', t: 'For a case this sweet, why not? One free hint.' } }
        ] }
    ],
    outro: [
      { e: 'surprised', t: 'Surprise! Everyone is here: Pip, Miss Hoot, Mabel, even the moon!' },
      { e: 'happy', t: 'They hid the cake to throw me a party. And the best detective in the world is you. Thank you, partner.' },
      { e: 'proud', t: 'Tales and tangles, solved together. Until the next mystery!' }
    ]
  },
  6: {
    intro: [
      { e: 'surprised', t: 'The lighthouse has gone dark, partner! Ships are bumping into each other out there. Politely, but still.' },
      { e: 'thinking', t: 'Someone took the lamp from the tower. Old Barnacle the keeper swears he was napping. Everyone says that.' },
      { e: 'neutral', t: 'Five suspects, five rooms, five odd objects. This one needs a proper notebook. Ready?',
        choices: [
          { label: "Let's sail into it!", reply: { e: 'happy', t: 'Aye! Trace the clues first, then we will untangle the suspects together.' } },
          { label: 'Lend me your notebook.', gift: true, reply: { e: 'proud', t: 'A sailor’s notebook, waterproof. One free hint is tucked inside the cover.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'The lamp! Old Barnacle was polishing it for the lighthouse’s birthday, and nodded off on the stairs.' },
      { e: 'proud', t: 'Ships are safe again. But I hear something sparkling has gone missing from a very special globe...' }
    ]
  },
  7: {
    intro: [
      { e: 'sad', t: 'A snow globe has vanished from the winter fair, and the whole village has gone very, very quiet.' },
      { e: 'thinking', t: 'The only clue is a sparkle of glitter... and a great many mitten prints.' },
      { e: 'neutral', t: 'Five friends, five rooms. They all say they were somewhere else. Shall we find out who was where?',
        choices: [
          { label: 'Bundle up and begin!', reply: { e: 'happy', t: 'That is the spirit. Cold hands, warm heart, sharp mind.' } },
          { label: 'A hint, perhaps?', gift: true, reply: { e: 'proud', t: 'Cocoa and a hint, as promised. One free hint, steaming hot.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Pebble Penguin only borrowed it, to give the globe a fresh coat of snow before the fair!' },
      { e: 'surprised', t: 'Speaking of lights... the night market’s golden lantern has just gone dark.' }
    ]
  },
  8: {
    intro: [
      { e: 'neutral', t: 'Welcome to the midnight market, where everything glows and nothing is quite what it seems.' },
      { e: 'surprised', t: 'The golden lantern that lights every stall is gone! The whole market is whispering about it.' },
      { who: 'Evil Larry', e: 'smug', t: 'Evenin\', detective. Lovely market. Shame about the lights.' },
      { e: 'surprised', t: 'Evil Larry! I would know that striped jumper anywhere.' },
      { who: 'Evil Larry', e: 'sneaky', t: 'Prove it, bear. Five suspects, five stalls, and not one of them saw a thing.' },
      { e: 'thinking', t: 'Everyone here has a story, and none of them agree. Compare the clues carefully.',
        choices: [
          { label: 'I like a good whisper.', reply: { e: 'happy', t: 'Then you will love this market. Listen closely, and trust the notebook.' } },
          { label: 'Got a hint for me?', gift: true, reply: { e: 'proud', t: 'A spice merchant owed me a favour. One free hint, smelling of cinnamon.' } }
        ] }
    ],
    outro: [
      { who: 'Evil Larry', e: 'caught', t: 'Hssss! You were not supposed to find the lantern in my sack, bear!' },
      { e: 'happy', t: 'He bolted over the rooftops, and the golden lantern is glowing over the market again.' },
      { e: 'proud', t: 'The market glows again. Now, why does the carnival tent sound so very quiet?' }
    ]
  },
  9: {
    intro: [
      { e: 'neutral', t: 'The carnival after dark. Lovely, and a little spooky. The star prop of the show has disappeared.' },
      { e: 'thinking', t: 'Five performers, five rooms along the midway. Some rooms are right next to each other. That will matter.' },
      { e: 'surprised', t: 'Every clue has a trick in it. Ready for the trickiest case yet?',
        choices: [
          { label: 'Step right up!', reply: { e: 'happy', t: 'Ladies and gentlemen, the detective is ready! Mind the trapdoors.' } },
          { label: 'A hint before the show?', gift: true, reply: { e: 'proud', t: 'Backstage pass! One free hint, courtesy of the ringmaster.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Domino was practising a surprise finale at the ferris wheel, and hid the prop to keep it secret!' },
      { e: 'thinking', t: 'Still, that striped thread snagged on the big top is not Domino\'s. Somebody was watching us tonight...' },
      { e: 'sad', t: 'One mystery left, partner. And it is the one I was hoping we would never meet...' }
    ]
  },
  10: {
    intro: [
      { e: 'sad', t: 'My friend... the last lantern has gone out. Everyone we have ever helped is here tonight.' },
      { e: 'thinking', t: 'My first thought was Larry, of course. But he is nowhere on this list of suspects.' },
      { e: 'thinking', t: 'Five faces you know well. That is exactly what makes this one so hard.' },
      { e: 'neutral', t: 'Trust the notebook, not your heart. Are you ready for the final case?',
        choices: [
          { label: 'I will find the truth.', reply: { e: 'proud', t: 'I never doubted it. Take your time, partner.' } },
          { label: 'One last hint, please?', gift: true, reply: { e: 'happy', t: 'For the final case? Of course. One free hint, glowing softly.' } }
        ] }
    ],
    outro: [
      { e: 'surprised', t: 'Mabel! She was keeping the last light safe from the wind in the great hall, and it went out when she sneezed!' },
      { e: 'proud', t: 'No harm done. We can relight it together, all of us.' },
      { who: 'Evil Larry', e: 'smug', t: 'Relit already? Pity. I had plans for that lantern.' },
      { e: 'neutral', t: 'Another night, Larry.' },
      { e: 'happy', t: 'Tales and tangles, unravelled together. Thank you, partner. A light will always be on for you.' },
      { e: 'surprised', t: 'Wait... did you see that? A shooting star! And it is falling straight toward the meadow!' }
    ]
  },
  11: {
    intro: [
      { e: 'surprised', t: 'Partner! Did you see that? Something just fell out of the sky and landed in the clover!' },
      { who: 'Pickle', e: 'surprised', t: 'Bork! Bork bork! Hello? Is this... Planet Kibble?' },
      { e: 'happy', t: 'Oh, my whiskers. A little alien dachshund! He is the longest, smallest, greenest pup I have ever seen.' },
      { who: 'Pickle', e: 'sad', t: 'I turned left at the moon. Everybody says never turn left at the moon. Bork.' },
      { who: 'Pickle', e: 'sad', t: 'And now my star map is gone, and I cannot find the way home. Whimper.' },
      { e: 'proud', t: 'Then we shall find it, Pickle. Every clue is tangled up in this letter board. Shall we?',
        choices: [
          { label: 'We will get you home!', reply: { e: 'happy', t: 'That is the spirit! Every single letter belongs to a word, so leave none behind.' } },
          { label: 'Got a hint for me?', gift: true, reply: { e: 'proud', t: 'Of course! Pickle gave me a moon-shaped biscuit, and inside there is one free hint.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'The star map! Pip the bee had it all along. It kept blowing away in the wind, so Pip pinned it down on the picnic hill with a flashlight.' },
      { who: 'Pickle', e: 'wiggle', t: 'Bork bork! My map! Thank you, Pip! Thank you, detective bear!' },
      { e: 'thinking', t: 'Hmm. The map is smudged, and Pickle\'s rocket tank is nearly empty. He will need stardust to fly again.' },
      { e: 'proud', t: 'The old observatory on the hill keeps stardust for its telescope. Off we go, partner.' }
    ]
  },
  12: {
    intro: [
      { e: 'neutral', t: 'The old observatory. Miss Hoot keeps a jar of stardust here, to make the big telescope shine.' },
      { who: 'Pickle', e: 'sad', t: 'Bork... the jar is empty. Without stardust, my rocket cannot fly.' },
      { e: 'surprised', t: 'Empty? But look at the stairs. They are still sparkling! Somebody carried it out of the star dome.' },
      { e: 'thinking', t: 'Five suspects, five rooms, from the star dome to the lookout deck. Compare the clues carefully.',
        choices: [
          { label: 'Stardust hunting time!', reply: { e: 'happy', t: 'Splendid. Mind the telescope, it is surprisingly wobbly.' } },
          { label: 'A hint, please?', gift: true, reply: { e: 'proud', t: 'Pickle sniffed one out for you. One free hint, smelling faintly of stars.' } }
        ] }
    ],
    outro: [
      { e: 'surprised', t: 'Fenny Firefly! She sprinkled the stardust over the star chart, so the constellations glow all the way to Pickle\'s home!' },
      { who: 'Pickle', e: 'happy', t: 'Bork bork bork! I can see my star! The whole map is shining!' },
      { e: 'happy', t: 'And there is just enough dust left to fill the tank.' },
      { e: 'proud', t: 'One thing remains: the rocket needs its launch key. To the launch field, partner!' }
    ]
  },
  13: {
    intro: [
      { e: 'neutral', t: 'The launch field, at the edge of the meadow. The rocket is fuelled, polished and ready.' },
      { who: 'Pickle', e: 'sad', t: 'Bork. The launch key was on the launch pad, and now it is not. I cannot go home without it.' },
      { e: 'thinking', t: 'Five friends came to wave Pickle off, and one of them knows where that key went.' },
      { e: 'neutral', t: 'This is the last case of the night. Are you ready to send our friend home?',
        choices: [
          { label: 'Ready for take-off!', reply: { e: 'happy', t: 'Ten, nine, eight... oh, we do not need to start that high. Let us begin!' } },
          { label: 'One last hint, please?', gift: true, reply: { e: 'proud', t: 'For the final launch? Of course. One free hint, glowing softly.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'There he goes! Rufus Rabbit only borrowed the launch key to keep it safe, and lit sparklers to send Pickle off in style.' },
      { who: 'Pickle', e: 'happy', t: 'Bork! Radio check! I can see my home from here! Thank you, Barnaby! Thank you, everybody!' },
      { e: 'proud', t: 'Safe travels, little friend. Wag your tail all the way home.' },
      { e: 'happy', t: 'Look, partner. He left a brand new star right above Honeywick.' }
    ]
  }
};

/* between the two puzzles (bridge) and before the accusation (caseIntro) */
export const STORY_EXTRA: Record<number, Pick<Record<StoryPart, RawLine[]>, 'bridge' | 'caseIntro'>> = {
  1: { bridge:    [{ e: 'happy',    t: 'HONEY! Now we know what the thief loved. Next, the scent trail: one path through every tile, touching the numbers in order.' }],
       caseIntro: [{ e: 'thinking', t: 'Four suspects, four rooms. No single clue will crack it. Cross people off in the notebook until only one story fits.' }] },
  2: { bridge:    [{ e: 'thinking', t: 'QUILL! Ink on the floor, too. Follow the inky footprints: every tile once, numbers in order.' }],
       caseIntro: [{ e: 'thinking', t: 'The clues are vaguer this time. Think about who could possibly be where.' }] },
  3: { bridge:    [{ e: 'happy',    t: 'TULIP! There are petals everywhere. Now the muddy tracks: one trail, every patch, numbers in order.' }],
       caseIntro: [{ e: 'neutral',  t: 'Mole hills, a rabbit and a bee. Who was where? The notebook knows.' }] },
  4: { bridge:    [{ e: 'surprised', t: 'MOON! So something glowing took it. Now follow the trail to the clocktower, every step, numbers in order.' }],
       caseIntro: [{ e: 'thinking', t: 'Something glows and something chimes. Which suspect fits every clue?' }] },
  5: { bridge:    [{ e: 'happy',    t: 'CAKE! Crumbs! Follow the sugar trail: one path through every tile, numbers in order.' }],
       caseIntro: [{ e: 'proud',    t: 'A cake lover with a plan. Use every clue, partner.' }] },
  6: { bridge: [{ e: 'surprised', t: 'BEACON! The glass is still warm. Now the tide has washed the harbour path: follow the numbers, touch every plank.' }],
       caseIntro: [{ e: 'thinking', t: 'Your notebook holds the clues. No single clue will crack it, so cross people off until one story fits. Who took the lamp?' }] },
  7: { bridge: [{ e: 'happy', t: 'GLOBE glitter! Next, the sleigh runner marks: one trail, every tile, numbers in order.' }],
       caseIntro: [{ e: 'thinking', t: 'Read the clues slowly. They are sneakier than snow. Who held the globe?' }] },
  8: { bridge: [{ e: 'thinking', t: 'SPICE on the cobbles! Now follow the market whispers, stall by stall, numbers in order.' }],
       caseIntro: [{ e: 'neutral', t: 'Everyone has an alibi, and most of them overlap. And a certain striped someone smells strongly of the mask booth...' }] },
  9: { bridge: [{ e: 'surprised', t: 'CIRCUS sawdust! Now follow the ticket stubs: one trail, every tile, numbers in order.' }],
       caseIntro: [{ e: 'thinking', t: 'Striped pawprints by the ticket booth... but Larry is not on our list tonight. Focus, partner. The rooms along the midway matter here: who was next to whom?' }] },
  10: { bridge: [{ e: 'proud', t: 'LIGHT under the door! Now the lantern’s own trail: every step, numbers in order.' }],
        caseIntro: [{ e: 'sad', t: 'Everyone we have met is here. Trust the notebook, partner. Who put out the last lantern?' }] },
  11: { bridge: [{ e: 'surprised', t: 'COMET! So that was the falling star. Now follow the scorched trail across the meadow: every tile, numbers in order.' }],
        caseIntro: [{ e: 'thinking', t: 'Five suspects, five spots around the meadow. Somebody has Pickle\'s map. Cross people off until one story fits.' }] },
  12: { bridge: [{ e: 'happy', t: 'GALAXY glitter! Now follow the SPARKLE up the stairs: every tile, numbers in order.' }],
        caseIntro: [{ e: 'thinking', t: 'Who was where, and who held what? Some rooms are right next to each other. That will matter.' }] },
  13: { bridge: [{ e: 'proud', t: 'ROCKET! Now the countdown, chalked across the field: follow the numbers, touch every tile.' }],
        caseIntro: [{ e: 'neutral', t: 'The very last case before take-off. Who was on the launch pad with the key? Trust the notebook, partner.' }] }
};

export const REACT = {
  zipHint1Off:  { id: 'zip_nudge_off', e: 'thinking', t: 'Your trail wanders off the scent. Try backing up a little.' },
  zipHint1Go:   { id: 'zip_nudge_go',  e: 'neutral',  t: 'Head for the next number. Every tile must be covered before the last one.' },
  zipHint2:     { id: 'zip_hint2',     e: 'happy',    t: 'Look for the glowing tile. That is the next step.' },
  zipHint3:     { id: 'zip_hint3',     e: 'proud',    t: 'Allow me to sniff out a few steps for you.' },
  zipOrder:     { id: 'zip_order',     e: 'thinking', t: 'The numbers must be visited in order. The last one comes at the very end.' },
  zipStart:     { id: 'zip_start',     e: 'neutral',  t: 'Start at number 1, drag through every tile, and finish on the last number.' },
  caseWrongA:   { id: 'case_wrong_a',  e: 'thinking', t: 'Not quite. Every single clue has to fit. Check the notebook again.' },
  caseWarn:     { id: 'case_warn',     e: 'sad',      t: 'Careful, partner. Wrong accusations will cost this case a star. Cross people off first.' },
  caseHint:     { id: 'case_hint',     e: 'happy',    t: 'I spotted something. I have marked one cell for you in the notebook.' },
  evilNoHelp:   { id: 'evil_nohelp',   e: 'sad',      t: 'Noir has hidden my notebook. No more hints on this one!' },
  caseNoHint:   { id: 'case_nohint',   e: 'proud',    t: 'You already have everything you need. Time to accuse!' },
  caseRight:    { id: 'case_right',    e: 'surprised', t: 'Both clues fit! That is our culprit!' },
  start:    { id: 'puzzle_start',   e: 'neutral',   t: 'Drag across touching letters to spell a word. Every letter belongs to one!' },
  found: [
    { id: 'puzzle_found_01', e: 'happy',  t: 'Aha! That is a clue!' },
    { id: 'puzzle_found_02', e: 'happy',  t: 'Marvelous, partner!' },
    { id: 'puzzle_found_03', e: 'proud',  t: 'Elementary, my dear friend!' },
    { id: 'puzzle_found_04', e: 'happy',  t: 'Bear-y impressive!' },
    { id: 'puzzle_found_05', e: 'proud',  t: 'Another piece of the puzzle!' },
    { id: 'puzzle_found_06', e: 'happy',  t: 'You have a nose for this!' }
  ],
  gold:     { id: 'puzzle_gold',     e: 'surprised', t: "That's the key word of the whole case! Wonderful!" },
  wrong: [
    { id: 'puzzle_wrong_01', e: 'thinking', t: 'Hmm, that is not a clue word. Try another path.' },
    { id: 'puzzle_wrong_02', e: 'sad',      t: 'Oops, tangled up! Let us try again.' },
    { id: 'puzzle_wrong_03', e: 'thinking', t: 'Not quite. Untangle and retry!' }
  ],
  near:     { id: 'puzzle_near',     e: 'thinking', t: 'That IS a clue word, but its tangle runs a different way. Try another route!' },
  bonus: [
    { id: 'puzzle_bonus_01', e: 'surprised', t: 'Ooh, a hidden word! Not a clue, but a fine find.' },
    { id: 'puzzle_bonus_02', e: 'happy',     t: 'A secret word! Bonus points for the sharp-eyed.' },
    { id: 'puzzle_bonus_03', e: 'proud',     t: 'Not part of the case, but well spotted, partner!' }
  ],
  bonusAgain: { id: 'puzzle_bonus_again', e: 'neutral', t: 'You already found that hidden word. Try a different one!' },
  hint:     { id: 'puzzle_hint',     e: 'happy',    t: 'Look for the glowing letters. That is where a word begins.' },
  nohint:   { id: 'puzzle_nohint',   e: 'neutral',  t: 'You have found every word already!' },
  victory: {
    3: { id: 'victory_3', e: 'proud', t: 'Flawless detective work. Three stars, no tangles left!' },
    2: { id: 'victory_2', e: 'happy', t: 'Splendid! A few tangles, but you untied them all.' },
    1: { id: 'victory_1', e: 'happy', t: 'Case solved! Every great detective needs a little practice.' }
  }
};
