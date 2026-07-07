import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/empty-prompt/empty-prompt').then(
            (m) => m.EmptyPromptComponent,
          ),
      },
      {
        path: 'chat/:id',
        loadComponent: () =>
          import('./components/chat-container/chat-container').then(
            (m) => m.ChatContainerComponent,
          ),
      },
    ],
  },
];
