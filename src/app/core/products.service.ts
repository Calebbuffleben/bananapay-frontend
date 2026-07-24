import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export type Product = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  slug: string;
  link: string;
  salesCount?: number;
  revenueCents?: number;
};

export type PublicProduct = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  slug: string;
  offers: { id: string; name: string; priceCents: number; kind: string }[];
  plans: {
    id: string;
    name: string;
    amountCents: number;
    intervalMonths: number;
  }[];
};

export type ProductInput = {
  title: string;
  description: string;
  priceCents: number;
  imageUrl: string;
};

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<Product[]>(`${this.api}/products`);
  }

  getById(id: string) {
    return this.http.get<Product>(`${this.api}/products/${id}`);
  }

  getBySlug(slug: string) {
    return this.http.get<PublicProduct>(
      `${this.api}/products/by-slug/${slug}`,
    );
  }

  create(payload: ProductInput) {
    return this.http.post<Product>(`${this.api}/products`, payload);
  }

  update(id: string, payload: Partial<ProductInput>) {
    return this.http.patch<Product>(`${this.api}/products/${id}`, payload);
  }

  checkout(
    productId: string,
    payload: {
      name?: string;
      email?: string;
      phone?: string;
      whatsappOptIn?: boolean;
      method: 'PIX' | 'CARD' | 'BOLETO';
      offerIds: string[];
      affiliationSlug?: string;
    },
  ) {
    return this.http.post<{ orderId: string; initPoint: string }>(
      `${this.api}/checkout/${productId}`,
      payload,
      {
        headers: new HttpHeaders({
          'Idempotency-Key': globalThis.crypto.randomUUID(),
        }),
      },
    );
  }

  subscriptionCheckout(
    planId: string,
    payload: {
      name: string;
      email: string;
      phone?: string;
      whatsappOptIn?: boolean;
    },
  ) {
    return this.http.post<{ subscriptionId: string; initPoint: string }>(
      `${this.api}/subscriptions/checkout/${planId}`,
      payload,
    );
  }
}
