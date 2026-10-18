import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LessonStore } from '../../lesson/lesson.store';

/** En-tête : la marque renvoie à l'accueil, la navigation donne accès à la saisie et au plan. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  /** Le lien « Mon plan » n'apparaît qu'une fois une leçon enregistrée. */
  protected readonly hasLesson = inject(LessonStore).lesson;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly account = this.auth.account;

  protected logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }
}
