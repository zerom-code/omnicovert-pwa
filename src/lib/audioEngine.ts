/**
 * Client-side Audio Extractor using Web Audio API and WAV encoding
 */
export async function extractAudioFromVideo(
  videoFile: File,
  onProgress?: (msg: string) => void
): Promise<Blob> {
  if (onProgress) onProgress('Чтение медиафайла...');

  const arrayBuffer = await videoFile.arrayBuffer();

  if (onProgress) onProgress('Декодирование аудиопотока...');
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    if (onProgress) onProgress('Кодирование в формат WAV...');
    const wavBlob = audioBufferToWav(audioBuffer);
    return wavBlob;
  } catch {
    throw new Error('Не удалось декодировать аудиодорожку из этого видеофайла. Возможно, файл поврежден или аудиокодек не поддерживается браузером.');
  } finally {
    audioContext.close().catch(() => {});
  }
}

/**
 * Encodes an AudioBuffer into a standardized 16-bit PCM WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    let index = 0;
    let inputIndex = 0;
    while (index < result.length) {
      result[index++] = left[inputIndex];
      result[index++] = right[inputIndex];
      inputIndex++;
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const dataLength = result.length * (bitDepth / 8);
  const bufferHeader = new ArrayBuffer(44 + dataLength);
  const view = new DataView(bufferHeader);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
