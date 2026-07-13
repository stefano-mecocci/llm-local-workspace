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
    #generatingMessage = signal<ChatMessage | null>(null);

    chatIds = httpResource<string[]>(() => `${this.API_URL}/chat_ids`);
    isStreaming = this.#isStreaming.asReadonly();
    isLoading = this.#isLoading.asReadonly();
    messages = this.#messages.asReadonly();
    generatingMessage = this.#generatingMessage.asReadonly();
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

        const pastedImage = this.#pastedImage();
        const userImage = pastedImage ? await fileToBase64(pastedImage) : undefined;

        this.addUserMessage(prompt, userImage);
        this.#generatingMessage.set({ role: ChatMessageRole.Assistant, content: '' });

        this.#isLoading.set(true);
        this.#isStreaming.set(true);

        if (pastedImage) {
            await this.streamWithImage(prompt, chatId, pastedImage);
        } else {
            await this.streamText(chatId, prompt);
        }
    }

    private async streamWithImage(prompt: string, chatId: string, image: File) {
        try {
            const formData = new FormData();
            formData.set('image', image);
            formData.set('prompt', prompt);
            formData.set('model', this.#selectedModel());
            formData.set('chat_id', chatId);
            const requestOptions: RequestInit = { signal: this.#abortLastPromptController?.signal, method: "POST", body: formData };
            const url = `${this.API_URL}/stream-vision`;
            const response = await fetch(url, requestOptions);

            await this.consumeStream(response);
        } catch (err) {
            console.log(err);
        } finally {
            this.dropPastedImage();
            this.finalizeStream();
        }
    }

    private async streamText(chatId: string, prompt: string) {
        try {
            const url = this.buildStreamUrl(chatId, prompt, this.#selectedModel());
            const response = await fetch(url, { signal: this.#abortLastPromptController!.signal });

            await this.consumeStream(response);
        } catch (err) {
            console.log(err);
        } finally {
            this.finalizeStream();
        }
    }

    private async consumeStream(response: Response) {
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        this.#isLoading.set(false);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            this.#generatingMessage.update(msg => msg ? { ...msg, content: msg.content + chunk } : msg);
        }
    }

    private finalizeStream() {
        const generated = this.#generatingMessage();
        if (generated) {
            this.#messages.update(prev => [...prev, generated]);
        }
        this.#generatingMessage.set(null);
        this.#abortLastPromptController = null;
        this.#isStreaming.set(false);
        this.chatIds.reload();
    }

    private buildStreamUrl(chatId: string, prompt: string, model: string) {
        const params = new HttpParams()
            .set("chat_id", chatId)
            .set("prompt", prompt)
            .set("model", model);

        return `${this.API_URL}/stream?${params.toString()}`
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
}
