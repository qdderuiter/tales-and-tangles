/* bumped on resize so cached grid rects get re-measured (an object: an imported binding can't be reassigned from outside its module) */
export const layout = { epoch: 0 };
window.addEventListener('resize', () => { layout.epoch++; });
