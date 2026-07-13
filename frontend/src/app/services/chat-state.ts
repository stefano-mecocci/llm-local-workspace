import { HttpParams, httpResource } from '@angular/common/http';
import { linkedSignal, Service, signal } from '@angular/core';
import { LlmModel } from '../types';
import fileToBase64 from '../utils/file-to-base64';
import { environment } from '../../environments/environment';

export enum ChatMessageRole {
    Assistant = 'assistant',
    User = 'user',
};

export type ChatMessage = { role: ChatMessageRole; content: string; images?: string[] };

@Service()
export class ChatState {
    readonly API_URL = environment.apiUrl;

    #currentChatId = signal<string | null>(null);
    #isStreaming = signal(false);
    #isLoading = signal(false);
    #messages = linkedSignal<ChatMessage[], ChatMessage[]>({
        source: () => this.#chatHistoryResource.value(),
        computation: (nextHistory, previous) => {
            if (this.#isStreaming() || (previous && previous.value.length > (nextHistory?.length ?? 0))) {
                return previous?.value ?? [];
            }
            return nextHistory ?? [];
        }
    });

    #abortLastPromptController: AbortController | null = null;
    #selectedModel = signal<LlmModel>("gemma4:e2b");

    chatIds = httpResource<string[]>(() => `${this.API_URL}/chat_ids`);
    isStreaming = this.#isStreaming.asReadonly();
    isLoading = this.#isLoading.asReadonly();
    messages = this.#messages.asReadonly();
    currentChatId = this.#currentChatId.asReadonly();

    #chatHistoryResource = httpResource<ChatMessage[]>(() => {
        const id = this.#currentChatId();
        if (!id) return;

        return `${this.API_URL}/fetch_chat?chat_id=${id}`;
    }, { defaultValue: [] });

    switchModel(newModel: LlmModel) {
        this.#selectedModel.set(newModel);
    }

    #pastedImage = signal<File | null>(null);

    setImage(file: File) {
        this.#pastedImage.set(file);
    }

    dropPastedImage() {
        this.#pastedImage.set(null);
    }

    switchChat(newChatId: string, options: { stopCurrentStream?: boolean; } = {}) {
        if (options.stopCurrentStream) {
            this.stopCurrentStream();
        }
        this.clearChatState();

        this.#currentChatId.set(newChatId);
    }

    clearChatState() {
        this.#currentChatId.set(null);
        this.#messages.set([]);
    }

    async sendMessage(prompt: string, chatId: string) {
        this.stopCurrentStream();
        this.#abortLastPromptController = new AbortController();

        this.#isLoading.set(true);
        this.#isStreaming.set(true);

        const pastedImage = this.#pastedImage();

        if (pastedImage) {
            await this.sendMessageWithImage(prompt, chatId, pastedImage);
        } else {
            await this.sendMessageOnly(prompt, chatId);
        }
    }

    async sendMessageWithImage(prompt: string, chatId: string, image: File) {
        this.addUserMessage(prompt, await fileToBase64(image));
        this.addAiMessage('');

        try {
            const formData = new FormData();
            formData.set('image', image);
            formData.set('prompt', prompt);
            formData.set('model', this.#selectedModel());
            formData.set('chat_id', chatId);
            const requestOptions: RequestInit = { signal: this.#abortLastPromptController?.signal, method: "POST", body: formData };
            const url = `${this.API_URL}/stream-vision`;
            const response = await fetch(url, requestOptions);

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            this.#isLoading.set(false);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                this.updateLastAiMessage(chunk);
            }
        } catch (err) {
            console.log(err);
        } finally {
            this.#abortLastPromptController = null;
            this.#isStreaming.set(false);
            this.chatIds.reload();
            this.dropPastedImage();
        }
    }

    private async sendMessageOnly(prompt: string, chatId: string) {
        this.stopCurrentStream();
        this.#abortLastPromptController = new AbortController();

        this.#isLoading.set(true);
        this.#isStreaming.set(true);

        this.addUserMessage(prompt);
        this.addAiMessage('');

        try {
            const url = this.buildStreamUrl(chatId, prompt, this.#selectedModel());
            const response = await fetch(url, { signal: this.#abortLastPromptController.signal });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            this.#isLoading.set(false);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                this.updateLastAiMessage(chunk);
            }
        } catch (err) {
            console.log(err);
        } finally {
            this.#abortLastPromptController = null;
            this.#isStreaming.set(false);
            this.chatIds.reload();
        }
    }

    private buildStreamUrl(chatId: string, prompt: string, model: string) {
        const params = new HttpParams()
            .set("chat_id", chatId)
            .set("prompt", prompt)
            .set("model", model);

        return `${this.API_URL}/stream?${params.toString()}`
    }

    private updateLastAiMessage(newContent: string) {
        this.#messages.update(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === ChatMessageRole.Assistant) {
                updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: updated[lastIndex].content + newContent
                };
            }
            return updated;
        });
    }

    private stopCurrentStream() {
        if (this.#abortLastPromptController) {
            this.#abortLastPromptController.abort();
            this.#isStreaming.set(false);
        }
    }

    private addUserMessage(message: string, image?: string) {
        this.#messages.update(prev => {
            return [...prev, { role: ChatMessageRole.User, content: message, images: image ? [image] : [] }];
        });
    }

    private addAiMessage(message: string) {
        this.#messages.update(prev => {
            return [...prev, { role: ChatMessageRole.Assistant, content: message }];
        })
    }
}
