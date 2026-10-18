import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

type State = 'missing' | 'checking' | 'ok' | 'error';

/** Page ouverte depuis le lien de l'e-mail : confirme l'adresse avec le jeton de l'URL. */
@Component({
  selector: 'app-verify-page',
  imports: [RouterLink],
  templateUrl: './verify-page.html',
  styleUrl: './account.scss',
})
export class VerifyPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  protected readonly state = signal<State>('checking');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('missing');
      return;
    }
    this.auth.confirm(token).subscribe({
      next: () => this.state.set('ok'),
      error: () => this.state.set('error'),
    });
  }
}
