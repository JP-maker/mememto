import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Page d'accueil : explique le fonctionnement du site et présente les trois méthodes. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {}
