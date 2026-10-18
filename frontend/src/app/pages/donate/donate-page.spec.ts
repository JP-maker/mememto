import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DonatePage } from './donate-page';

describe('DonatePage', () => {
  it('affiche le QR code avec un texte alternatif et un lien de retour', async () => {
    await TestBed.configureTestingModule({ imports: [DonatePage], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(DonatePage);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('img.qr')?.getAttribute('alt')).toContain('QR code PayPal');
    expect(page.querySelector('a')?.getAttribute('href')).toBe('/');
  });
});
