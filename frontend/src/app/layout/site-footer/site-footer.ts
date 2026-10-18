import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_INFO } from '../../core/app-info';

/** Pied de page : contact, don, copyright et version déployée. */
@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  protected readonly info = APP_INFO;
  protected readonly year = new Date().getFullYear();
  /** « v0.2.0 » pour une version publiée, « dev » en développement. */
  protected readonly versionLabel = /^\d/.test(APP_INFO.version) ? `v${APP_INFO.version}` : APP_INFO.version;
  protected readonly mailHref = `mailto:${APP_INFO.contactEmail}?subject=${encodeURIComponent('Contact Memento')}`;
}
