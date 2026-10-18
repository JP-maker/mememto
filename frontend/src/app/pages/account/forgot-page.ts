import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { GENERIC_ERROR } from './errors';

/** Demande de lien de réinitialisation. La réponse est la même que l'adresse existe ou non. */
@Component({
  selector: 'app-forgot-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-page.html',
  styleUrl: './account.scss',
})
export class ForgotPage {
  private readonly auth = inject(AuthService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly submitted = signal(false);
  protected readonly busy = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal('');

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: () => this.sent.set(true),
      error: () => {
        this.error.set(GENERIC_ERROR);
        this.busy.set(false);
      },
    });
  }
}
