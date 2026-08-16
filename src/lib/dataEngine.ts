import Papa from 'papaparse';
import YAML from 'yaml';
import QRCode from 'qrcode';

export function jsonToCsv(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    const data = Array.isArray(parsed) ? parsed : [parsed];
    return Papa.unparse(data);
  } catch (e: unknown) {
    throw new Error('Некорректный JSON: ' + (e instanceof Error ? e.message : String(e)));
  }
}

export function csvToJson(csvString: string): string {
  try {
    const result = Papa.parse(csvString, { header: true, skipEmptyLines: true });
    return JSON.stringify(result.data, null, 2);
  } catch (e: unknown) {
    throw new Error('Некорректный CSV: ' + (e instanceof Error ? e.message : String(e)));
  }
}

export function jsonToYaml(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    return YAML.stringify(parsed);
  } catch (e: unknown) {
    throw new Error('Некорректный JSON: ' + (e instanceof Error ? e.message : String(e)));
  }
}

export function yamlToJson(yamlString: string): string {
  try {
    const parsed = YAML.parse(yamlString);
    return JSON.stringify(parsed, null, 2);
  } catch (e: unknown) {
    throw new Error('Некорректный YAML: ' + (e instanceof Error ? e.message : String(e)));
  }
}

export async function generateQrCode(text: string, size: number = 300): Promise<string> {
  if (!text.trim()) throw new Error('Введите текст или ссылку для QR-кода');
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

export function base64Encode(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

export function base64Decode(encoded: string): string {
  return decodeURIComponent(escape(atob(encoded)));
}

export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

export function urlDecode(text: string): string {
  return decodeURIComponent(text);
}
