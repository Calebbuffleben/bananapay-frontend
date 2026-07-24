import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../shared/api-error';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = signal('');
  loading = signal(false);
  readonly buyerArea: boolean;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    route: ActivatedRoute,
  ) {
    this.buyerArea = route.snapshot.data['buyer'] === true;
  }

  submit() {
    this.error.set('');
    if (this.password !== this.confirmPassword) {
      this.error.set('As senhas não coincidem');
      return;
    }

    this.loading.set(true);
    const payload = {
        name: this.name,
        email: this.email,
        password: this.password,
      };
    const request = this.buyerArea
      ? this.auth.registerBuyer(payload)
      : this.auth.register(payload);
    request.subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigateByUrl(
            this.buyerArea ? '/conta' : '/app/dashboard',
          );
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(apiErrorMessage(err, 'Falha no cadastro'));
        },
      });
  }
}
