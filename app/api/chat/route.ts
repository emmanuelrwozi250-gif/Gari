import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export const runtime = 'nodejs';
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are Gari Assistant, a helpful AI for Gari — Rwanda's car rental marketplace.

You help users:
- Find the right car (SUV/4x4 for safari, economy for city, executive for business, minibus for groups)
- Understand booking: dates, with/without driver, insurance, deposit
- Navigate Rwanda: Kigali, Musanze (Volcanoes NP), Rubavu (Lake Kivu), Kayonza (Akagera), Nyamasheke (Nyungwe)
- Questions about: NIDA verification, MTN MoMo/Airtel Money payment, 12% platform fee, 18% VAT, cancellation policy (free within 24h, 50% after)
- Prices: economy from RWF 30,000/day, SUV from RWF 80,000/day, executive from RWF 120,000/day
- Add-ons available: Child Seat (RWF 5,000/day), Cooler Box (RWF 3,000/day), Wi-Fi Hotspot (RWF 8,000/day)

For complex issues direct to WhatsApp: +250788123000. Keep responses concise (2-4 sentences). Be warm and Rwanda-savvy.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: gateway('anthropic/claude-haiku-4.5'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 500,
  });

  return result.toUIMessageStreamResponse();
}
