import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }).compileComponents();
  });

  it('affiche la marque, la zone de contenu et le pied de page', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.brand')?.textContent).toContain('Memento');
    expect(page.querySelector('router-outlet')).toBeTruthy();
    expect(page.querySelector('.site-footer')).toBeTruthy();
  });
});
