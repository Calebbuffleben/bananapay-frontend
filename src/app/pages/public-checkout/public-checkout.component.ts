import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ProductsService,
  PublicProduct,
} from '../../core/products.service';
import { apiErrorMessage } from '../../shared/api-error';
import { formatBrlFromCents } from '../../shared/money';

@Component({
  selector: 'app-public-checkout',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './public-checkout.component.html',
  styleUrl: './public-checkout.component.css',
})
export class PublicCheckoutComponent implements OnInit {
  product = signal<PublicProduct | null>(null);
  error = signal('');
  statusMessage = signal('');
  subscriptionReturn = signal(false);
  loading = signal(true);
  buying = signal(false);
  buyer = { name: '', email: '', phone: '', whatsappOptIn: false };
  method: 'PIX' | 'CARD' | 'BOLETO' = 'PIX';
  selectedOfferIds: string[] = [];
  readonly formatBrl = formatBrlFromCents;

  constructor(
    private readonly productsService: ProductsService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    const status = this.route.snapshot.queryParamMap.get('status');
    const affiliationSlug = this.route.snapshot.queryParamMap.get('aff');
    if (affiliationSlug) this.rememberAffiliation(affiliationSlug);
    this.statusMessage.set(this.messageForStatus(status));
    this.subscriptionReturn.set(status === 'subscription');

    if (!slug) {
      this.error.set('Produto inválido');
      this.loading.set(false);
      return;
    }

    this.productsService.getBySlug(slug).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Produto não encontrado'));
        this.loading.set(false);
      },
    });
  }

  buy() {
    const product = this.product();
    if (!product || this.buying()) return;

    this.buying.set(true);
    this.error.set('');
    if (!this.buyer.name.trim() || !this.buyer.email.trim()) {
      this.error.set('Informe seu nome e e-mail');
      return;
    }
    this.productsService.checkout(product.id, {
      ...this.buyer,
      method: this.method,
      offerIds: this.selectedOfferIds,
      affiliationSlug:
        this.route.snapshot.queryParamMap.get('aff') ??
        this.readAffiliation() ??
        undefined,
    }).subscribe({
      next: ({ initPoint }) => {
        if (!initPoint) {
          this.buying.set(false);
          this.error.set('Checkout indisponível no momento');
          return;
        }
        window.location.href = initPoint;
      },
      error: (err) => {
        this.buying.set(false);
        this.error.set(apiErrorMessage(err, 'Não foi possível abrir o checkout'));
      },
    });
  }

  subscribe(planId: string) {
    if (!this.buyer.name.trim() || !this.buyer.email.trim()) {
      this.error.set('Informe seu nome e e-mail');
      return;
    }
    this.buying.set(true);
    this.productsService.subscriptionCheckout(planId, this.buyer).subscribe({
      next: ({ initPoint }) => {
        if (initPoint) window.location.href = initPoint;
        else {
          this.buying.set(false);
          this.error.set('Assinatura indisponível no momento');
        }
      },
      error: (error) => {
        this.buying.set(false);
        this.error.set(apiErrorMessage(error, 'Não foi possível assinar'));
      },
    });
  }

  toggleOffer(id: string, checked: boolean) {
    this.selectedOfferIds = checked
      ? [...this.selectedOfferIds, id]
      : this.selectedOfferIds.filter((offerId) => offerId !== id);
  }

  private messageForStatus(status: string | null): string {
    switch (status) {
      case 'success':
        return 'Pagamento aprovado. Obrigado pela compra!';
      case 'failure':
        return 'Pagamento não concluído. Você pode tentar novamente.';
      case 'pending':
        return 'Pagamento em análise. Avisaremos quando for confirmado.';
      case 'subscription':
        return 'Assinatura iniciada. Entre na sua conta para acompanhar o status.';
      default:
        return '';
    }
  }

  private rememberAffiliation(slug: string) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    document.cookie = `checkout_aff=${encodeURIComponent(slug)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  private readAffiliation() {
    const cookie = document.cookie
      .split('; ')
      .find((item) => item.startsWith('checkout_aff='));
    return cookie ? decodeURIComponent(cookie.split('=')[1] ?? '') : null;
  }
}
