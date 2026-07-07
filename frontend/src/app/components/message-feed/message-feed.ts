import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UserMessage } from '../user-message/user-message';
import { AiMessage } from '../ai-message/ai-message';

@Component({
  selector: 'app-message-feed',
  imports: [UserMessage, AiMessage],
  templateUrl: './message-feed.html',
  styleUrl: './message-feed.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageFeed {}
