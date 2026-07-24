import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiItem, PlatformService } from '../../core/platform.service';
import { BpIconComponent } from '../../shared/icon.component';
import { apiErrorMessage } from '../../shared/api-error';
import { formatBrlFromCents } from '../../shared/money';

@Component({
  selector: 'app-internal-dashboard',
  standalone: true,
  imports: [RouterLink, BpIconComponent],
  template: `
    <section class="workspace">
      <header class="page-header">
        <div>
          <p class="eyebrow">Visão geral</p>
          <h1>Dashboard</h1>
          <p class="muted">Acompanhe o desempenho da sua operação.</p>
        </div>
        <a class="btn" routerLink="/app/products/new"><bp-icon name="spark" /> Criar produto</a>
      </header>
      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (loading()) {
        <p class="muted">Carregando indicadores...</p>
      } @else {
        <div class="stats">
          @for (metric of heroMetrics(); track metric.label) {
            <article [class]="'metric ' + metric.tone">
              <div class="metric-top">
                <span class="metric-label">{{ metric.label }}</span>
                <div class="metric-icon"><bp-icon [name]="metric.icon" /></div>
              </div>
              <strong class="metric-value">{{ metric.value }}</strong>
              <span class="metric-delta" [class.up]="metric.deltaTone === 'up'" [class.down]="metric.deltaTone === 'down'">
                <bp-icon [name]="metric.deltaTone === 'down' ? 'trendDown' : 'trendUp'" />
                {{ metric.hint }}
              </span>
            </article>
          }
        </div>

        <div class="chart-grid">
          <section class="chart-board">
            <div class="board-head">
              <div>
                <h2>Receita por dia</h2>
                <p class="muted">Evolução no período</p>
              </div>
              <div class="metric-icon"><bp-icon name="revenue" /></div>
            </div>
            @if (series().length) {
              <svg class="chart-svg" viewBox="0 0 640 240" role="img" aria-label="Gráfico de receita diária">
                <defs>
                  <linearGradient id="bpAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#f5c518" stop-opacity="0.35"></stop>
                    <stop offset="100%" stop-color="#f5c518" stop-opacity="0"></stop>
                  </linearGradient>
                </defs>
                <g class="chart-grid">
                  @for (y of gridYs; track y) {
                    <line [attr.x1]="40" [attr.x2]="620" [attr.y1]="y" [attr.y2]="y"></line>
                  }
                </g>
                <path class="chart-area" [attr.d]="areaPath()"></path>
                <path class="chart-line" [attr.d]="linePath()"></path>
                @for (point of chartPoints(); track point.date; let i = $index) {
                  <circle class="chart-dot" [attr.cx]="point.x" [attr.cy]="point.y" r="4">
                    <title>{{ point.date }}: {{ money(point.value) }}</title>
                  </circle>
                  @if (i === 0 || i === chartPoints().length - 1 || i % Math.ceil(chartPoints().length / 6) === 0) {
                    <text class="chart-label" [attr.x]="point.x" y="228" text-anchor="middle">{{ point.date.slice(5) }}</text>
                  }
                }
              </svg>
              <p class="series-hint" [class.num-up]="seriesDelta() >= 0" [class.num-down]="seriesDelta() < 0">
                <bp-icon [name]="seriesDelta() >= 0 ? 'trendUp' : 'trendDown'" />
                {{ seriesDelta() >= 0 ? 'Alta' : 'Queda' }} de {{ money(Math.abs(seriesDelta())) }} vs. primeiro dia do período
              </p>
            } @else {
              <p class="muted empty-chart">Ainda não há vendas pagas no período.</p>
            }
          </section>

          <section class="chart-board">
            <div class="board-head">
              <div>
                <h2>Mix da operação</h2>
                <p class="muted">Distribuição relativa dos indicadores</p>
              </div>
              <div class="metric-icon"><bp-icon name="reports" /></div>
            </div>
            <div class="rings">
              <svg viewBox="0 0 160 160" class="ring" aria-hidden="true">
                <circle class="ring-track" cx="80" cy="80" r="58"></circle>
                <circle
                  class="ring-value"
                  cx="80"
                  cy="80"
                  r="58"
                  [attr.stroke-dasharray]="ringDash(data()['paidTransactions'] || 0, ringMax())"
                ></circle>
                <text x="80" y="76" text-anchor="middle" class="ring-num">{{ data()['paidTransactions'] || 0 }}</text>
                <text x="80" y="96" text-anchor="middle" class="ring-cap">pagas</text>
              </svg>
              <div class="mix-bars">
                @for (row of mixRows(); track row.label) {
                  <div class="funnel-row" [class.tone-down]="row.tone === 'down'" [class.tone-up]="row.tone === 'up'">
                    <span><bp-icon [name]="row.icon" /> {{ row.label }}</span>
                    <div class="funnel-track"><div class="funnel-fill" [class.fill-down]="row.tone === 'down'" [style.width.%]="row.pct"></div></div>
                    <strong>{{ row.display }}</strong>
                  </div>
                }
              </div>
            </div>
          </section>
        </div>
      }
    </section>
  `,
  styles: `
    .btn bp-icon { --bp-icon-size: 14px; width: 14px; height: 14px; }
    .board-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .chart-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 36px;
      margin-top: 12px;
      animation: bp-rise 0.5s var(--bp-ease) both;
    }
    .empty-chart { margin-top: 28px; }
    .series-hint {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: 14px 0 0;
      font-size: 13px;
      font-weight: 700;
    }
    .series-hint bp-icon { --bp-icon-size: 14px; width: 14px; height: 14px; }
    .rings {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 20px;
      align-items: center;
      margin-top: 18px;
    }
    .ring { width: 160px; height: 160px; }
    .ring-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 12; }
    .ring-value {
      fill: none;
      stroke: var(--bp-banana);
      stroke-width: 12;
      stroke-linecap: round;
      transform: rotate(-90deg);
      transform-origin: 80px 80px;
      transition: stroke-dasharray 0.6s var(--bp-ease);
    }
    .ring-num {
      fill: var(--bp-cream);
      font-size: 28px;
      font-family: var(--bp-font-display);
      font-weight: 700;
    }
    .ring-cap {
      fill: var(--bp-cream-muted);
      font-size: 12px;
      font-family: var(--bp-font-body);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .mix-bars { display: grid; gap: 14px; }
    .funnel-row span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .funnel-row bp-icon { --bp-icon-size: 14px; width: 14px; height: 14px; }
    .funnel-row.tone-up strong { color: var(--bp-success); }
    .funnel-row.tone-down strong { color: var(--bp-danger); }
    .fill-down { background: linear-gradient(90deg, #c43c3c, var(--bp-danger)) !important; }
    @media (max-width: 1100px) {
      .chart-grid { gap: 28px; }
    }

    @media (max-width: 960px) {
      .chart-grid { grid-template-columns: 1fr; gap: 32px; }
      .rings { grid-template-columns: 1fr; justify-items: center; }
      .mix-bars { width: 100%; }
    }

    @media (max-width: 560px) {
      .board-head {
        flex-wrap: wrap;
      }
      .ring {
        width: min(160px, 70vw);
        height: auto;
        aspect-ratio: 1;
      }
      .chart-label { font-size: 10px; }
      .series-hint {
        flex-wrap: wrap;
        font-size: 12px;
      }
    }
  `,
})
export class InternalDashboardComponent implements OnInit {
  readonly data = signal<ApiItem>({});
  readonly loading = signal(true);
  readonly error = signal('');
  readonly series = computed(() => (this.data()['series'] ?? []) as ApiItem[]);
  readonly money = formatBrlFromCents;
  readonly Math = Math;
  readonly gridYs = [30, 80, 130, 180];

  private readonly chart = { left: 40, right: 620, top: 24, bottom: 190 };

  constructor(private readonly platform: PlatformService) {}

  ngOnInit() {
    this.platform.dashboard().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(apiErrorMessage(error, 'Não foi possível carregar o dashboard'));
        this.loading.set(false);
      },
    });
  }

  heroMetrics() {
    const conversion = Number(this.data()['conversionRate'] || 0);
    const revenue = Number(this.data()['revenueCents'] || 0);
    const paid = Number(this.data()['paidTransactions'] || 0);
    const ticket = Number(this.data()['averageTicketCents'] || 0);
    const subs = Number(this.data()['activeSubscriptions'] || 0);
    const products = Number(this.data()['activeProducts'] || 0);
    return [
      {
        label: 'Receita',
        value: this.money(revenue),
        icon: 'revenue',
        tone: 'tone-money',
        deltaTone: revenue > 0 ? 'up' : 'down',
        hint: revenue > 0 ? 'Entrada confirmada' : 'Sem receita no período',
      },
      {
        label: 'Transações pagas',
        value: String(paid),
        icon: 'check',
        tone: paid > 0 ? 'tone-up' : 'tone-warn',
        deltaTone: paid > 0 ? 'up' : 'down',
        hint: paid > 0 ? 'Pagamentos aprovados' : 'Nenhuma paga',
      },
      {
        label: 'Conversão',
        value: this.percent(conversion),
        icon: 'conversion',
        tone: conversion >= 0.05 ? 'tone-up' : conversion > 0 ? 'tone-warn' : 'tone-down',
        deltaTone: conversion >= 0.05 ? 'up' : 'down',
        hint: conversion >= 0.05 ? 'Acima do piso saudável' : 'Espaço para melhorar',
      },
      {
        label: 'Ticket médio',
        value: this.money(ticket),
        icon: 'ticket',
        tone: 'tone-money',
        deltaTone: ticket > 0 ? 'up' : 'down',
        hint: 'Valor médio por venda',
      },
      {
        label: 'Assinaturas ativas',
        value: String(subs),
        icon: 'subscriptions',
        tone: subs > 0 ? 'tone-up' : 'tone-warn',
        deltaTone: subs > 0 ? 'up' : 'down',
        hint: subs > 0 ? 'Recorrência viva' : 'Sem ativos',
      },
      {
        label: 'Produtos ativos',
        value: String(products),
        icon: 'products',
        tone: 'tone-info',
        deltaTone: products > 0 ? 'up' : 'down',
        hint: 'Catálogo publicado',
      },
    ];
  }

  percent(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(value);
  }

  chartPoints() {
    const values = this.series().map((point) => Number(point['revenueCents'] || 0));
    const max = Math.max(1, ...values);
    const count = Math.max(values.length, 1);
    const { left, right, top, bottom } = this.chart;
    const spanX = right - left;
    const spanY = bottom - top;
    return this.series().map((point, index) => {
      const value = Number(point['revenueCents'] || 0);
      const x = left + (count === 1 ? spanX / 2 : (index / (count - 1)) * spanX);
      const y = bottom - (value / max) * spanY;
      return { x, y, value, date: String(point['date'] || '') };
    });
  }

  linePath() {
    const points = this.chartPoints();
    if (!points.length) return '';
    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(' ');
  }

  areaPath() {
    const points = this.chartPoints();
    if (!points.length) return '';
    const line = this.linePath();
    const last = points[points.length - 1];
    const first = points[0];
    return `${line} L${last.x.toFixed(1)} ${this.chart.bottom} L${first.x.toFixed(1)} ${this.chart.bottom} Z`;
  }

  seriesDelta() {
    const points = this.series();
    if (points.length < 2) return 0;
    const first = Number(points[0]['revenueCents'] || 0);
    const last = Number(points[points.length - 1]['revenueCents'] || 0);
    return last - first;
  }

  ringMax() {
    return Math.max(
      1,
      Number(this.data()['paidTransactions'] || 0),
      Number(this.data()['activeSubscriptions'] || 0),
      Number(this.data()['activeProducts'] || 0),
    );
  }

  ringDash(value: number, max: number) {
    const circumference = 2 * Math.PI * 58;
    const pct = Math.min(1, Number(value) / Math.max(max, 1));
    return `${circumference * pct} ${circumference}`;
  }

  mixRows() {
    const paid = Number(this.data()['paidTransactions'] || 0);
    const subs = Number(this.data()['activeSubscriptions'] || 0);
    const products = Number(this.data()['activeProducts'] || 0);
    const conversion = Number(this.data()['conversionRate'] || 0);
    const max = Math.max(paid, subs, products, 1);
    return [
      { label: 'Vendas', display: String(paid), pct: (paid / max) * 100, icon: 'sales', tone: paid > 0 ? 'up' : 'down' },
      { label: 'Assinaturas', display: String(subs), pct: (subs / max) * 100, icon: 'subscriptions', tone: subs > 0 ? 'up' : 'down' },
      { label: 'Produtos', display: String(products), pct: (products / max) * 100, icon: 'products', tone: 'up' },
      {
        label: 'Conversão',
        display: this.percent(conversion),
        pct: Math.min(100, conversion * 100),
        icon: 'conversion',
        tone: conversion >= 0.05 ? 'up' : 'down',
      },
    ];
  }
}
