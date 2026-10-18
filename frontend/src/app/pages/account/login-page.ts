import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { loginError } from './errors';

/** Connexion par e-mail et mot de passe. Google et Microsoft arrivent plus tard. */
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './account.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  /** Google ou Microsoft nous a renvoyés ici avec ?error : la connexion a été refusée. */
  protected readonly providerError = inject(ActivatedRoute).snapshot.queryParamMap.has('error');

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly submitted = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e: HttpErrorResponse) => {
        this.error.set(loginError(e.status));
        this.busy.set(false);
      },
    });
  }
}
