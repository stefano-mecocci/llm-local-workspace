import { Component, ChangeDetectionStrategy, input, OnInit, inject } from '@angular/core';
import { MessageFeed } from '../message-feed/message-feed';
import { PromptBox } from '../prompt-box/prompt-box';
import { ChatState } from '../../services/chat-state';

@Component({
  selector: 'app-chat-container',
  imports: [MessageFeed, PromptBox],
  templateUrl: './chat-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatContainerComponent implements OnInit {
  readonly id = input.required<string>();
  readonly chatState = inject(ChatState);

  messages = this.chatState.messages;

  ngOnInit() {
    this.chatState.switchChat(this.id());
  }
}
