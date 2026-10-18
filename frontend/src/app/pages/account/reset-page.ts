import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { GENERIC_ERROR } from './errors';

/** Choix d'un nouveau mot de passe, depuis le lien de l'e-mail (le jeton est dans l'URL). */
@Component({
  selector: 'app-reset-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-page.html',
  styleUrl: './account.scss',
})
export class ResetPage {
  private readonly auth = inject(AuthService);
  protected readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  protected readonly form = inject(NonNullableFormBuilder).group({
    password: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(128)]],
  });
  protected readonly submitted = signal(false);
  protected readonly busy = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal('');

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.auth.resetPassword(this.token, this.form.getRawValue().password).subscribe({
      next: () => this.done.set(true),
      error: (e: HttpErrorResponse) => {
        this.error.set(e.status === 400 ? "Ce lien n'est plus valable. Refais une demande de réinitialisation." : GENERIC_ERROR);
        this.busy.set(false);
      },
    });
  }
}
