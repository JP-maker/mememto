import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteHeader } from './layout/site-header/site-header';

/** Cadre commun à toutes les pages : en-tête, contenu routé, pied de page. */
@Component({
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  constructor() {
    inject(AuthService).refresh(); // une session est-elle déjà ouverte ?
  }
}
