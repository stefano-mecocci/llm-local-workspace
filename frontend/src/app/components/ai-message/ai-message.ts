import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-ai-message',
  templateUrl: './ai-message.html',
  styleUrl: './ai-message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownComponent]
})
export class AiMessage {
  readonly content = input.required<string>();
}
