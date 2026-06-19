import { z } from 'zod';

export const DEFAULT_MODEL = 'openrouter/free';

/**
 * JSON schema for a single-card reading.
 * Kept minimal (3 fields) to reduce generation time on lightweight free models.
 */
export const SINGLE_CARD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['message', 'action', 'disclaimer'],
  properties: {
    message: {
      type: 'string',
      description:
        'A warm daily message in Japanese. Briefly introduce the card meaning and connect it to the user.',
    },
    action: {
      type: 'string',
      description: 'One small, concrete action the user can take today in Japanese.',
    },
    disclaimer: {
      type: 'string',
      description:
        'A short disclaimer in Japanese stating tarot is not an absolute answer.',
    },
  },
} as const;

/**
 * JSON schema for a three-card reading (situation / challenge / advice).
 * Kept compact to reduce generation time on lightweight free models.
 */
export const THREE_CARD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['positions', 'reflection_question', 'action', 'disclaimer'],
  properties: {
    positions: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      description: 'Three positions: 状況, 課題, 助言 in that order.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'message'],
        properties: {
          label: {
            type: 'string',
            enum: ['状況', '課題', '助言'],
            description: 'Position label.',
          },
          message: {
            type: 'string',
            description:
              'A short, warm message for this position in Japanese. Briefly mention the card meaning and connect it to the user.',
          },
        },
      },
    },
    reflection_question: {
      type: 'string',
      description:
        'A reflective question in Japanese, e.g. "この状況の背後に、あなたが大切にしている価値観や目的は何ですか？"',
    },
    action: {
      type: 'string',
      description: 'One small, concrete action the user can take today in Japanese.',
    },
    disclaimer: {
      type: 'string',
      description:
        'A short disclaimer in Japanese stating tarot is not an absolute answer.',
    },
  },
} as const;

export const SingleCardReadingSchema = z.object({
  message: z.string().min(1),
  action: z.string().min(1),
  disclaimer: z.string().min(1),
});

export const ThreeCardPositionSchema = z.object({
  label: z.enum(['状況', '課題', '助言']),
  message: z.string().min(1),
});

export const ThreeCardReadingSchema = z.object({
  positions: z.array(ThreeCardPositionSchema).length(3),
  reflection_question: z.string().min(1),
  action: z.string().min(1),
  disclaimer: z.string().min(1),
});

export type SingleCardReading = z.infer<typeof SingleCardReadingSchema>;
export type ThreeCardReading = z.infer<typeof ThreeCardReadingSchema>;
export type ReadingResult = SingleCardReading | ThreeCardReading;

/**
 * Formal system prompt optimized for lightweight LLMs such as openrouter/free.
 * Uses XML tags, imperative MUST/SHOULD/MUST NOT rules, and an injected JSON schema.
 */
export const SYSTEM_PROMPT = `You are a friendly female tarot reader.
Your role is to provide realistic, psychological, and caring tarot interpretations.

<core_belief>
- Tarot is NOT a tool for predicting the future.
- Tarot is a mirror for looking inward and gaining insight.
</core_belief>

<role_rules>
- Speak warmly and conversationally.
- Use the phrase "一緒に内側を覗いてみましょう" when appropriate.
- Avoid occult extremes and clinical therapy language.
- Show empathy and care at all times.
</role_rules>

<safety_rules>
- Safety, health, and mental wellbeing are the highest priority.
- MUST refuse illegal, dangerous, or medical advice.
- MUST recommend consulting a professional when relevant.
- MUST NOT make absolute or deterministic predictions.
- MUST NOT decide the user's life choices for them.
</safety_rules>

<output_rules>
- Output MUST be a single valid JSON object matching the schema in <output_schema>.
- Output MUST contain ONLY the JSON object. Do not add markdown, commentary, or code fences.
- All string values MUST be in Japanese.
- Use \\n line breaks inside strings for readability.
- For emphasis, use ***text***. Every *** opening MUST have a matching *** closing.
- MUST NOT leave emphasis markers unclosed.
</output_rules>

<output_schema>
{{SCHEMA}}
</output_schema>
`;

/**
 * Return the system prompt with the correct JSON schema injected.
 */
export function getSystemPrompt(spread: 'single' | 'three'): string {
  const schema = spread === 'single' ? SINGLE_CARD_SCHEMA : THREE_CARD_SCHEMA;
  return SYSTEM_PROMPT.replace('{{SCHEMA}}', JSON.stringify(schema, null, 2));
}

function normalizeEmphasis(text: string): string {
  // Ensure any unclosed *** pairs are closed so downstream markdown rendering stays safe.
  const count = (text.match(/\*\*\*/g) ?? []).length;
  if (count % 2 === 1) {
    return `${text}***`;
  }
  return text;
}

/**
 * Convert a validated structured reading into Markdown for the existing UI.
 */
export function readingToMarkdown(reading: ReadingResult, spread: 'single' | 'three'): string {
  if (spread === 'single') {
    const r = reading as SingleCardReading;
    return [
      '## 今日のメッセージ',
      '',
      normalizeEmphasis(r.message),
      '',
      '## 今日からできる小さな行動',
      '',
      normalizeEmphasis(r.action),
      '',
      normalizeEmphasis(r.disclaimer),
    ].join('\n');
  }

  const r = reading as ThreeCardReading;
  const positionBlocks = r.positions
    .map((p) => `## ${p.label}\n\n${normalizeEmphasis(p.message)}`)
    .join('\n\n');

  return [
    positionBlocks,
    '',
    '## 内省の問い',
    '',
    normalizeEmphasis(r.reflection_question),
    '',
    '## 今日からできる小さな行動',
    '',
    normalizeEmphasis(r.action),
    '',
    normalizeEmphasis(r.disclaimer),
  ].join('\n');
}
