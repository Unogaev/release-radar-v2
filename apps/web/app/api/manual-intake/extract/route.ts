import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    const url = (form.get("url") as string) || "";
    const text = (form.get("text") as string) || "";
    const comment = (form.get("comment") as string) || "";

    if (!file && !url && !text) {
      return NextResponse.json({ error: "Нужно приложить фото, ссылку или текст" }, { status: 400 });
    }

    const promptText = `Ты помогаешь распознать сигнал о товаре (релиз, ресток, распродажа) со скриншота или текста для дроп-трекера.
Извлеки поля СТРОГО в JSON без markdown-обёртки:
{
  "brand": string|null,
  "model": string|null,
  "sku": string|null,
  "category": string|null,
  "seller": string|null,
  "url": string|null,
  "retailPrice": number|null,
  "currency": string|null,
  "availabilityStatus": string|null,
  "buyButtonText": string|null,
  "sizeOrColor": string|null,
  "purchaseLimit": string|null,
  "storeZip": string|null,
  "athleteName": string|null,
  "signalType": string|null,
  "dateTimeText": string|null,
  "confidence": number
}
confidence — от 0 до 100, твоя общая уверенность в распознанных данных.
Если чего-то нет на изображении/в тексте — ставь null, не выдумывай.
${text ? `Текст от пользователя: ${text}` : ""}
${url ? `Ссылка от пользователя: ${url}` : ""}
${comment ? `Комментарий пользователя: ${comment}` : ""}`;

    const contentParts: Array<Record<string, unknown>> = [{ type: "text", text: promptText }];

    if (file) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mime = file.type || "image/png";
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:${mime};base64,${base64}` },
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: contentParts as never }],
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json({
      extracted: { ...parsed, url: parsed.url || url || null },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
