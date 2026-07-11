import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { BarsIcon, PlusIcon, TimesIcon } from 'primeng/icons';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { ChatState } from '../../services/chat-state';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, BarsIcon, TimesIcon, PlusIcon, RouterLink, RouterLinkActive]
})
export class Sidebar {
  #router = inject(Router);
  #chatState = inject(ChatState);

  chatIds = this.#chatState.chatIds;
  currentChatId = this.#chatState.currentChatId;

  readonly open = signal(true);
  readonly #url = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.#router.url),
      startWith(this.#router.url),
    ),
    { initialValue: this.#router.url },
  );
  readonly isRootRoute = computed(() => this.#url() === '/');

  close() {
    this.open.set(false);
  }

  show() {
    this.open.set(true);
  }
}
