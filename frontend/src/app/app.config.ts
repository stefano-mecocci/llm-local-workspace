import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import CustomPreset from './theme';
import { provideMarkdown } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    providePrimeNG({
      theme: {
        preset: CustomPreset,
      },
      license: "eyJpZCI6IjQ0NjU1ZDkxLWZiNGItNDFlMC04MzIyLWQwMDZjNzRmMWFiYSIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODM1MjIwODgsImV4cCI6MTgxNTA1ODA4OH0.c4M-7P4fUZrBlHd9Q71iIdDaKtU99wfH_Yrj5MbCvLFRHENIMkSvA674gylttvUBOR9_Dza7OAARaPJVIKbIAw"
    }),
    provideMarkdown(),
  ]
};
