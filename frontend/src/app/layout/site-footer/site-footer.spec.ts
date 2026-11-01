import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({ imports: [SiteFooter], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('propose le contact par e-mail', async () => {
    const page = await render();
    expect(page.querySelector('a.btn')?.getAttribute('href')).toContain('mailto:contact@mememto.fr');
  });

  it('renvoie vers la page de don', async () => {
    const page = await render();
    expect(page.querySelector('a.ghost')?.getAttribute('href')).toBe('/don');
  });

  it('affiche le copyright et la version', async () => {
    const page = await render();
    expect(page.textContent).toContain(`© ${new Date().getFullYear()} Jean-Philippe Carrazé`);
    expect(page.querySelector('.version')?.textContent).toContain('Mememto dev');
  });
});
