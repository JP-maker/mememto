import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Page de don : QR code PayPal à scanner (montant libre). */
@Component({
  selector: 'app-donate-page',
  imports: [RouterLink],
  templateUrl: './donate-page.html',
  styleUrl: './donate-page.scss',
})
export class DonatePage {}
