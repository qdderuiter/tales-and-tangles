import type { Bear } from '../characters/barnaby.ts';
import { $ } from '../core/dom.ts';
import { late } from '../core/util.ts';
import type { Line } from '../data/types.ts';
import { Dialogue } from '../dialogue/dialogue.ts';
import type { PlayOpts } from '../dialogue/dialogue.ts';
import { SPEAKERS } from '../dialogue/speakers.ts';
import { UI } from './ui.ts';

/* a speaker's own portrait on the story screen: the element it lives in, and its face */
export interface StoryPortrait { host: HTMLElement; portrait: { react(e: string): void } }

/* The story screen: Barnaby (or Evil Larry) talking in a scene. Tap anywhere to advance or finish typing; Skip ends the scene. */
export const StoryScreen = {
  dialogue: late<Dialogue>(),

  init(bear: Bear, portraits: Record<string, StoryPortrait>) {
    this.dialogue = new Dialogue({ nameEl: $('#dlgName'), textEl: $('#dlgText'), choicesEl: $('#dlgChoices'), caret: $('#dlgCaret'), bear });
    this.dialogue.defaultSpeaker = (who: string, e: string, reset?: boolean) => {          // swap the portrait when Evil Larry or Pickle speaks
      const sp = SPEAKERS[who], key = reset ? undefined : sp?.portrait;
      Object.entries(portraits).forEach(([k, p]) => p.host.classList.toggle('on', k === key));
      $('#storyBear').classList.toggle('away', !!key);
      if (key && portraits[key]) portraits[key].portrait.react(e);
    };
    $('#screen-story').addEventListener('pointerdown', e => {   // respond on press, not release
      const t = e.target as Element;
      if (t.closest('#btnSkip') || t.closest('.dlg-choices')) return;
      this.dialogue.tap();
    });
    $('#btnSkip').addEventListener('click', () => this.dialogue.end());
  },

  /* switch to the story screen, tinted with the level's colours */
  show(lv: { scene: [string, string] }, title: string) {
    $('#screen-story').style.setProperty('--scene-a', lv.scene[0]);
    $('#screen-story').style.setProperty('--scene-b', lv.scene[1]);
    $('#storyTitle').textContent = title;
    UI.show('story');
  },

  /* lines: STORY[n][part]; opts: { onChoice, onDone } */
  play(lines: Line[], opts?: PlayOpts) { this.dialogue.play(lines, opts); }
};
