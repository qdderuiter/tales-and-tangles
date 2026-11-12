/* Registry of cinematic scenes, filled in by the scene modules themselves (scenes.larry = LarryScene, scenes.chapterEnd = ChapterFilm, ...).
   Level data and the game flow refer to scenes through here, so they never have to import the scene code (which would drag the whole app in while the data is still loading). */
/* a cinematic scene: resolves when it has finished */
export interface SceneDef { intro(): Promise<void>; caught(): Promise<void> }
/* the film that ends a chapter, by chapter id (data/chapters.ts); resolves when it has finished or been skipped */
export interface ChapterFilmDef { play(chapterId: string): Promise<void> }

export const scenes: { larry?: SceneDef; pup?: SceneDef; worm?: SceneDef; elephant?: SceneDef; dino?: SceneDef; chapterEnd?: ChapterFilmDef; [name: string]: SceneDef | ChapterFilmDef | undefined } = {};
