export interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: WhisperSegment[];
}

/**
 * Calls OpenAI Whisper API with verbose_json to extract timestamps and text
 */
export async function transcribeAudioWithWhisper(
  apiKey: string,
  mediaFile: File | Blob,
  fileName: string = 'recording.wav',
  language?: string,
  prompt?: string
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append('file', mediaFile, fileName);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');

  if (language && language !== 'auto') {
    formData.append('language', language);
  }

  if (prompt) {
    formData.append('prompt', prompt);
  }

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const msg = errorJson?.error?.message || `Ошибка OpenAI Whisper API (${response.status}: ${response.statusText})`;
    throw new Error(msg);
  }

  return response.json();
}

/**
 * Summarizes the transcription using GPT-4o-mini
 */
export async function summarizeTranscription(
  apiKey: string,
  transcriptText: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Ты — профессиональный ИИ-ассистент. Твоя задача — сделать структурированное, емкое и понятное резюме переданного текста расшифровки (аудио/видео записи). Выдели ключевые темы, важные решения, задачи и выводы в красивом Markdown формате на русском языке.',
        },
        {
          role: 'user',
          content: `Вот расшифровка записи:\n\n${transcriptText}`,
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error?.message || 'Не удалось сгенерировать саммари');
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || 'Нет данных';
}

/**
 * Formats Whisper segments into an SRT subtitle file string
 */
export function formatAsSrt(segments?: WhisperSegment[], fullText?: string): string {
  if (!segments || segments.length === 0) {
    return `1\n00:00:00,000 --> 00:00:10,000\n${fullText || ''}\n`;
  }

  return segments
    .map((seg, idx) => {
      const start = formatTimestampSrt(seg.start);
      const end = formatTimestampSrt(seg.end);
      return `${idx + 1}\n${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Formats Whisper segments into a WebVTT file string
 */
export function formatAsVtt(segments?: WhisperSegment[], fullText?: string): string {
  if (!segments || segments.length === 0) {
    return `WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n${fullText || ''}\n`;
  }

  const body = segments
    .map((seg) => {
      const start = formatTimestampVtt(seg.start);
      const end = formatTimestampVtt(seg.end);
      return `${start} --> ${end}\n${seg.text.trim()}`;
    })
    .join('\n\n');

  return `WEBVTT\n\n${body}\n`;
}

function formatTimestampSrt(seconds: number): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}

function formatTimestampVtt(seconds: number): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
}
