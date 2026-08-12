export interface LlmContext {
  question: string;
  passages: Array<{ index: number; source: string; content: string }>;
}

export interface LlmConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

const SYSTEM_PROMPT = `Bạn là trợ lý tra cứu pháp luật Việt Nam.
Chỉ được trả lời dựa trên các đoạn ngữ cảnh được cấp.
Không suy đoán, không bổ sung kiến thức ngoài ngữ cảnh.
Mỗi khẳng định pháp lý phải có dẫn chiếu [n] tới đúng đoạn nguồn.
Nếu ngữ cảnh không đủ để trả lời, chỉ trả đúng chuỗi KHÔNG_TÌM_THẤY.
Trình bày ngắn gọn, rõ ràng bằng tiếng Việt và không đưa ra phán quyết pháp lý.`;

export function readLlmConfig(): LlmConfig {
  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  const apiKey = process.env.LLM_API_KEY?.trim() || groqApiKey;
  const model = process.env.LLM_MODEL?.trim() || (groqApiKey ? "llama-3.3-70b-versatile" : "");
  if (!apiKey || !model) throw new Error("Thiếu LLM_API_KEY/LLM_MODEL hoặc GROQ_API_KEY.");
  return {
    apiKey,
    model,
    apiUrl:
      process.env.LLM_API_URL?.trim() ||
      (groqApiKey
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions"),
  };
}

export function buildGroundedPrompt(context: LlmContext): string {
  const passages = context.passages
    .map((passage) => `[${passage.index}] ${passage.source}\n${passage.content}`)
    .join("\n\n");
  return `CÂU HỎI:\n${context.question}\n\nNGỮ CẢNH:\n${passages}`;
}

/** Stream token từ endpoint Chat Completions tương thích OpenAI. */
export async function* streamGroundedAnswer(
  context: LlmContext,
  config = readLlmConfig(),
): AsyncGenerator<string> {
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildGroundedPrompt(context) },
      ],
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`LLM trả HTTP ${response.status}: ${detail}`);
  }
  if (!response.body) throw new Error("LLM không trả response body.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      if (!payload) continue;
      const parsed = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const token = parsed.choices?.[0]?.delta?.content;
      if (token) yield token;
    }
    if (done) break;
  }
}
