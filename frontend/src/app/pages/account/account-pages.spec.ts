import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ForgotPage } from './forgot-page';
import { LoginPage } from './login-page';
import { RegisterPage } from './register-page';
import { ResetPage } from './reset-page';
import { VerifyPage } from './verify-page';

describe('Pages de compte', () => {
  let http: HttpTestingController;

  function setup(token?: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: new Map(token ? [['token', token]] : []) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  }

  async function render<T>(page: Type<T>) {
    const fixture = TestBed.createComponent(page);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function fill(el: HTMLElement, id: string, value: string): void {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function submit(fixture: { whenStable(): Promise<unknown> }, el: HTMLElement): Promise<void> {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('connexion : envoie les identifiants puis ouvre la session', async () => {
    setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { fixture, el } = await render(LoginPage);
    fill(el, 'email', 'jp@mememto.fr');
    fill(el, 'password', 'motdepasse-solide');
    await submit(fixture, el);

    const req = http.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({ email: 'jp@mememto.fr', password: 'motdepasse-solide' });
    req.flush({ email: 'jp@mememto.fr' });

    expect(TestBed.inject(AuthService).account()?.email).toBe('jp@mememto.fr');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('connexion : propose Google et Microsoft par de simples liens', async () => {
    setup();
    const { el } = await render(LoginPage);
    const hrefs = Array.from(el.querySelectorAll('.oauth a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/oauth2/authorization/google', '/oauth2/authorization/microsoft']);
    expect(el.querySelector('.err')).toBeNull();
  });

  it('connexion : signale un refus renvoyé par Google ou Microsoft', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: new Map([['error', '']]) } } },
      ],
    });
    const { el } = await render(LoginPage);
    expect(el.querySelector('.err')?.textContent).toContain('adresse e-mail vérifiée');
  });

  it('connexion : explique qu’il faut confirmer l’adresse (403)', async () => {
    setup();
    const { fixture, el } = await render(LoginPage);
    fill(el, 'email', 'jp@mememto.fr');
    fill(el, 'password', 'motdepasse-solide');
    await submit(fixture, el);
    http.expectOne('/api/auth/login').flush(null, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();

    expect(el.querySelector('.err')?.textContent).toContain('pas encore confirmée');
  });

  it('connexion : ne contacte pas l’API tant que le formulaire est invalide', async () => {
    setup();
    const { fixture, el } = await render(LoginPage);
    await submit(fixture, el);
    http.expectNone('/api/auth/login');
    expect(el.textContent).toContain('adresse e-mail valide');
  });

  it('inscription : refuse un mot de passe trop court puis annonce l’e-mail de confirmation', async () => {
    setup();
    const { fixture, el } = await render(RegisterPage);
    fill(el, 'email', 'jp@mememto.fr');
    fill(el, 'password', 'court');
    await submit(fixture, el);
    http.expectNone('/api/auth/register');
    expect(el.textContent).toContain('10 caractères');

    fill(el, 'password', 'motdepasse-solide');
    await submit(fixture, el);
    http.expectOne('/api/auth/register').flush(null, { status: 202, statusText: 'Accepted' });
    await fixture.whenStable();
    expect(el.textContent).toContain('Vérifie ta boîte mail');
  });

  it('vérification : confirme l’adresse avec le jeton de l’URL', async () => {
    setup('abc');
    const { fixture, el } = await render(VerifyPage);
    const req = http.expectOne('/api/auth/confirm');
    expect(req.request.body).toEqual({ token: 'abc' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    expect(el.textContent).toContain('Adresse confirmée');
  });

  it('vérification : signale un lien invalide, et l’absence de jeton', async () => {
    setup('vieux');
    const bad = await render(VerifyPage);
    http.expectOne('/api/auth/confirm').flush(null, { status: 400, statusText: 'Bad Request' });
    await bad.fixture.whenStable();
    expect(bad.el.textContent).toContain("n'est plus valable");
  });

  it('vérification sans jeton : n’appelle pas l’API', async () => {
    setup();
    const { el } = await render(VerifyPage);
    http.expectNone('/api/auth/confirm');
    expect(el.textContent).toContain('Ouvre le lien');
  });

  it('mot de passe oublié : même message quelle que soit l’adresse', async () => {
    setup();
    const { fixture, el } = await render(ForgotPage);
    fill(el, 'email', 'inconnu@mememto.fr');
    await submit(fixture, el);
    http.expectOne('/api/auth/forgot').flush(null, { status: 202, statusText: 'Accepted' });
    await fixture.whenStable();
    expect(el.textContent).toContain('Si un compte existe');
  });

  it('réinitialisation : envoie le jeton et le nouveau mot de passe', async () => {
    setup('jeton');
    const { fixture, el } = await render(ResetPage);
    fill(el, 'password', 'nouveau-mot-de-passe');
    await submit(fixture, el);
    const req = http.expectOne('/api/auth/reset');
    expect(req.request.body).toEqual({ token: 'jeton', password: 'nouveau-mot-de-passe' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    expect(el.textContent).toContain('Mot de passe modifié');
  });
});
