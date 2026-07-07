import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-ai-message',
  templateUrl: './ai-message.html',
  styleUrl: './ai-message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiMessage {
  readonly content = input.required<string>();
}
