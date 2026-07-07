import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-chat-container',
  templateUrl: './chat-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatContainerComponent {
  readonly id = input.required<string>();
}
