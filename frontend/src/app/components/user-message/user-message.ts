import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { ChatMessage } from '../../services/chat-state';

@Component({
  selector: 'app-user-message',
  templateUrl: './user-message.html',
  styleUrl: './user-message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMessage {
  readonly message = input.required<ChatMessage>();
  readonly imageSrc = computed(() => {
    const src = this.message().images?.[0];
    if (!src) return null;

    if (src.startsWith("data")) {
      return src;
    } else {
      return "data:*/*;base64," + src;
    }
  });
}
