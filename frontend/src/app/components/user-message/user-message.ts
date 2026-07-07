import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-user-message',
  templateUrl: './user-message.html',
  styleUrl: './user-message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMessage {
  readonly content = input.required<string>();
}
