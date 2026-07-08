import { anthropic, MODELS, withRetry } from '../client';
import { SHOP_SYSTEM } from '../shopContext';
import { ChatInputZ } from '../schemas';

export async function* streamReply(input: unknown): AsyncIterable<string> {
  const { messages } = ChatInputZ.parse(input);
  const stream = await withRetry(() => Promise.resolve(anthropic.messages.stream({
    model: MODELS.chat,
    max_tokens: 1024,
    system: [{ type: 'text', text: SHOP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })));
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
