import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    // anchorScrolling : les liens avec fragment (#methodes) font défiler jusqu'à la section.
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' }))
  ]
};
