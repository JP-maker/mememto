import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Memento', loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage) },
  { path: 'lecon', title: 'Ma leçon', loadComponent: () => import('./pages/lesson/lesson-page').then((m) => m.LessonPage) },
  { path: 'plan', title: 'Mon plan', loadComponent: () => import('./pages/plan/plan-page').then((m) => m.PlanPage) },
  { path: 'seance', title: 'Séance', loadComponent: () => import('./pages/session/session-page').then((m) => m.SessionPage) },
  { path: 'connexion', title: 'Connexion', loadComponent: () => import('./pages/account/login-page').then((m) => m.LoginPage) },
  { path: 'inscription', title: 'Créer un compte', loadComponent: () => import('./pages/account/register-page').then((m) => m.RegisterPage) },
  { path: 'verification', title: 'Confirmation', loadComponent: () => import('./pages/account/verify-page').then((m) => m.VerifyPage) },
  { path: 'mot-de-passe-oublie', title: 'Mot de passe oublié', loadComponent: () => import('./pages/account/forgot-page').then((m) => m.ForgotPage) },
  { path: 'reinitialisation', title: 'Nouveau mot de passe', loadComponent: () => import('./pages/account/reset-page').then((m) => m.ResetPage) },
  { path: 'mes-lecons', title: 'Mes leçons', loadComponent: () => import('./pages/my-lessons/my-lessons-page').then((m) => m.MyLessonsPage) },
  { path: 'don', title: 'Soutenir Memento', loadComponent: () => import('./pages/donate/donate-page').then((m) => m.DonatePage) },
  { path: '**', redirectTo: '' },
];
