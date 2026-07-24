import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProductsService } from '../../core/products.service';
import { PublicCheckoutComponent } from './public-checkout.component';

describe('PublicCheckoutComponent', () => {
  it('reuses the affiliate cookie in checkout', () => {
    document.cookie = 'checkout_aff=affiliate-slug; path=/';
    const route = {
      snapshot: {
        queryParamMap: { get: () => null },
      },
    } as unknown as ActivatedRoute;
    const products = {
      checkout: jasmine.createSpy('checkout').and.returnValue(of({ initPoint: '' })),
    } as unknown as ProductsService;
    const component = new PublicCheckoutComponent(products, route);
    component.product.set({
      id: 'product',
      title: 'Product',
      description: '',
      priceCents: 100,
      imageUrl: '',
      slug: 'product',
      offers: [],
      plans: [],
    });
    component.buyer = {
      name: 'Buyer',
      email: 'buyer@example.com',
      phone: '',
      whatsappOptIn: false,
    };

    component.buy();

    expect(products.checkout).toHaveBeenCalledWith(
      'product',
      jasmine.objectContaining({ affiliationSlug: 'affiliate-slug' }),
    );
    document.cookie =
      'checkout_aff=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });
});
