import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Product, ProductsService } from '../../core/products.service';
import { apiErrorMessage } from '../../shared/api-error';
import { formatBrlFromCents } from '../../shared/money';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  products = signal<Product[]>([]);
  error = signal('');
  copiedId = signal<string | null>(null);
  loading = signal(true);
  readonly formatBrl = formatBrlFromCents;

  constructor(
    private readonly productsService: ProductsService,
    readonly auth: AuthService,
  ) {}

  ngOnInit() {
    this.productsService.list().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Não foi possível carregar os produtos'));
        this.loading.set(false);
      },
    });
  }

  absoluteLink(link: string) {
    if (!isPlatformBrowser(this.platformId)) {
      return link;
    }
    return `${window.location.origin}${link}`;
  }

  async copyLink(product: Product) {
    if (!isPlatformBrowser(this.platformId)) return;
    const url = this.absoluteLink(product.link);
    try {
      await navigator.clipboard.writeText(url);
      this.copiedId.set(product.id);
      setTimeout(() => {
        if (this.copiedId() === product.id) {
          this.copiedId.set(null);
        }
      }, 1500);
    } catch {
      this.error.set('Não foi possível copiar o link');
    }
  }
}
