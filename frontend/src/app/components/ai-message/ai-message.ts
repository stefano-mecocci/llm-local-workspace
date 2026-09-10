import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { Copy } from '@primeicons/angular/copy';
import { ButtonDirective } from 'primeng/button';
import { ChatState } from '../../services/chat-state';

@Component({
  selector: 'app-ai-message',
  templateUrl: './ai-message.html',
  styleUrl: './ai-message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownComponent, Copy, ButtonDirective]
})
export class AiMessage {
  readonly content = input.required<string>();
  readonly isLast = input.required<boolean>();
  readonly #chatState = inject(ChatState);

  isLoading = this.#chatState.isLoading;

  copyResponse() {
    void navigator.clipboard.writeText(this.content());
  }
}
