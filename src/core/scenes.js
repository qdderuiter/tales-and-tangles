/* Registry of cinematic scenes, filled in by the scene modules themselves (scenes.larry = LarryScene, ...).
   Level data refers to scenes through here, so data files never have to import the scene code (which would drag the whole app in while the data is still loading). */
export const scenes = {};
