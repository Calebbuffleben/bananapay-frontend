import { Component, DestroyRef, HostListener, effect, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { PlatformService } from '../core/platform.service';
import { BpIconComponent } from '../shared/icon.component';

type NavItem = { label: string; path: string; icon: string };
type NavGroup = { label: string; items: NavItem[] };

@Component({
  selector: 'app-internal-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BpIconComponent],
  template: `
    <div class="shell" [class.menu-open]="menuOpen()">
      @if (menuOpen()) {
        <button class="scrim" type="button" aria-label="Fechar menu" (click)="menuOpen.set(false)"></button>
      }

      <aside class="sidebar" [class.open]="menuOpen()">
        <div class="sidebar-top">
          <a class="brand" [routerLink]="isAdmin ? '/admin/dashboard' : '/app/dashboard'" (click)="menuOpen.set(false)">
            <span class="wordmark"><span class="nana">nana</span><span class="pay">pay</span></span>
          </a>
          <p class="area">{{ isAdmin ? 'Admin' : 'Produtor' }}</p>
        </div>

        <nav aria-label="Menu principal">
          @for (group of groups(); track group.label) {
            <div class="group">
              <p class="group-label">{{ group.label }}</p>
              @for (item of group.items; track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="item.path.endsWith('dashboard') ? { exact: true } : { exact: false }"
                  (click)="menuOpen.set(false)"
                >
                  <bp-icon [name]="item.icon" />
                  <span>{{ item.label }}</span>
                </a>
              }
            </div>
          }
        </nav>

        <div class="sidebar-foot">
          @if (!isAdmin && auth.user()?.role === 'PLATFORM_ADMIN') {
            <a class="switch" routerLink="/admin/dashboard">Administração →</a>
          }
          @if (isAdmin) {
            <a class="switch" routerLink="/app/dashboard">Área do produtor →</a>
          }
          <div class="user">
            <div>
              <strong>{{ auth.user()?.name || 'Conta' }}</strong>
              <small>{{ auth.user()?.email }}</small>
            </div>
            <button type="button" class="logout" (click)="auth.logout()">Sair</button>
          </div>
        </div>
      </aside>

      <div class="content">
        <header class="mobile-header">
          <button
            type="button"
            aria-label="Abrir menu"
            [attr.aria-expanded]="menuOpen()"
            (click)="menuOpen.set(!menuOpen())"
          >
            <span></span><span></span>
          </button>
          <strong class="wordmark"><span class="nana">nana</span><span class="pay">pay</span></strong>
        </header>
        <main>
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; }

    .shell {
      display: grid;
      grid-template-columns: 232px minmax(0, 1fr);
      min-height: 100dvh;
      width: 100%;
      max-width: 100vw;
    }

    .scrim {
      display: none;
    }

    .sidebar {
      position: sticky;
      top: 0;
      height: 100dvh;
      max-height: 100dvh;
      display: flex;
      flex-direction: column;
      padding: 28px 0 20px;
      background: #0a0a0a;
      border-right: 1px solid rgba(245, 197, 24, 0.12);
      z-index: 30;
      overflow: hidden;
    }

    .sidebar-top {
      padding: 0 22px 22px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 8px;
    }

    .brand {
      text-decoration: none;
      color: inherit;
      display: inline-block;
    }

    .wordmark {
      font-family: var(--bp-font-display);
      font-size: 1.45rem;
      font-weight: 800;
      letter-spacing: -0.045em;
      line-height: 1;
    }

    .nana { color: var(--bp-banana); }
    .pay { color: var(--bp-cream); }

    .area {
      margin: 10px 0 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--bp-cream-muted);
    }

    nav {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      padding: 8px 12px 16px;
      min-height: 0;
    }

    .group { margin-bottom: 18px; }

    .group-label {
      margin: 0 10px 8px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(184, 178, 159, 0.55);
    }

    nav a {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px 9px 14px;
      margin-bottom: 2px;
      border-radius: 8px;
      color: var(--bp-cream-muted);
      text-decoration: none;
      font-size: 0.92rem;
      font-weight: 500;
      letter-spacing: -0.01em;
      transition: color 0.16s var(--bp-ease), background 0.16s var(--bp-ease);
    }

    nav a bp-icon {
      --bp-icon-size: 16px;
      width: 16px;
      height: 16px;
      min-width: 16px;
      min-height: 16px;
      opacity: 0.85;
      flex-shrink: 0;
    }

    nav a:hover {
      color: var(--bp-cream);
      background: rgba(255, 255, 255, 0.03);
      text-decoration: none;
    }

    nav a:hover bp-icon { opacity: 1; }

    nav a.active {
      color: var(--bp-banana);
      background: rgba(245, 197, 24, 0.08);
      font-weight: 700;
    }

    nav a.active bp-icon { opacity: 1; }

    nav a.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background: var(--bp-banana);
      border-radius: 1px;
    }

    .sidebar-foot {
      padding: 16px 16px 4px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: grid;
      gap: 12px;
    }

    .switch {
      color: var(--bp-banana);
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
      padding: 0 6px;
    }

    .user {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 8px;
    }

    .user strong {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--bp-cream);
      font-family: var(--bp-font-body);
      letter-spacing: 0;
    }

    .user small {
      display: block;
      margin-top: 2px;
      font-size: 11px;
      color: var(--bp-cream-muted);
      max-width: min(140px, 38vw);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user > div {
      min-width: 0;
    }

    .logout {
      border: 0;
      background: transparent;
      color: var(--bp-cream-muted);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      padding: 6px 0;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .logout:hover { color: var(--bp-banana); }

    .content { min-width: 0; display: flex; flex-direction: column; width: 100%; }
    main { min-width: 0; flex: 1; width: 100%; }
    .mobile-header { display: none; }

    @media (max-width: 1100px) {
      .shell { grid-template-columns: 212px minmax(0, 1fr); }
    }

    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .shell.menu-open { overflow: hidden; }

      .scrim {
        display: block;
        position: fixed;
        inset: 0;
        border: 0;
        background: rgba(0, 0, 0, 0.62);
        z-index: 40;
        cursor: pointer;
        touch-action: none;
      }

      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        width: min(300px, calc(100vw - 48px));
        height: 100dvh;
        max-height: 100dvh;
        padding-top: max(20px, env(safe-area-inset-top, 0px));
        padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
        transform: translateX(-105%);
        transition: transform 0.28s var(--bp-ease);
        box-shadow: none;
        z-index: 50;
      }

      .sidebar.open { transform: translateX(0); }

      .mobile-header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding:
          max(12px, env(safe-area-inset-top, 0px))
          max(16px, env(safe-area-inset-right, 0px))
          12px
          max(16px, env(safe-area-inset-left, 0px));
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        position: sticky;
        top: 0;
        z-index: 20;
        background: rgba(10, 10, 10, 0.94);
        backdrop-filter: blur(10px);
      }

      .mobile-header button {
        width: 44px;
        height: 44px;
        border: 0;
        background: transparent;
        display: grid;
        gap: 7px;
        align-content: center;
        justify-content: start;
        cursor: pointer;
        padding: 0;
        flex-shrink: 0;
      }

      .mobile-header button span {
        display: block;
        height: 2px;
        background: var(--bp-cream);
        width: 22px;
      }

      .mobile-header .wordmark {
        font-size: clamp(1.05rem, 4vw, 1.25rem);
        min-width: 0;
      }
    }

    @media (max-width: 480px) {
      .sidebar {
        width: min(100vw - 40px, 300px);
      }

      .user {
        flex-wrap: wrap;
      }
    }
  `,
})
export class InternalShellComponent {
  readonly menuOpen = signal(false);
  readonly isAdmin: boolean;
  readonly groups = signal<NavGroup[]>([]);

  constructor(
    readonly auth: AuthService,
    router: Router,
    platform: PlatformService,
    destroyRef: DestroyRef,
  ) {
    this.isAdmin = router.url.startsWith('/admin');

    effect(() => {
      const open = this.menuOpen();
      document.body.style.overflow = open ? 'hidden' : '';
    });

    destroyRef.onDestroy(() => {
      document.body.style.overflow = '';
    });

    router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(() => this.menuOpen.set(false));

    if (this.isAdmin) {
      this.groups.set([
        {
          label: 'Operação',
          items: [
            { label: 'Visão geral', path: '/admin/dashboard', icon: 'dashboard' },
            { label: 'Contas', path: '/admin/accounts', icon: 'users' },
            { label: 'Transações', path: '/admin/transactions', icon: 'sales' },
            { label: 'Saques', path: '/admin/withdrawals', icon: 'withdrawals' },
          ],
        },
        {
          label: 'Sistema',
          items: [{ label: 'Auditoria', path: '/admin/audit', icon: 'shield' }],
        },
      ]);
      return;
    }

    const all: NavGroup[] = [
      {
        label: 'Operação',
        items: [
          { label: 'Dashboard', path: '/app/dashboard', icon: 'dashboard' },
          { label: 'Produtos', path: '/app/products', icon: 'products' },
          { label: 'Vendas', path: '/app/sales', icon: 'sales' },
          { label: 'Taxas', path: '/app/fees', icon: 'fees' },
          { label: 'Assinaturas', path: '/app/subscriptions', icon: 'subscriptions' },
        ],
      },
      {
        label: 'Crescimento',
        items: [
          { label: 'Quizzes', path: '/app/quizzes', icon: 'quizzes' },
          { label: 'Afiliados', path: '/app/affiliates', icon: 'affiliates' },
          { label: 'Fluxos', path: '/app/automations/flows', icon: 'flows' },
          { label: 'Relatórios', path: '/app/automations/reports', icon: 'reports' },
        ],
      },
      {
        label: 'Financeiro',
        items: [
          { label: 'Saques', path: '/app/withdrawals', icon: 'withdrawals' },
          { label: 'Webhooks', path: '/app/webhooks', icon: 'webhooks' },
        ],
      },
    ];

    this.groups.set(all);
    platform.features().subscribe({
      next: (features) => {
        this.groups.set(
          all
            .map((group) => ({
              ...group,
              items: group.items.filter((item) => {
                if (item.path.includes('subscriptions')) return features['subscriptions'];
                if (item.path.includes('quizzes')) return features['quizzes'];
                if (item.path.includes('affiliates')) return features['affiliates'];
                if (item.path.includes('automations')) return features['whatsapp'];
                if (item.path.includes('withdrawals')) return features['withdrawals'];
                return true;
              }),
            }))
            .filter((group) => group.items.length > 0),
        );
      },
      error: () => undefined,
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.menuOpen()) this.menuOpen.set(false);
  }
}
