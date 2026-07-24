import { Component, HostBinding, Input, OnChanges, OnInit } from '@angular/core';

/** Stroke paths (Lucide-style), viewBox 0 0 24 24 */
const ICONS: Record<string, string[]> = {
  dashboard: [
    'M3 3h7v9H3z',
    'M14 3h7v5h-7z',
    'M14 12h7v9h-7z',
    'M3 16h7v5H3z',
  ],
  products: [
    'm16.5 9.4-9-5.19',
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    'M3.27 6.96 12 12.01l8.73-5.05',
    'M12 22.08V12',
  ],
  sales: ['M16 7h6v6', 'm22 7-8.5 8.5-5-5L2 17'],
  fees: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  subscriptions: [
    'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8',
    'M3 3v5h5',
  ],
  quizzes: [
    'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3',
    'M12 17h.01',
    'M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z',
  ],
  affiliates: [
    'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
    'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  ],
  flows: ['M22 12h-4l-3 9L9 3l-3 9H2'],
  reports: ['M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  withdrawals: ['M12 5v14', 'm19 12-7 7-7-7'],
  webhooks: [
    'M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2',
    'm6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06',
    'm12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8',
  ],
  revenue: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  conversion: ['M5 12h14', 'm12 5 7 7-7 7'],
  ticket: [
    'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z',
  ],
  users: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  trendUp: ['M16 7h6v6', 'm22 7-8.5 8.5-5-5L2 17'],
  trendDown: ['M16 17h6v-6', 'm22 17-8.5-8.5-5 5L2 7'],
  check: ['m5 13 4 4L19 7'],
  alert: [
    'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
    'M12 9v4',
    'M12 17h.01',
  ],
  send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
  eye: [
    'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  spark: [
    'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
  ],
  wallet: [
    'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1',
    'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
  ],
  bolt: ['M13 2 3 14h9l-1 8 10-12h-9l1-8z'],
  cart: [
    'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z',
    'M3 6h18',
    'M16 10a4 4 0 0 1-8 0',
  ],
  shield: [
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  ],
  plus: ['M5 12h14', 'M12 5v14'],
  message: ['M7.9 20A9 9 0 1 0 4 16.1L2 22z'],
  zap: [
    'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  ],
  refresh: [
    'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
    'M21 3v5h-5',
    'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
    'M8 16H3v5',
  ],
};

/** Manual optical nudges (viewBox units) after path-bbox centering */
const OPTICAL_NUDGE: Record<string, [number, number]> = {
  check: [0, 0.25],
  send: [-0.35, 0.35],
  spark: [0, 0.15],
  conversion: [-0.35, 0],
  trendUp: [-0.15, 0.2],
  trendDown: [-0.15, -0.2],
};

const transformCache = new Map<string, string>();

function opticalTransform(name: string, paths: string[]): string {
  const cached = transformCache.get(name);
  if (cached !== undefined) return cached;

  let dx = 0;
  let dy = 0;

  if (typeof document !== 'undefined') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    svg.style.pointerEvents = 'none';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (const d of paths) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      g.appendChild(path);
    }
    svg.appendChild(g);
    document.body.appendChild(svg);
    try {
      const box = g.getBBox();
      if (box.width > 0 && box.height > 0) {
        dx = 12 - (box.x + box.width / 2);
        dy = 12 - (box.y + box.height / 2);
      }
    } catch {
      /* ignore measurement failures during SSR/tests */
    } finally {
      svg.remove();
    }
  }

  const nudge = OPTICAL_NUDGE[name] ?? [0, 0];
  dx += nudge[0];
  dy += nudge[1];

  const value =
    Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05
      ? ''
      : `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`;
  transformCache.set(name, value);
  return value;
}

@Component({
  selector: 'bp-icon',
  standalone: true,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      stroke="currentColor"
      [attr.stroke-width]="stroke"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g [attr.transform]="transform">
        @for (d of paths; track d) {
          <path [attr.d]="d" />
        }
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: inline-grid !important;
      place-items: center;
      flex: 0 0 auto;
      width: var(--bp-icon-size, 18px);
      height: var(--bp-icon-size, 18px);
      min-width: var(--bp-icon-size, 18px);
      min-height: var(--bp-icon-size, 18px);
      margin: 0;
      padding: 0;
      line-height: 0;
      vertical-align: middle;
      color: inherit;
      box-sizing: border-box;
      overflow: visible;
    }

    :host svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
  `,
})
export class BpIconComponent implements OnInit, OnChanges {
  /** Optional explicit size in px. When omitted, CSS `--bp-icon-size` controls sizing. */
  @Input() size: string | number | null = null;
  @Input({ required: true }) name!: string;
  @Input() stroke: string | number = 1.75;

  transform = '';

  @HostBinding('style.--bp-icon-size')
  get hostSize(): string | null {
    if (this.size === null || this.size === undefined || this.size === '') return null;
    const n = Number(this.size);
    return Number.isFinite(n) ? `${n}px` : String(this.size);
  }

  get paths() {
    return ICONS[this.name] ?? ICONS['spark'];
  }

  ngOnInit() {
    this.refreshTransform();
  }

  ngOnChanges() {
    this.refreshTransform();
  }

  private refreshTransform() {
    if (!this.name) return;
    this.transform = opticalTransform(this.name, this.paths);
  }
}
