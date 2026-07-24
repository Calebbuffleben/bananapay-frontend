import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  email = '';
  message = signal('');
  error = signal('');
  loading = signal(false);

  constructor(private readonly auth: AuthService) {}

  submit() {
    this.error.set('');
    this.message.set('');
    this.loading.set(true);
    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.message.set(
          'Se o e-mail existir, enviamos um link para redefinir a senha.',
        );
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível enviar o e-mail agora.');
      },
    });
  }
}
