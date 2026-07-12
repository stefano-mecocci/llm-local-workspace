import { Component, ChangeDetectionStrategy, signal, model, inject, output } from '@angular/core';
import { AutoResizeDirective } from "../../directives/auto-resize";
import { FormsModule } from '@angular/forms';
import { Select, SelectChangeEvent } from 'primeng/select';
import { ButtonDirective } from 'primeng/button';
import { ArrowUpIcon, TimesIcon } from 'primeng/icons';
import { ChatState } from '../../services/chat-state';
import { Router } from '@angular/router';
import { LlmModel } from '../../types';

@Component({
  selector: 'app-prompt-box',
  templateUrl: './prompt-box.html',
  styleUrl: './prompt-box.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AutoResizeDirective, FormsModule, Select, ButtonDirective, ArrowUpIcon, TimesIcon],
})
export class PromptBox {
  readonly #chatState = inject(ChatState);
  readonly #router = inject(Router);

  readonly prompt = model('');
  readonly previewUrl = signal<string | null>(null);
  readonly availableModels: { label: string, model: LlmModel }[] = [
    { label: "Gemma 4 (2B)", model: "gemma4:e2b" },
    { label: "Gemma 4 (4B MLX)", model: "gemma4:e4b-mlx" }
  ];
  readonly choosedModel = signal<LlmModel>("gemma4:e2b");

  onSendPrompt = output<string>();

  changeModel(event: SelectChangeEvent) {
    const selectedModel = event.value;
    this.#chatState.switchModel(selectedModel);
  }

  onEnterPressed(event: KeyboardEvent) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    this.sendPrompt();
  }

  removePastedImage() {
    this.previewUrl.set(null);
    this.#chatState.dropPastedImage();
  }

  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    if (items.length === 1) {
      const file = items[0].getAsFile();

      if (file) {
        event.preventDefault();
        this.generatePreview(file);
        this.#chatState.setImage(file);
      }
    }
  }

  private generatePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  sendPrompt() {
    this.previewUrl.set(null);
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
