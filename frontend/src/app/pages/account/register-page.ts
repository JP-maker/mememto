import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { GENERIC_ERROR } from './errors';

/** Création de compte : l'adresse doit être confirmée par e-mail avant la première connexion. */
@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './account.scss',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(128)]],
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
    const { email, password } = this.form.getRawValue();
    this.auth.register(email, password).subscribe({
      next: () => this.sent.set(true),
      error: (e: HttpErrorResponse) => {
        this.error.set(e.status === 400 ? 'Adresse ou mot de passe invalide (10 caractères minimum).' : GENERIC_ERROR);
        this.busy.set(false);
      },
    });
  }
}
