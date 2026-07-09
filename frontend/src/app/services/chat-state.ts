import { HttpParams, httpResource } from '@angular/common/http';
import { linkedSignal, Service, signal } from '@angular/core';

export enum ChatMessageRole {
    Assistant = 'assistant',
    User = 'user',
};

export type ChatMessage = { role: ChatMessageRole; content: string; };

@Service()
export class ChatState {
    readonly API_URL = "http://localhost:8000";

    #currentChatId = signal<string | null>(null);
    #isStreaming = signal(false);
    #messages = linkedSignal<ChatMessage[]>(() => (this.chatHistoryResource.value()));
    #abortLastPromptController: AbortController | null = null;

    isStreaming = this.#isStreaming.asReadonly();
    messages = this.#messages.asReadonly();

    private chatHistoryResource = httpResource<ChatMessage[]>(() => {
        const id = this.#currentChatId();
        if (!id) return;

        return `${this.API_URL}/fetch_chat?chat_id=${id}`;
    }, { defaultValue: [] });

    switchChat(chatId: string) {
        this.stopCurrentStream();
        this.#currentChatId.set(chatId);
    }

    async sendMessage(prompt: string) {
        this.stopCurrentStream();
        this.#abortLastPromptController = new AbortController();

        this.addUserMessage(prompt);
        this.addAiMessage('');
        this.#isStreaming.set(true);

        try {
            const url = this.buildStreamUrl(this.#currentChatId() as string, prompt, "gemma4:e2b");
            const response = await fetch(url, { signal: this.#abortLastPromptController.signal });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

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
        }
    }

    private buildStreamUrl(chatId: string, prompt: string, model: string) {
        const params = new HttpParams()
            .set("chat_id", chatId)
            .set("prompt", encodeURIComponent(prompt))
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

    private addUserMessage(message: string) {
        this.#messages.update(prev => {
            return [...prev, { role: ChatMessageRole.User, content: message }];
        });
    }

    private addAiMessage(message: string) {
        this.#messages.update(prev => {
            return [...prev, { role: ChatMessageRole.Assistant, content: message }];
        })
    }
}
