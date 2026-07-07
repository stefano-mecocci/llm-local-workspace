import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UserMessage } from '../user-message/user-message';
import { AiMessage } from '../ai-message/ai-message';

enum ChatMessageRole {
  Assistant = 'assistant',
  User = 'user',
}

@Component({
  selector: 'app-message-feed',
  imports: [UserMessage, AiMessage],
  templateUrl: './message-feed.html',
  styleUrl: './message-feed.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageFeed {
  messages: { role: ChatMessageRole, content: string }[] = [
    {
      role: ChatMessageRole.Assistant,
      content: "Hi! How can I help you today?"
    },
    {
      role: ChatMessageRole.User,
      content: "Can you explain how routing works in Angular?"
    },
    {
      role: ChatMessageRole.Assistant,
      content: "Sure! Routing in Angular maps URLs to components, and lazy loading splits bundles per route."
    },
    {
      role: ChatMessageRole.User,
      content: "Thanks, that makes sense!"
    }
  ];
}
