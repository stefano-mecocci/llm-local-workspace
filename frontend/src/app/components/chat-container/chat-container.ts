import { Component, ChangeDetectionStrategy, input, inject, effect, OnDestroy, viewChild, ElementRef, computed } from '@angular/core';
import { MessageFeed } from '../message-feed/message-feed';
import { PromptBox } from '../prompt-box/prompt-box';
import { ChatState } from '../../services/chat-state';

@Component({
  selector: 'app-chat-container',
  imports: [MessageFeed, PromptBox],
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
  scrollContainer = viewChild<ElementRef<HTMLDivElement>>("scrollFrame");

  scrollOnUpdate = effect(() => {
    const numOfMessages = this.displayMessages().length;

    if (numOfMessages > 0) {
      this.scrollToBottom();
    }
  });

  constructor() {
    effect(() => {
      const chatId = this.id();

      this.chatState.switchChat(chatId, { stopCurrentStream: true });

      if (history.state["prompt"]) {
        this.chatState.sendMessage(history.state["prompt"], chatId);
        const newState = { ...history.state };
        delete newState["prompt"];
        history.replaceState(newState, '');
      }
    });
  }

  ngOnDestroy(): void {
    this.chatState.clearChatState();
  }

  handlePrompt(prompt: string) {
    const chatId = this.id();
    this.chatState.sendMessage(prompt, chatId);
  }

  private scrollToBottom() {
    const element = this.scrollContainer()?.nativeElement;
    if (!element) return;

    setTimeout(() => {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    }, 0);
  }
}
