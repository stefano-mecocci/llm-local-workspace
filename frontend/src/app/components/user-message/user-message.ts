import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { ChatMessage } from '../../services/chat-state';
import { ButtonModule } from 'primeng/button';
import { Times } from '@primeicons/angular/times';

@Component({
  selector: 'app-user-message',
  templateUrl: './user-message.html',
  styleUrl: './user-message.css',
  imports: [ButtonModule, Times],
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

  readonly isOverlayOpen = signal(false);

  openOverlay() {
    this.isOverlayOpen.set(true);
  }

  closeOverlay() {
    this.isOverlayOpen.set(false);
  }
}
