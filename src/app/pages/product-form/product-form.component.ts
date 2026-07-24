import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../core/products.service';
import { apiErrorMessage } from '../../shared/api-error';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css',
})
export class ProductFormComponent implements OnInit {
  productId: string | null = null;
  title = '';
  description = '';
  imageUrl = '';
  price = 0;
  error = signal('');
  loadingProduct = signal(false);
  saving = signal(false);

  get isEdit() {
    return !!this.productId;
  }

  constructor(
    private readonly productsService: ProductsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (!this.productId) return;

    this.loadingProduct.set(true);
    this.productsService.getById(this.productId).subscribe({
      next: (product) => {
        this.title = product.title;
        this.description = product.description;
        this.imageUrl = product.imageUrl;
        this.price = product.priceCents / 100;
        this.loadingProduct.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Produto não encontrado'));
        this.loadingProduct.set(false);
      },
    });
  }

  submit() {
    if (this.loadingProduct() || this.saving()) return;
    if (this.isEdit && this.error() && !this.title) return;

    this.error.set('');
    this.saving.set(true);
    const payload = {
      title: this.title,
      description: this.description,
      imageUrl: this.imageUrl,
      priceCents: Math.round(this.price * 100),
    };

    const request$ = this.productId
      ? this.productsService.update(this.productId, payload)
      : this.productsService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigateByUrl('/app/products');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Não foi possível salvar'));
      },
    });
  }
}
