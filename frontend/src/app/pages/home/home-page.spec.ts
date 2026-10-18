import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home-page';

describe('HomePage', () => {
  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({ imports: [HomePage], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('annonce la promesse du site', async () => {
    const page = await render();
    expect(page.querySelector('h1')?.textContent).toContain('On fait le plan.');
  });

  it('présente les trois méthodes de mémorisation', async () => {
    const page = await render();
    const titles = Array.from(page.querySelectorAll('.method h3')).map((h) => h.textContent);
    expect(titles).toEqual(['Rappel actif', 'Répétition espacée', 'Technique de Feynman']);
  });

  it('présente les trois étapes', async () => {
    const page = await render();
    expect(page.querySelectorAll('.step').length).toBe(3);
  });
});
