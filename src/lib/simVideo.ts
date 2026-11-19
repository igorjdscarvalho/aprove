import type { PlayerSource } from './playerSource';

/** Vídeo simulado (só canvas) para os Reels de exemplo, que ainda não têm arquivo de vídeo. */
export class SimVideo implements PlayerSource {
  currentTime = 0;
  paused = false;
  volume = 1;
  muted = true;
  readonly duration: number;

  constructor(duration: number) {
    this.duration = duration > 0 ? duration : 12;
  }

  play(): void {
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
  }

  /** Avança o relógio (com loop, como no Reels). */
  tick(dt: number): void {
    if (this.paused) return;
    this.currentTime += dt;
    if (this.currentTime >= this.duration) this.currentTime %= this.duration;
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const t = this.currentTime;
    const scene = Math.floor(t / 3);
    const hue = (scene * 70 + t * 12) % 360;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${hue} 85% 60%)`);
    g.addColorStop(1, `hsl(${(hue + 60) % 360} 75% 45%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.beginPath();
    ctx.arc(w / 2 + Math.sin(t * 1.3) * 110, h / 2 + Math.cos(t * 0.9) * 160, 70, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '700 40px Arial, sans-serif';
    ctx.fillText(`Cena ${scene + 1}`, w / 2, h / 2);
    ctx.font = '500 15px Arial, sans-serif';
    ctx.fillText('vídeo simulado', w / 2, h / 2 + 32);
  }
}
