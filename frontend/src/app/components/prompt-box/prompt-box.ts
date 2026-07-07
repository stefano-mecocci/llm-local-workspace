import { Component, ChangeDetectionStrategy, signal, model } from '@angular/core';
import { AutoResizeDirective } from "../../directives/auto-resize";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-prompt-box',
  templateUrl: './prompt-box.html',
  styleUrl: './prompt-box.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AutoResizeDirective, FormsModule],
})
export class PromptBox {
  readonly prompt = model('');

  onEnterPressed(event: KeyboardEvent) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    this.sendPrompt();
  }

  sendPrompt() {
    console.log("Prompt sent to LLM: " + this.prompt().trim());
    this.prompt.set('');
  }
}
