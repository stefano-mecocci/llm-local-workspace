import { HttpParams, httpResource } from '@angular/common/http';
import { Service, signal, effect } from '@angular/core';
import { LlmModel } from '../types';
import fileToBase64 from '../utils/file-to-base64';
import { environment } from '../../environments/environment';

export enum ChatMessageRole {
  Assistant = 'assistant',
  User = 'user',
}

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
  images?: string[];
  timestamp: number;
};

export type PaginatedChatMessages = { messages: ChatMessage[]; hasMore: boolean };

export type LoadKind = 'initial' | 'prepend' | 'append';

export type PageRequest = { cursor: number | null; version: number };

const PAGE_SIZE = 4;

@Service()
export class ChatState {
  readonly API_URL = environment.apiUrl;

  #currentChatId = signal<string | null>(null);
  #isStreaming = signal(false);
  #isLoading = signal(false);
  #isLoadingHistory = signal(false);
  #hasMore = signal(true);

  #messages = signal<ChatMessage[]>([]);
  #generatingMessage = signal<ChatMessage | null>(null);
  #selectedModel = signal<LlmModel>('gemma4:e2b');

  #request = signal<PageRequest | null>(null);
  #requestVersion = 0;
  #mergedVersion = signal(-1);
  #loadCount = signal(0);
  #lastLoadKind = signal<LoadKind | null>(null);

  #abortLastPromptController: AbortController | null = null;
  #pastedImage = signal<File | null>(null);

  chatIds = httpResource<string[]>(() => `${this.API_URL}/chat_ids`);
  isStreaming = this.#isStreaming.asReadonly();
  isLoading = this.#isLoading.asReadonly();
  messages = this.#messages.asReadonly();
  generatingMessage = this.#generatingMessage.asReadonly();
  currentChatId = this.#currentChatId.asReadonly();
  hasMore = this.#hasMore.asReadonly();
  isLoadingHistory = this.#isLoadingHistory.asReadonly();
  loadCount = this.#loadCount.asReadonly();
  lastLoadKind = this.#lastLoadKind.asReadonly();

  #historyResource = httpResource<PaginatedChatMessages>(
    () => {
      const id = this.#currentChatId();
      const req = this.#request();
      if (!id || !req) return undefined;

      let params = new HttpParams().set('limit', PAGE_SIZE.toString());
      if (req.cursor !== null) {
        params = params.set('before', req.cursor.toString());
      }
      return `${this.API_URL}/fetch_chat?chat_id=${id}&${params.toString()}`;
    },
    { defaultValue: { messages: [], hasMore: false } },
  );

  constructor() {
    effect(() => {
      const value = this.#historyResource.value();
      const loading = this.#historyResource.isLoading();
      const req = this.#request();
      if (!req || loading) return;
      if (this.#mergedVersion() >= req.version) return;

      this.handlePageLoaded(value, req);
      this.#mergedVersion.set(req.version);
    });
  }

  private handlePageLoaded(page: PaginatedChatMessages, req: PageRequest) {
    if (req.cursor === null) {
      this.#messages.set(page.messages);
      this.#lastLoadKind.set('initial');
    } else {
      this.#messages.update((prev) => [...page.messages, ...prev]);
      this.#lastLoadKind.set('prepend');
    }
    this.#hasMore.set(page.hasMore);
    this.#isLoadingHistory.set(false);
    this.#loadCount.update((c) => c + 1);
  }

  switchModel(newModel: LlmModel) {
    this.#selectedModel.set(newModel);
  }

  setImage(file: File) {
    this.#pastedImage.set(file);
  }

  dropPastedImage() {
    this.#pastedImage.set(null);
  }

  switchChat(newChatId: string, options: { stopCurrentStream?: boolean } = {}) {
    if (options.stopCurrentStream) {
      this.stopCurrentStream();
    }
    this.clearChatState();

    this.#currentChatId.set(newChatId);

    this.#requestVersion += 1;
    this.#isLoadingHistory.set(true);
    this.#request.set({ cursor: null, version: this.#requestVersion });
  }

  loadMore() {
    if (this.#isLoadingHistory() || !this.#hasMore()) return;
    const messages = this.#messages();
    if (messages.length === 0) return;

    const cursor = Math.min(...messages.map((m) => m.timestamp));
    if (cursor === -Infinity) return;

    this.#requestVersion += 1;
    this.#isLoadingHistory.set(true);
    this.#request.set({ cursor, version: this.#requestVersion });
  }

  clearChatState() {
    this.#currentChatId.set(null);
    this.#request.set(null);
    this.#messages.set([]);
    this.#hasMore.set(true);
    this.#isLoadingHistory.set(false);
    this.#mergedVersion.set(-1);
    this.#lastLoadKind.set(null);
    this.#generatingMessage.set(null);
  }

  async sendMessage(prompt: string, chatId: string) {
    this.stopCurrentStream();
    this.#abortLastPromptController = new AbortController();

    const pastedImage = this.#pastedImage();
    const userImage = pastedImage ? await fileToBase64(pastedImage) : undefined;

    this.addUserMessage(prompt, userImage);
    this.#generatingMessage.set({
      role: ChatMessageRole.Assistant,
      content: '',
      timestamp: Date.now(),
    });

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
      const requestOptions: RequestInit = {
        signal: this.#abortLastPromptController?.signal,
        method: 'POST',
        body: formData,
      };
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
      this.#generatingMessage.update((msg) =>
        msg ? { ...msg, content: msg.content + chunk } : msg,
      );
    }
  }

  private finalizeStream() {
    const generated = this.#generatingMessage();
    if (generated) {
      this.#messages.update((prev) => [...prev, generated]);
    }
    this.#generatingMessage.set(null);
    this.#abortLastPromptController = null;
    this.#isStreaming.set(false);
    this.#lastLoadKind.set('append');
    this.#loadCount.update((c) => c + 1);
    this.chatIds.reload();
  }

  private buildStreamUrl(chatId: string, prompt: string, model: string) {
    const params = new HttpParams()
      .set('chat_id', chatId)
      .set('prompt', prompt)
      .set('model', model);

    return `${this.API_URL}/stream?${params.toString()}`;
  }

  private stopCurrentStream() {
    if (this.#abortLastPromptController) {
      this.#abortLastPromptController.abort();
      this.#isStreaming.set(false);
    }
  }

  private addUserMessage(message: string, image?: string) {
    this.#messages.update((prev) => {
      return [
        ...prev,
        {
          role: ChatMessageRole.User,
          content: message,
          images: image ? [image] : [],
          timestamp: Date.now(),
        },
      ];
    });
    this.#lastLoadKind.set('append');
    this.#loadCount.update((c) => c + 1);
  }
}
