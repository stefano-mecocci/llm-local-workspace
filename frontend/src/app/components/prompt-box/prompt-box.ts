import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-prompt-box',
  templateUrl: './prompt-box.html',
  styleUrl: './prompt-box.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptBox {}
