import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../shared/api-error';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  message = signal('');
  error = signal('');
  loading = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.error.set('Token ausente. Use o link do e-mail.');
    }
  }

  submit() {
    this.error.set('');
    this.message.set('');

    if (this.password !== this.confirmPassword) {
      this.error.set('As senhas não coincidem');
      return;
    }

    this.loading.set(true);
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.message.set('Senha atualizada. Você já pode entrar.');
        setTimeout(() => void this.router.navigateByUrl('/login'), 1200);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          apiErrorMessage(err, 'Não foi possível redefinir a senha'),
        );
      },
    });
  }
}
