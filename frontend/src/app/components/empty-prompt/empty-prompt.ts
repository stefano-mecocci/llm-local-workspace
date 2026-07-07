import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PromptBox } from "../prompt-box/prompt-box";

@Component({
  selector: 'app-empty-prompt',
  templateUrl: './empty-prompt.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PromptBox],
})
export class EmptyPromptComponent { }
