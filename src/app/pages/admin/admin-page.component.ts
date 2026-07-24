import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiItem, PlatformService } from '../../core/platform.service';
import { apiErrorMessage } from '../../shared/api-error';
import { formatBrlFromCents } from '../../shared/money';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  template: `
    <section class="workspace">
      <header class="page-header"><div><p class="eyebrow">Administração global</p><h1>{{ title() }}</h1><p class="muted">Operação auditável de toda a plataforma.</p></div><button class="btn secondary" (click)="load()">Atualizar</button></header>
      @if(error()){<p class="error">{{ error() }}</p>}
      @if(loading()){<div class="panel">Carregando...</div>}
      @else if(resource() === 'overview'){
        <div class="summary">@for(card of overviewCards(); track card.label){<article><span class="metric-label">{{ card.label }}</span><strong>{{ card.money ? money(card.value) : card.value }}</strong></article>}</div>
      } @else if(resource() === 'accounts'){
        <div class="grid">@for(item of items(); track item.id){<article class="panel"><span class="badge">{{ item.status }}</span><h2>{{ item.name }}</h2><p>{{ item.owner?.name }} · {{ item.owner?.email }}</p><p class="muted">{{ item._count?.products }} produtos · {{ item._count?.orders }} pedidos · {{ item._count?.subscriptions }} assinaturas</p><div class="actions"><button class="link" (click)="toggleAccount(item)">{{ item.status === 'ACTIVE' ? 'Suspender' : 'Ativar' }}</button><button class="link" (click)="configureFee(item.id)">Configurar taxa</button></div></article>}</div>
      } @else if(resource() === 'transactions'){
        <div class="panel table-wrap"><table><thead><tr><th>Conta</th><th>Data</th><th>Cliente</th><th>Produto</th><th>Status</th><th>Valor</th></tr></thead><tbody>@for(item of items(); track item.id){<tr><td>{{ item.account?.name }}</td><td>{{ date(item.createdAt) }}</td><td>{{ item.customer?.email || '-' }}</td><td>{{ item.product?.title }}</td><td>{{ item.status }}</td><td>{{ money(item.amountCents) }}</td></tr>}</tbody></table></div>
      } @else if(resource() === 'withdrawals'){
        <div class="panel table-wrap"><table><thead><tr><th>Conta</th><th>Solicitante</th><th>Valor</th><th>Chave Pix</th><th>Status</th><th>Ações</th></tr></thead><tbody>@for(item of items(); track item.id){<tr><td>{{ item.account?.name }}</td><td>{{ item.requestedBy?.email }}</td><td>{{ money(item.amountCents) }}</td><td>{{ item.pixKey }}</td><td>{{ item.status }}</td><td>@if(item.status === 'REQUESTED'){<button class="link" (click)="review(item.id, 'APPROVED')">Aprovar</button> · <button class="link danger" (click)="review(item.id, 'REJECTED')">Rejeitar</button>} @else if(item.status === 'APPROVED'){<button class="link" (click)="review(item.id, 'PAID')">Marcar pago</button>}</td></tr>}</tbody></table></div>
      } @else if(resource() === 'audit'){
        <div class="panel table-wrap"><table><thead><tr><th>Data</th><th>Ator</th><th>Ação</th><th>Entidade</th></tr></thead><tbody>@for(item of items(); track item.id){<tr><td>{{ date(item.createdAt) }}</td><td>{{ item.actor?.email || 'Sistema' }}</td><td>{{ item.action }}</td><td>{{ item.entityType }} / {{ item.entityId }}</td></tr>} @empty{<tr><td colspan="4">Nenhum evento de auditoria.</td></tr>}</tbody></table></div>
      }
    </section>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
      gap: 0;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .grid > .panel {
      background: transparent;
      border: 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      border-radius: 0;
      padding: 18px 16px 18px 0;
      min-width: 0;
    }
    .actions { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px; }
    .link { border: 0; background: transparent; color: var(--bp-banana); padding: 0; cursor: pointer; font-weight: 600; min-height: 44px; }
    .danger { color: var(--bp-danger); }

    @media (max-width: 640px) {
      .grid { grid-template-columns: 1fr; }
      .grid > .panel { padding-right: 0; }
      .page-header .btn { width: 100%; }
    }
  `,
})
export class AdminPageComponent implements OnInit, OnDestroy {
  readonly resource = signal('overview');
  readonly data = signal<ApiItem>({});
  readonly items = signal<ApiItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly money = formatBrlFromCents;
  private subscription?: Subscription;

  constructor(private readonly route: ActivatedRoute, private readonly platform: PlatformService) {}

  ngOnInit() { this.subscription = this.route.data.subscribe((data) => { this.resource.set(data['resource']); this.load(); }); }
  ngOnDestroy() { this.subscription?.unsubscribe(); }
  title() { return ({ overview: 'Visão geral', accounts: 'Contas e produtores', transactions: 'Transações', withdrawals: 'Saques', audit: 'Auditoria' } as Record<string, string>)[this.resource()] ?? 'Administração'; }

  load() {
    this.loading.set(true); this.error.set('');
    this.platform.admin(this.resource()).subscribe({
      next: (value) => { if (Array.isArray(value)) this.items.set(value); else this.data.set(value); this.loading.set(false); },
      error: (error) => { this.error.set(apiErrorMessage(error, 'Não foi possível carregar a administração')); this.loading.set(false); },
    });
  }

  overviewCards() {
    return [
      { label: 'Contas', value: this.data()['accounts'] || 0 },
      { label: 'Produtos', value: this.data()['products'] || 0 },
      { label: 'Transações', value: this.data()['transactions'] || 0 },
      { label: 'Receita', value: this.data()['revenueCents'] || 0, money: true },
      { label: 'Taxas', value: this.data()['feesCents'] || 0, money: true },
      { label: 'Assinaturas ativas', value: this.data()['activeSubscriptions'] || 0 },
      { label: 'Saques pendentes', value: this.data()['pendingWithdrawals'] || 0 },
    ];
  }

  toggleAccount(item: ApiItem) { this.platform.setAccountStatus(item.id, item.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE').subscribe(() => this.load()); }
  configureFee(accountId: string) {
    const method = prompt('Método: PIX, CARD ou BOLETO', 'PIX');
    const percentage = prompt('Percentual (ex.: 4.99)', '4.99');
    const fixed = prompt('Tarifa fixa em centavos', '0');
    if (!method || percentage === null || fixed === null) return;
    this.platform.setFee(accountId, { method: method.toUpperCase(), percentageBps: Math.round(Number(percentage) * 100), fixedCents: Number(fixed) }).subscribe(() => this.load());
  }
  review(id: string, status: string) { const reason = status === 'REJECTED' ? prompt('Motivo da rejeição') ?? undefined : undefined; this.platform.reviewWithdrawal(id, { status, reason }).subscribe(() => this.load()); }
  date(value: string) { return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '-'; }
}
