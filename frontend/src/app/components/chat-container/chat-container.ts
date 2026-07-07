import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MessageFeed } from '../message-feed/message-feed';
import { PromptBox } from '../prompt-box/prompt-box';

@Component({
  selector: 'app-chat-container',
  imports: [MessageFeed, PromptBox],
  templateUrl: './chat-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatContainerComponent {
  readonly id = input.required<string>();
}
