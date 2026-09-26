import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { iniciarTema } from '@core/theme/theme.service';

// Antes de arrancar Angular: la primera pintura ya usa el tema correcto (sin parpadeo).
iniciarTema();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
