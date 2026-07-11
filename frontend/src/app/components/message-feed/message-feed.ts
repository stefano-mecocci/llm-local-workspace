import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { UserMessage } from '../user-message/user-message';
import { AiMessage } from '../ai-message/ai-message';
import { ChatMessage, ChatState } from '../../services/chat-state';

@Component({
  selector: 'app-message-feed',
  imports: [UserMessage, AiMessage],
  templateUrl: './message-feed.html',
  styleUrl: './message-feed.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageFeed {
  readonly messages = input.required<ChatMessage[]>();
  readonly #chatState = inject(ChatState);

  isLoading = this.#chatState.isLoading;
}
