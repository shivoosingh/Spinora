import "server-only";

const DEFAULT_MODEL = "gemini-2.0-flash";

export interface GeminiBlogDraft {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  image_prompt: string;
}

function modelId(): string {
  return process.env.GEMINI_BLOG_MODEL?.trim() || DEFAULT_MODEL;
}

function parseGeminiJson(text: string): GeminiBlogDraft {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as GeminiBlogDraft;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini did not return JSON");
    return JSON.parse(match[0]) as GeminiBlogDraft;
  }
}

export async function generateBlogDraftWithGemini(topic: string): Promise<GeminiBlogDraft> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set on the server.");
  }

  const prompt = `You are an SEO blog writer for Spinora (spinoracasinos.com), a US sweepstakes / fish-table gaming platform.

Write ONE blog post about: ${topic}

Rules:
- Helpful, original, not spammy
- Mention Spinora naturally 2-3 times
- Include a short disclaimer that players must follow local rules and play responsibly
- Markdown body with ## headings, bullet lists, and optionally one table
- 900-1400 words in content

Return ONLY valid JSON (no markdown fences) with keys:
 title (string, max 120 chars)
 excerpt (string, max 280 chars)
 content (string, markdown)
 tags (array of 3-6 lowercase strings)
 seo_title (string, max 65 chars)
 seo_description (string, max 160 chars)
 image_prompt (string, describe a cinematic blog hero image, no text in image)`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId()}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini API error (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text?.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  const draft = parseGeminiJson(text);

  if (!draft.title?.trim() || !draft.content?.trim()) {
    throw new Error("Gemini JSON missing title or content.");
  }

  return {
    title: draft.title.trim(),
    excerpt: (draft.excerpt ?? "").trim(),
    content: draft.content.trim(),
    tags: Array.isArray(draft.tags) ? draft.tags.map(String) : [],
    seo_title: (draft.seo_title ?? draft.title).trim().slice(0, 70),
    seo_description: (draft.seo_description ?? draft.excerpt ?? "").trim().slice(0, 200),
    image_prompt: (draft.image_prompt ?? draft.title).trim(),
  };
}

export function pollinationsCoverUrl(imagePrompt: string): string {
  const prompt = `${imagePrompt}, professional blog hero, wide 16:9, no text, no watermark`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&nologo=true`;
}
