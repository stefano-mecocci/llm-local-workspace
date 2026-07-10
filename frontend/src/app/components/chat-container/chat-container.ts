import { Component, ChangeDetectionStrategy, input, inject, effect, OnInit, OnDestroy } from '@angular/core';
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

  constructor() {
    effect(() => {
      const chatId = this.id();

      this.chatState.switchChat(chatId, { stopCurrentStream: true });

      if (history.state["prompt"]) {
        this.chatState.sendMessage(history.state["prompt"], chatId)
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
}
