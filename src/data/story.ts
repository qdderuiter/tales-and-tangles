import type { RawLine, StoryPart } from './types.ts';

export const STORY_RAW: Record<number, Pick<Record<StoryPart, RawLine[]>, 'intro' | 'outro'>> = {
  1: {
    intro: [
      { e: 'surprised', t: 'Oh dear, oh dear! Partner, my honey jar has vanished from the pantry!' },
      { e: 'thinking', t: 'But look: sticky pawprints, and a very faint buzzing. The clues are all tangled up in this letter board.' },
      { e: 'neutral', t: 'Drag your finger across touching letters, up, down or sideways, to spell each clue word. Words can bend! Ready?',
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
      { e: 'happy', t: 'Look, partner. He left a brand new star right above Honeywick.' },
      { e: 'thinking', t: 'Hm. Do you feel that? A warm breeze, and a faint smell of sand and starlight...' },
      { e: 'surprised', t: 'Somewhere far to the south, under a midnight moon, someone small is calling for help. Let us go and see.' }
    ]
  },
  14: {
    intro: [
      { e: 'surprised', t: 'Goodness me! The sand just popped up and wiggled at us.' },
      { who: 'Biscuit', e: 'shy', t: 'Oh! Pardon me. I did not mean to pop up so suddenly. My name is Biscuit.' },
      { who: 'Biscuit', e: 'sad', t: 'I went out to count the stars. And when I wiggled back down, every dune looked exactly the same. I cannot find my house anywhere.' },
      { e: 'thinking', t: 'Lost in the desert at midnight? Well, that settles it. We are walking you home.' },
      { who: 'Biscuit', e: 'happy', t: 'You would do that? Even though I am very small, and very slow?' },
      { e: 'proud', t: 'Especially then. Small friends make the very best company. And look, his little brass compass is missing from the dune ridge. That is our first clue.',
        choices: [
          { label: "Let's get Biscuit home!", reply: { e: 'happy', t: 'That is the spirit! Trace each word, and leave no letter behind.' } },
          { label: 'Any tips for the road?', gift: true, reply: { e: 'proud', t: 'Of course. Take my spare notebook. It holds one free hint, wrapped in sand-proof paper.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Fennec Fern! She borrowed the compass at the dune ridge, and held a lantern high so Biscuit could find his way back to her.' },
      { who: 'Biscuit', e: 'wiggle', t: 'Fern, you were looking for me? That is the kindest thing anyone has ever done with my compass!' },
      { who: 'Biscuit', e: 'happy', t: 'It always points north. And my house is, well... a little bit north, I think.' },
      { e: 'proud', t: 'Then north we go, partner. The caravan lights should be just over the next dune.' }
    ]
  },
  15: {
    intro: [
      { e: 'neutral', t: 'A camel caravan, sleeping under the stars. Hush now. The sand is listening.' },
      { who: 'Biscuit', e: 'sleepy', t: 'Barnaby? Is it all right if I ride in your pocket? My tail is very tired.' },
      { e: 'happy', t: 'Of course. There you go, snug as a... well, snug as a worm in a pocket.' },
      { who: 'Biscuit', e: 'happy', t: 'It is very cozy in here. It smells like honey.' },
      { e: 'surprised', t: 'Honey! So that is where my snack went... Never mind. Look, partner: the caravan lost its star map, the one that shows the way to the oasis.' },
      { e: 'thinking', t: 'Five travellers, five spots around the camp. Shall we see who was where?',
        choices: [
          { label: 'Stargazing time!', reply: { e: 'happy', t: 'Splendid. Mind the camels. They are very sleepy and very tall.' } },
          { label: 'A hint for the night?', gift: true, reply: { e: 'proud', t: 'Biscuit found one in my pocket. One free hint, smelling faintly of honey.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Juniper Jerboa! She wrapped the star map in her silk scarf and tucked it away in the camel tent, so the night wind could not carry it off.' },
      { who: 'Biscuit', e: 'wiggle', t: 'She kept it safe! And look, the map says my oasis is just past the last dune!' },
      { who: 'Biscuit', e: 'happy', t: 'I can almost smell the date palms!' },
      { e: 'proud', t: 'Then lead on, little navigator. Or rather, point the way from my pocket.' }
    ]
  },
  16: {
    intro: [
      { e: 'surprised', t: 'Look, partner! Palm trees, a silver pool and fireflies everywhere. The midnight oasis!' },
      { who: 'Biscuit', e: 'happy', t: 'That is my pool! That is my palm tree! I am home!' },
      { who: 'Biscuit', e: 'sad', t: '...Oh. But my front door is locked, and my little door key is gone. Being home but not being able to get in is almost worse than being lost.' },
      { e: 'proud', t: 'Almost, but not quite. Being lost means you do not know where home is. Now we do.' },
      { e: 'neutral', t: 'One last case, partner. Five friends are gathered at the oasis, and one of them knows where that key went.',
        choices: [
          { label: 'For Biscuit!', reply: { e: 'happy', t: 'For Biscuit! And for every small friend who ever lost the way.' } },
          { label: 'One last hint, please?', gift: true, reply: { e: 'proud', t: 'For the final case? Of course. One free hint, glowing like a firefly.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Tumble Tortoise! He found the key in the palm grove, and kept it safe in his shell, because the sand likes to swallow small things.' },
      { who: 'Biscuit', e: 'happy', t: 'Thank you, Tumble! And look at that, my little round door has opened!' },
      { who: 'Biscuit', e: 'shy', t: 'It was here all along, right where I left it. Just under a lot of sand.' },
      { who: 'Biscuit', e: 'wiggle', t: 'Would you like to come in for a cup of cactus tea? It is not prickly, I promise.' },
      { e: 'happy', t: 'We would be honoured.' }
    ]
  },
  17: {
    intro: [
      { e: 'surprised', t: 'Well, I never. A little elephant in a polka-dot ruff, standing in an empty circus ring at midnight.' },
      { who: 'Pippy', e: 'shy', t: 'Toot! Oh! Hello. I am Pippy. Tonight is my very first show, and I was just practising.' },
      { who: 'Pippy', e: 'sad', t: 'I have a lucky star ball. I stand on it, I spin on it, I do all my best tricks on it. But the lights blinked, and now it is gone.' },
      { e: 'thinking', t: 'A missing ball on the night of a big show? Then we have until curtain-up. And look, partner: a trail of popcorn, leading away from the ring.' },
      { who: 'Pippy', e: 'wiggle', t: 'You would help me? Even though I am very small, and very wobbly?' },
      { e: 'proud', t: 'Especially then. Small friends make the best performers. Now, five circus folk, five spots around the grounds. Shall we see who was where?',
        choices: [
          { label: "Let's find that ball!", reply: { e: 'happy', t: 'The show must go on. Trace each word, and leave no letter behind.' } },
          { label: 'Any tips for the big top?', gift: true, reply: { e: 'proud', t: 'Of course. Take my spare notebook. It holds one free hint, tied with a red ribbon.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Marco Monkey! He was in the center ring with his popcorn tub, and when the lights blinked he lunged to catch the ball.' },
      { e: 'sad', t: 'Marco says: I only wanted to stop it rolling! But it bounced off my tub and away it went, right out of the ring.' },
      { who: 'Pippy', e: 'sad', t: 'Rolling away? Where to?' },
      { e: 'thinking', t: 'Somewhere high, I think. Look at the ladder: there are specks of glitter on every rung, all the way up to the wire.' },
      { who: 'Pippy', e: 'surprised', t: 'Oh. I am afraid of ladders. Elephants and ladders do not get along.' },
      { e: 'proud', t: 'Then you cheer from the sawdust, and I will climb. Come along, partner.' }
    ]
  },
  18: {
    intro: [
      { e: 'neutral', t: 'The high wire. Everything is very still up here. Even the sawdust is holding its breath.' },
      { who: 'Pippy', e: 'shy', t: 'I will wait down here. Toot. That means good luck.' },
      { e: 'happy', t: 'Thank you, Pippy. Five performers up here, five spots along the wire. One of them saw where the ball went.' },
      { e: 'thinking', t: 'Some of these clues only say who stood near whom, so read them slowly, and do not look down.',
        choices: [
          { label: 'Hush, and onward!', reply: { e: 'happy', t: 'Quietly now. A tightrope walker hates a loud detective.' } },
          { label: 'A hint, please?', gift: true, reply: { e: 'proud', t: 'Pippy tossed one up in a paper bag. One free hint, a little bit squashed.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Tilly Tightrope! She was on the high platform with her glitter pot, and she saw a great big ball come rolling across her wire.' },
      { e: 'neutral', t: 'Tilly says: I did not want it to fall on the audience seats! So I rolled it along the wire to the far side, very carefully. And then Ringo the ringmaster came and said he would look after it.' },
      { e: 'thinking', t: 'Ringo Raccoon. The ringmaster. He knows where everything in this circus is, and what it is for.' },
      { e: 'happy', t: 'And Tilly adds: He was smiling an awful lot. I thought that was a good sign.' },
      { e: 'proud', t: 'So do I. Back down we go, partner. The curtain rises soon.' }
    ]
  },
  19: {
    intro: [
      { e: 'surprised', t: 'Listen to that, Pippy. The whole audience is outside. The show begins in an hour.' },
      { who: 'Pippy', e: 'wiggle', t: 'Toot toot toot! I am so nervous my ears are flapping.' },
      { e: 'happy', t: 'Breathe, little clown. Five friends are backstage, five spots around the big top. One of them is the ringmaster, and he has your ball.' },
      { e: 'proud', t: 'One last case. Let us bring the star home.',
        choices: [
          { label: 'For Pippy!', reply: { e: 'happy', t: 'For Pippy, and for every small friend about to take a very big bow.' } },
          { label: 'One last hint, please?', gift: true, reply: { e: 'proud', t: 'For the grand finale? Of course. One free hint, sparkling like a spotlight.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Ringo Raccoon! He took the ball to the prop wagon, and gave it a fresh coat of gold paint, because a lucky star ball deserves to shine on opening night.' },
      { e: 'happy', t: 'Ringo says: It was meant to be a surprise! I did not know you thought it was lost. I am so sorry, Pippy.' },
      { who: 'Pippy', e: 'happy', t: 'It sparkles! It really, truly sparkles! Thank you, Ringo!' },
      { who: 'Pippy', e: 'proud', t: 'Barnaby, will you watch from the front row? I have a trick to show you.' },
      { e: 'happy', t: 'I would not miss it for all the honey in Honeywick. Places, everyone!' }
    ]
  },
  20: {
    intro: [
      { e: 'happy', t: 'What a sunny meadow. Ferns, tall grass, and a whole herd of dinosaurs playing tag. I have never seen so many friendly tails.' },
      { who: 'Rexy', e: 'happy', t: 'Roar! ...Oh. Sorry. That was a happy roar. I am Rexy, and these are my friends. We were just playing, until that thing showed up in the sky.' },
      { e: 'surprised', t: 'A glowing rock, getting bigger. That is a meteor, and it is headed straight for the meadow.' },
      { who: 'Rexy', e: 'sad', t: 'We cannot stop it with my tiny arms. But maybe with a very loud stomp? We keep our big stomp drum at the edge of the field, to keep the beat. And it has vanished.' },
      { e: 'thinking', t: 'A missing drum, a falling rock, and a whole meadow of dinosaurs counting on us. Look, partner: heavy footprints, leading off through the grass.' },
      { who: 'Rexy', e: 'wiggle', t: 'You would help us? Even though I am so small, and my arms are so very short?' },
      { e: 'proud', t: 'Especially then. Five dinosaurs, five spots around the meadow. Shall we find out who was where?',
        choices: [
          { label: "Let's find that drum!", reply: { e: 'happy', t: 'The meteor will have to wait. Trace each word, and leave no letter behind.' } },
          { label: 'Any tips for the meadow?', gift: true, reply: { e: 'proud', t: 'Of course. Take my spare notebook. It holds one free hint, wrapped in a fern leaf.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Pip Pterodactyl! He was in the mud pit with a bouncy ball, and the big drum made the softest, roundest nest for his warm egg.' },
      { e: 'sad', t: 'Pip says: I only borrowed it! A baby egg needs a warm, bouncy bed. I did not know a meteor was coming. I am so sorry.' },
      { who: 'Rexy', e: 'surprised', t: 'An egg! Is it close to hatching?' },
      { e: 'thinking', t: 'Not yet, I think. But the drum is safe, and Pip has promised to bring it back to the field. And look, partner: something big and round has rolled through the clearing, just past the pond.' },
      { who: 'Rexy', e: 'happy', t: 'Our Boing Ball! It is the biggest, bounciest thing in the whole meadow.' },
      { e: 'proud', t: 'Then we are going to need it. Come along, partner.' }
    ]
  },
  21: {
    intro: [
      { e: 'neutral', t: 'The sky is getting redder, Rexy. We have not got long.' },
      { who: 'Rexy', e: 'shy', t: 'The Boing Ball is our best chance. It is as big as a boulder, and it bounces higher than a mountain. If we can find it, a launch could knock that rock clean out of the sky.' },
      { e: 'happy', t: 'A launch. I like the sound of that. Five dinosaurs, five spots around the meadow, and one of them knows where the ball went.' },
      { e: 'thinking', t: 'Some of these clues only say who stood near whom, so read them slowly. A bouncy ball leaves a lot of tracks.',
        choices: [
          { label: 'Onward!', reply: { e: 'happy', t: 'Quickly, but carefully. A hurried detective trips over a very big tail.' } },
          { label: 'A hint, please?', gift: true, reply: { e: 'proud', t: 'Rexy found one under a rock. One free hint, only a little bit dusty.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Penny Parasaurolophus! She was on the rocky ridge with a paint bucket, painting a mural of the whole herd, and she had been using the ball as a comfy seat.' },
      { e: 'sad', t: 'Penny says: It was so round and so comfy! I did not mean to keep it so long. And then I heard the roaring, and I looked up.' },
      { who: 'Rexy', e: 'proud', t: 'That is all right, Penny. Now we have the ball, and we have the drum. All we need is something to launch it with.' },
      { e: 'thinking', t: 'Something long and springy, I think. A great big plank, to turn a stomp into a leap. Do you have one?' },
      { who: 'Rexy', e: 'surprised', t: 'The Great Spring Plank! We use it as a seesaw. And now that you ask... I have not seen it since the sun came up.' },
      { e: 'proud', t: 'Then the very last case begins. Come along, partner.' }
    ]
  },
  22: {
    intro: [
      { e: 'surprised', t: 'Look up, Rexy. You can see it now. The meteor, and a long, fiery tail behind it.' },
      { who: 'Rexy', e: 'wiggle', t: 'Roar roar roar! I am so nervous that my tail is shaking.' },
      { e: 'happy', t: 'Breathe, little dino. Five friends are at the launch site, five spots around the meadow. One of them has the plank.' },
      { e: 'proud', t: 'One last case. Let us save the meadow.',
        choices: [
          { label: 'For the meadow!', reply: { e: 'happy', t: 'For the meadow, for the egg, and for every dinosaur about to do something very brave.' } },
          { label: 'One last hint, please?', gift: true, reply: { e: 'proud', t: 'For the grand finale? Of course. One free hint, sparkling like a falling star.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Nubby Ankylosaurus! She took the plank to the egg nest, and gave it a fresh coat of rainbow paint, whistling on her tin whistle all the while. A bright seesaw, to cheer everyone up.' },
      { e: 'sad', t: 'Nubby says: It was meant to be a surprise for the whole herd! I did not know you needed it. I am so sorry.' },
      { who: 'Rexy', e: 'happy', t: 'It is beautiful! And it is perfect. Thank you, Nubby!' },
      { who: 'Rexy', e: 'proud', t: 'Barnaby, will you help us with the launch? I have a plan.' },
      { e: 'happy', t: 'I would not miss it for all the honey in Honeywick. Places, everyone!' }
    ]
  },
  23: {
    intro: [
      { e: 'surprised', t: 'Did you feel that, partner? The whole of Honeywick just wobbled. Jars rattled, teacups danced, and that is the fifth earthquake this week.' },
      { e: 'thinking', t: 'And look, a hole in the meadow, deep and round, with a faint hum coming up out of it. Something is drilling down there.' },
      { e: 'neutral', t: 'Down we go. A lift shaft, a mine cart and a crew in hard hats. They are drilling straight down to the core of the earth!' },
      { who: 'Rocky', e: 'sad', t: 'Hm? Hello? Is that the rumbling again? I was sound asleep, and then everything went bump, and my house fell down.' },
      { e: 'surprised', t: 'A little stone, halfway down! And a heap of rubble where a house used to be.' },
      { who: 'Rocky', e: 'shy', t: 'I am Rocky. That was my cosy home. Walls, roof, everything. And now my little brass doorbell is gone too. It was the only thing left.' },
      { e: 'happy', t: 'Then we will find your doorbell, and after that we will build you a better house than before. Five crew members, five spots around the drill. Somebody knows where it went.',
        choices: [
          { label: 'We will help, Rocky!', reply: { e: 'happy', t: 'That is the spirit. Trace each word, and leave no letter behind.' } },
          { label: 'Any tips for down here?', gift: true, reply: { e: 'proud', t: 'Of course. Take my spare notebook. It holds one free hint, glittering like a crystal.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Wally Wombat! He was on the lift shaft, with his brass whistle. He thought Rocky\'s little doorbell was the shift signal, and he rang it every time the crew took a break.' },
      { e: 'sad', t: 'Wally says: I did not know it belonged to anyone! It sounded so cheerful. I am so sorry.' },
      { who: 'Rocky', e: 'happy', t: 'You can ring it a little, if you bring it back. It only wants to be rung on a home.' },
      { e: 'thinking', t: 'And Rocky, you have given me an idea. I will need a pile of good bricks, and a great many hands. Where does a stone find walls, partner?' },
      { who: 'Rocky', e: 'proud', t: 'Down in the foundation pit, maybe? Come on, I will show you the way.' }
    ]
  },
  24: {
    intro: [
      { who: 'Rocky', e: 'shy', t: 'Here is where my house used to be. Right here, with the little round window. I can still see the shape of it.' },
      { e: 'thinking', t: 'We will start with the foundation, then the walls. Brick by brick, beam by beam.' },
      { who: 'Rocky', e: 'surprised', t: 'But the bricks! I saved a whole pile of good red ones, and now the pile has vanished too!' },
      { e: 'neutral', t: 'Another puzzle, partner. Five crew members around the pit, and everyone is wearing the same dusty smile. Let us find out who was where.' },
      { e: 'proud', t: 'One more thing. Every time the drill spins, the whole cave shakes. I do not think the earthquakes are an accident.',
        choices: [
          { label: 'Brick by brick!', reply: { e: 'happy', t: 'Brick by brick. Trace the words, and leave no letter behind.' } },
          { label: 'A hint for the pit, please?', gift: true, reply: { e: 'proud', t: 'Of course. One free hint, wrapped in a little red brick.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Dottie Dormouse! She was up on the scaffold with her wheelbarrow, hauling the bricks to prop up the drill, because it was wobbling so badly.' },
      { e: 'sad', t: 'Dottie says: The drill shakes everything, so I thought it needed a strong stand. I did not know they were Rocky\'s. I am so sorry.' },
      { who: 'Rocky', e: 'surprised', t: 'The drill shakes everything? Is it the drill that makes the earthquakes?' },
      { e: 'thinking', t: 'Every deep hole in the world makes the ground tremble, Rocky. So the crew is not just in the way. They are the reason your house fell down.' },
      { who: 'Rocky', e: 'sad', t: 'Oh. Then they have to stop, before everyone else loses a home too.' },
      { e: 'proud', t: 'We will talk to the foreman. But first, the roof, the door and the chimney. Let us finish what we started.' }
    ]
  },
  25: {
    intro: [
      { e: 'happy', t: 'Look at those walls! Straight and strong, and a round window facing the crystal cave. Rocky, it is beginning to look like a home.' },
      { who: 'Rocky', e: 'proud', t: 'Hee hee! A roof, a door, a warm bed. All I need now is the chimney cap, and it has vanished!' },
      { e: 'thinking', t: 'And the crew is packing up a bigger drill for one last dive toward the core. If we want Rocky to sleep soundly tonight, we need that cap, and we need a word with the foreman.' },
      { e: 'neutral', t: 'Five crew members, five spots around the house, and one tiny chimney cap. Shall we?' },
      { e: 'proud', t: 'The very last case. Let us finish the house, and end the earthquakes.',
        choices: [
          { label: 'For Rocky\'s home!', reply: { e: 'happy', t: 'For Rocky\'s home, and for every little stone that wants a quiet night.' } },
          { label: 'One last hint, please?', gift: true, reply: { e: 'proud', t: 'For the grand finale? Of course. One free hint, glowing like lantern light.' } }
        ] }
    ],
    outro: [
      { e: 'happy', t: 'Mack Mongoose, the foreman! He was in the parlour, holding a roof tile, and the chimney cap sat on his desk like a paperweight.' },
      { e: 'sad', t: 'Mack says: I thought the cap would make a fine lid for the core. It is so shiny. I am so sorry.' },
      { e: 'thinking', t: 'Mack, the core of the earth is a ball of fire, and every hole you drill makes the ground shake. Look at what the shaking did to Rocky\'s home.' },
      { who: 'Rocky', e: 'shy', t: 'I only wanted a quiet place to sleep. I did not mean to make anyone sad.' },
      { e: 'surprised', t: 'Mack takes off his hard hat. He says: Then we will pull up the drill, fill in the shaft, and go and dig somewhere with nobody home. Sorry, little Rocky.' },
      { who: 'Rocky', e: 'happy', t: 'The cap goes on the chimney, the door is shut, and the doorbell goes ding! I am home! Thank you, Barnaby!' },
      { e: 'happy', t: 'Places, everyone. The drill goes up, the walls stay down, and the earth goes back to sleep.' }
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
        caseIntro: [{ e: 'neutral', t: 'The very last case before take-off. Who was on the launch pad with the key? Trust the notebook, partner.' }] },
  14: { bridge: [{ e: 'happy', t: 'DESERT! The tiny tracks lead down a freshly dug hole. Now follow the burrow: every tile, numbers in order.' }],
        caseIntro: [{ e: 'thinking', t: 'Five desert friends, five spots along the dunes. Some of these clues only say who was near whom, so read them slowly.' }] },
  15: { bridge: [{ e: 'proud', t: 'CARAVAN! Biscuit says his compass is trembling. Follow the needle: every tile, numbers in order.' }],
        caseIntro: [{ e: 'neutral', t: 'Who was in the camel tent, and who held what? The neighbours matter tonight. Cross people off until one story fits.' }] },
  16: { bridge: [{ e: 'surprised', t: 'OASIS! The pool is full of ripples. Follow them back to the spring: every tile, numbers in order.' }],
        caseIntro: [{ e: 'proud', t: 'The very last case. Five friends, five spots around the oasis, and one little key. Trust the notebook, partner.' }] },
  17: { bridge: [{ e: 'happy', t: 'STAGE! There is sawdust on the boards. Now follow the popcorn: every tile, numbers in order.' }],
        caseIntro: [{ e: 'thinking', t: 'Five circus folk, five spots around the grounds. Somebody was near the ring when the lights blinked. Cross people off until one story fits.' }] },
  18: { bridge: [{ e: 'surprised', t: 'TRAPEZE! Glitter all over the rungs. Now step along the wire: every tile, numbers in order.' }],
        caseIntro: [{ e: 'neutral', t: 'Who was on the platform, and who held what? The neighbours matter up here. Trust the notebook, partner.' }] },
  19: { bridge: [{ e: 'proud', t: 'ENCORE! Now follow the trumpet call backstage: every tile, numbers in order.' }],
        caseIntro: [{ e: 'proud', t: 'The very last case. Five friends, five spots backstage, and one lucky star ball. Trust the notebook, partner.' }] },
  20: { bridge: [{ e: 'happy', t: 'MEADOW! Rexy says the thief left a trail of stomps. Now follow the drumbeat: every tile, numbers in order.' }],
        caseIntro: [{ e: 'thinking', t: 'Five dinosaurs, five spots around the meadow. Somebody was near the drum when the sky turned red. Cross people off until one story fits.' }] },
  21: { bridge: [{ e: 'surprised', t: 'METEOR dust! It is already falling on the meadow. Now follow the bounce marks: every tile, numbers in order.' }],
        caseIntro: [{ e: 'neutral', t: 'Who was by the ridge, and who held what? The neighbours matter tonight. Trust the notebook, partner.' }] },
  22: { bridge: [{ e: 'proud', t: 'LAUNCH! The countdown is scribbled right here. Now follow the glitter, tile by tile, numbers in order.' }],
        caseIntro: [{ e: 'proud', t: 'The very last case. Five friends, five spots around the meadow, and one plank. Trust the notebook, partner.' }] },
  23: { bridge: [{ e: 'surprised', t: 'DRILL! So that deep hum was the crew. Now follow the shaking: every tile, numbers in order.' }],
        caseIntro: [{ e: 'thinking', t: 'Five crew members, five spots around the drill. Somebody was near the lift shaft when the doorbell rang. Cross people off until one story fits.' }] },
  24: { bridge: [{ e: 'proud', t: 'BRICK! Red dust everywhere. Now follow the mortar trail, tile by tile, numbers in order.' }],
        caseIntro: [{ e: 'neutral', t: 'Who was by the scaffold, and who held what? The neighbours matter down here. Trust the notebook, partner.' }] },
  25: { bridge: [{ e: 'happy', t: 'CHIMNEY! There is soot on the floor. Now follow the glint through the window: every tile, numbers in order.' }],
        caseIntro: [{ e: 'proud', t: 'The very last case. Five friends, five spots around Rocky\'s house, and one little chimney cap. Trust the notebook, partner.' }] }
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
