import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
  OnDestroy,
  viewChild,
  ElementRef,
  computed,
} from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';
import { MessageFeed } from '../message-feed/message-feed';
import { PromptBox } from '../prompt-box/prompt-box';
import { ChatState } from '../../services/chat-state';

@Component({
  selector: 'app-chat-container',
  imports: [MessageFeed, PromptBox, ProgressBar],
  templateUrl: './chat-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatContainerComponent implements OnDestroy {
  readonly id = input.required<string>();
  readonly chatState = inject(ChatState);

  messages = this.chatState.messages;
  displayMessages = computed(() => {
    const msgs = this.messages();
    const generating = this.chatState.generatingMessage();
    return generating ? [...msgs, generating] : msgs;
  });

  scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollFrame');
  isLoadingHistory = this.chatState.isLoadingHistory;

  private readonly SCROLL_TRIGGER_THRESHOLD = 50;
  private prevLoadCount = 0;
  private pendingAnchor: { prevHeight: number; prevTop: number } | null = null;

  constructor() {
    effect(() => {
      const chatId = this.id();

      this.chatState.switchChat(chatId, { stopCurrentStream: true });

      if (history.state['prompt']) {
        this.chatState.sendMessage(history.state['prompt'], chatId);
        const newState = { ...history.state };
        delete newState['prompt'];
        history.replaceState(newState, '');
      }
    });

    effect(() => {
      const count = this.chatState.loadCount();
      if (count === this.prevLoadCount) return;
      this.prevLoadCount = count;

      const kind = this.chatState.lastLoadKind();
      const el = this.scrollContainer()?.nativeElement;

      if (kind === 'prepend' && this.pendingAnchor && el) {
        const anchor = this.pendingAnchor;
        this.pendingAnchor = null;
        requestAnimationFrame(() => {
          const newEl = this.scrollContainer()?.nativeElement;
          if (!newEl) return;
          newEl.scrollTop = newEl.scrollHeight - anchor.prevHeight + anchor.prevTop;
          this.checkAutoFetch();
        });
        return;
      }

      this.pendingAnchor = null;
      requestAnimationFrame(() => {
        const newEl = this.scrollContainer()?.nativeElement;
        if (!newEl) return;
        newEl.scrollTop = newEl.scrollHeight;
        this.checkAutoFetch();
      });
    });
  }

  ngOnDestroy(): void {
    this.chatState.clearChatState();
  }

  handlePrompt(prompt: string) {
    const chatId = this.id();
    this.chatState.sendMessage(prompt, chatId);
  }

  onScroll() {
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;
    if (el.scrollTop > this.SCROLL_TRIGGER_THRESHOLD) return;
    if (this.chatState.isLoadingHistory() || !this.chatState.hasMore()) return;

    this.captureAnchor();
    this.chatState.loadMore();
  }

  private captureAnchor() {
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;
    this.pendingAnchor = { prevHeight: el.scrollHeight, prevTop: el.scrollTop };
  }

  private checkAutoFetch() {
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;
    if (el.scrollHeight > el.clientHeight) return;
    if (!this.chatState.hasMore() || this.chatState.isLoadingHistory()) return;

    this.captureAnchor();
    this.chatState.loadMore();
  }
}
