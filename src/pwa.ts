export const PWA = {
  drawIcon(size: number) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d')!, s = size / 100;
    const bg = x.createLinearGradient(0, 0, 0, size); bg.addColorStop(0, '#fdf1dc'); bg.addColorStop(1, '#f5d9b3');
    x.fillStyle = bg; x.fillRect(0, 0, size, size);
    const circle = (cx: number, cy: number, r: number, col: string) => { x.beginPath(); x.arc(cx * s, cy * s, r * s, 0, Math.PI * 2); x.fillStyle = col; x.fill(); };
    circle(26, 30, 12, '#8b5a3c'); circle(74, 30, 12, '#8b5a3c'); circle(26, 30, 6, '#e8a99a'); circle(74, 30, 6, '#e8a99a');
    circle(50, 56, 33, '#9a6743');
    x.beginPath(); x.ellipse(50 * s, 66 * s, 17 * s, 13 * s, 0, 0, Math.PI * 2); x.fillStyle = '#f3dcb8'; x.fill();
    circle(38, 52, 4, '#2d2118'); circle(62, 52, 4, '#2d2118');
    x.beginPath(); x.ellipse(50 * s, 60 * s, 5.5 * s, 4 * s, 0, 0, Math.PI * 2); x.fillStyle = '#4a3326'; x.fill();
    x.beginPath(); x.moveTo(24 * s, 38 * s); x.quadraticCurveTo(50 * s, 2 * s, 76 * s, 38 * s); x.quadraticCurveTo(50 * s, 30 * s, 24 * s, 38 * s);
    x.fillStyle = '#b8935c'; x.fill();
    return c.toDataURL('image/png');
  },
  init() {
    try {
      const i192 = this.drawIcon(192), i512 = this.drawIcon(512), i180 = this.drawIcon(180);
      const touch = document.createElement('link'); touch.rel = 'apple-touch-icon'; touch.href = i180; document.head.appendChild(touch);
      const manifest = {
        name: 'Tales & Tangles', short_name: 'Tangles', description: 'A cozy word-tracing mystery with Barnaby the Detective Bear.',
        start_url: location.href.split('#')[0], display: 'standalone', orientation: 'portrait',
        background_color: '#fbf3e6', theme_color: '#fbf3e6',
        icons: [{ src: i192, sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: i512, sizes: '512x512', type: 'image/png', purpose: 'any' }]
      };
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
      document.head.appendChild(link);
    } catch { /* manifest is a nicety, never block the game */ }
  }
};
