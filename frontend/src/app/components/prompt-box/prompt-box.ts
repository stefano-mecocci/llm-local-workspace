import { Component, ChangeDetectionStrategy, signal, model, inject, output } from '@angular/core';
import { AutoResizeDirective } from "../../directives/auto-resize";
import { FormsModule } from '@angular/forms';
import { Select, SelectChangeEvent } from 'primeng/select';
import { ButtonDirective } from 'primeng/button';
import { ArrowUpIcon } from 'primeng/icons';
import { ChatState } from '../../services/chat-state';
import { Router } from '@angular/router';

type LlmModel = "gemma4:e2b" | "gemma4:e4b-mlx"

@Component({
  selector: 'app-prompt-box',
  templateUrl: './prompt-box.html',
  styleUrl: './prompt-box.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AutoResizeDirective, FormsModule, Select, ButtonDirective, ArrowUpIcon],
})
export class PromptBox {
  readonly chatState = inject(ChatState);
  readonly #router = inject(Router);

  readonly prompt = model('');
  readonly availableModels: { label: string, model: LlmModel }[] = [
    { label: "Gemma 4 (2B)", model: "gemma4:e2b" },
    { label: "Gemma 4 (4B MLX)", model: "gemma4:e4b-mlx" }
  ];
  readonly choosedModel = signal<LlmModel>("gemma4:e2b");

  onSendPrompt = output<string>();

  changeModel(event: SelectChangeEvent) {
    console.log(event.value);
  }

  onEnterPressed(event: KeyboardEvent) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    this.sendPrompt();
  }

  sendPrompt() {
    const trimmedPrompt = this.prompt().trim();
    if (trimmedPrompt === "") return;
    this.prompt.set('');

    if (this.#router.url === "/") {
      const newChatId = crypto.randomUUID();
      this.#router.navigate(['chat', newChatId], {
        state: { prompt: trimmedPrompt }
      });
      return;
    }

    this.onSendPrompt.emit(trimmedPrompt);
  }
}
