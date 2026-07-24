import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiItem, PlatformService } from '../../core/platform.service';
import { BpIconComponent } from '../../shared/icon.component';
import { apiErrorMessage } from '../../shared/api-error';
import { formatBrlFromCents } from '../../shared/money';

@Component({
  selector: 'app-buyer-account',
  standalone: true,
  imports: [RouterLink, BpIconComponent],
  template: `
    <main class="account">
      <p class="brand-mark compact"><span class="nana">nana</span><span class="pay">pay</span></p>
      <header>
        <div>
          <p class="eyebrow">Minha conta</p>
          <h1>Assinaturas</h1>
          <p class="muted">Acompanhe e gerencie seus planos.</p>
        </div>
        <button class="btn secondary" type="button" (click)="auth.logout()">Sair</button>
      </header>
      @if(error()){<p class="error">{{ error() }}</p>}
      @if(loading()){<p class="muted">Carregando...</p>}
      @else {
        <div class="subscriptions">
          @for(item of subscriptions(); track item.id){
            <article>
              <div>
                <span [class]="'badge ' + statusTone(item.status)"><bp-icon [name]="statusIcon(item.status)" /> {{ item.status }}</span>
                <h2>{{ item.plan?.product?.title }}</h2>
                <p><span class="num-money">{{ money(item.plan?.amountCents || 0) }}</span> · {{ item.plan?.name }}</p>
                <small>Próxima renovação: {{ date(item.currentPeriodEnd) }}</small>
              </div>
              @if(['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(item.status)){
                <button class="cancel" type="button" (click)="cancel(item.id)">Cancelar assinatura</button>
              }
            </article>
          } @empty {
            <div class="empty">
              <h2>Nenhuma assinatura encontrada</h2>
              <p class="muted">Use o mesmo e-mail informado na compra.</p>
              <a class="btn" routerLink="/">Voltar</a>
            </div>
          }
        </div>
      }
    </main>
  `,
  styles: `
    .account {
      max-width: 920px;
      margin: 0 auto;
      padding:
        max(24px, env(safe-area-inset-top, 0px))
        max(16px, env(safe-area-inset-right, 0px))
        max(48px, env(safe-area-inset-bottom, 0px))
        max(16px, env(safe-area-inset-left, 0px));
      width: 100%;
      min-width: 0;
    }
    .brand-mark.compact { margin: 0 0 28px; font-size: clamp(1.8rem, 5vw, 2.3rem); animation: bp-brand 0.55s var(--bp-ease) both; }
    header { display: flex; justify-content: space-between; gap: 24px; align-items: start; margin-bottom: 32px; animation: bp-rise 0.5s var(--bp-ease) both; flex-wrap: wrap; }
    h1 { font-size: clamp(28px, 6vw, 58px); margin: 4px 0; line-height: 1; }
    .subscriptions { display: grid; gap: 0; border-top: 1px solid rgba(255,255,255,0.08); }
    article {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: center;
      padding: 22px 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: transparent;
    }
    article h2 { margin: 10px 0 4px; font-size: 1.35rem; }
    article p, article small { color: var(--bp-cream-muted); display: block; }
    .cancel {
      border: 0;
      border-bottom: 1px solid var(--bp-danger);
      color: var(--bp-danger);
      background: transparent;
      padding: 4px 0;
      border-radius: 0;
      cursor: pointer;
      font-weight: 700;
    }
    .empty { text-align: left; padding: 32px 0; display: grid; gap: 12px; justify-items: start; border-top: 1px solid rgba(255,255,255,0.08); }
    .empty .btn { width: auto; }
    .badge bp-icon { --bp-icon-size: 12px; width: 12px; height: 12px; }
    @media (max-width: 640px) {
      header { flex-direction: column; align-items: stretch; gap: 16px; }
      header .btn { width: 100%; }
      article { align-items: stretch; flex-direction: column; gap: 14px; }
      .cancel { align-self: flex-start; min-height: 44px; }
      .empty .btn { width: 100%; }
    }
  `,
})
export class BuyerAccountComponent implements OnInit {
  readonly subscriptions = signal<ApiItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly money = formatBrlFromCents;

  constructor(
    readonly auth: AuthService,
    private readonly platform: PlatformService,
  ) {}

  ngOnInit() { this.load(); }

  cancel(id: string) {
    if (!confirm('Cancelar esta assinatura?')) return;
    this.platform.cancelBuyerSubscription(id).subscribe({
      next: () => this.load(),
      error: (error) => this.error.set(apiErrorMessage(error, 'Não foi possível cancelar')),
    });
  }

  date(value: string) {
    return value
      ? new Intl.DateTimeFormat('pt-BR').format(new Date(value))
      : '-';
  }

  statusTone(status: string) {
    const value = String(status || '').toLowerCase();
    if (['active', 'trialing'].includes(value)) return 'up';
    if (['cancelled', 'expired'].includes(value)) return 'down';
    if (['past_due', 'pending'].includes(value)) return 'warn';
    return 'info';
  }

  statusIcon(status: string) {
    const value = String(status || '').toLowerCase();
    if (['active', 'trialing'].includes(value)) return 'check';
    if (['cancelled', 'expired'].includes(value)) return 'x';
    if (['past_due'].includes(value)) return 'alert';
    return 'subscriptions';
  }

  private load() {
    this.loading.set(true);
    this.platform.buyerSubscriptions().subscribe({
      next: (items) => { this.subscriptions.set(items); this.loading.set(false); },
      error: (error) => { this.error.set(apiErrorMessage(error, 'Não foi possível carregar suas assinaturas')); this.loading.set(false); },
    });
  }
}
