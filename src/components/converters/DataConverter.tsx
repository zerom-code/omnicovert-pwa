import React, { useState } from 'react';
import { Database, QrCode, Code2, Download, Copy, Check, ArrowRightLeft } from 'lucide-react';
import {
  jsonToCsv,
  csvToJson,
  jsonToYaml,
  yamlToJson,
  generateQrCode,
  base64Encode,
  base64Decode,
} from '../../lib/dataEngine';
import { addHistoryItem, triggerHaptic } from '../../lib/storage';

export const DataConverter: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'jsonCsv' | 'jsonYaml' | 'qr' | 'base64'>('jsonCsv');
  const [inputVal, setInputVal] = useState('');
  const [outputVal, setOutputVal] = useState('');
  const [direction, setDirection] = useState<'forward' | 'reverse'>('forward');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const handleConvertData = async () => {
    if (!inputVal.trim()) return;
    triggerHaptic('medium');

    try {
      if (activeMode === 'jsonCsv') {
        const res = direction === 'forward' ? jsonToCsv(inputVal) : csvToJson(inputVal);
        setOutputVal(res);
      } else if (activeMode === 'jsonYaml') {
        const res = direction === 'forward' ? jsonToYaml(inputVal) : yamlToJson(inputVal);
        setOutputVal(res);
      } else if (activeMode === 'qr') {
        const qrUrl = await generateQrCode(inputVal);
        setQrDataUrl(qrUrl);
      } else if (activeMode === 'base64') {
        const res = direction === 'forward' ? base64Encode(inputVal) : base64Decode(inputVal);
        setOutputVal(res);
      }
      addHistoryItem({
        type: 'data',
        title: activeMode === 'qr' ? 'Генерация QR-кода' : 'Конвертация данных',
        subtitle: activeMode.toUpperCase(),
      });
    } catch (err: any) {
      alert(err.message || 'Ошибка конвертации');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic('light');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(99,102,241,0.08) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
            <Database size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Данные, Код & QR Студия</h2>
              <span className="badge badge-offline">Оффлайн</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Конвертация JSON, CSV, YAML, кодирование Base64 и генератор QR-кодов
            </p>
          </div>
        </div>

        <div className="tab-pills" style={{ overflowX: 'auto' }}>
          <button
            className={`tab-pill ${activeMode === 'jsonCsv' ? 'active' : ''}`}
            onClick={() => {
              setActiveMode('jsonCsv');
              setInputVal('');
              setOutputVal('');
            }}
          >
            JSON ⇄ CSV
          </button>
          <button
            className={`tab-pill ${activeMode === 'jsonYaml' ? 'active' : ''}`}
            onClick={() => {
              setActiveMode('jsonYaml');
              setInputVal('');
              setOutputVal('');
            }}
          >
            JSON ⇄ YAML
          </button>
          <button
            className={`tab-pill ${activeMode === 'qr' ? 'active' : ''}`}
            onClick={() => {
              setActiveMode('qr');
              setInputVal('');
              setQrDataUrl(null);
            }}
          >
            <QrCode size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            QR-Код
          </button>
          <button
            className={`tab-pill ${activeMode === 'base64' ? 'active' : ''}`}
            onClick={() => {
              setActiveMode('base64');
              setInputVal('');
              setOutputVal('');
            }}
          >
            <Code2 size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Base64
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeMode !== 'qr' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Направление: {direction === 'forward' ? 'Прямое' : 'Обратное'}
            </span>
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => {
                setDirection((prev) => (prev === 'forward' ? 'reverse' : 'forward'));
                setInputVal(outputVal);
                setOutputVal('');
              }}
            >
              <ArrowRightLeft size={13} /> Поменять направление
            </button>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            {activeMode === 'qr'
              ? 'Введите ссылку или текст для QR-кода:'
              : direction === 'forward'
              ? 'Исходные данные:'
              : 'Данные для обратной конвертации:'}
          </label>
          <textarea
            rows={activeMode === 'qr' ? 3 : 6}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              activeMode === 'qr'
                ? 'https://mywebsite.com или любой текст...'
                : 'Вставьте текст сюда...'
            }
            style={{ fontFamily: 'monospace' }}
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleConvertData}
          disabled={!inputVal.trim()}
          style={{ width: '100%', padding: '12px' }}
        >
          {activeMode === 'qr' ? 'Сгенерировать QR-код' : 'Сконвертировать'}
        </button>

        {/* QR Code Output */}
        {activeMode === 'qr' && qrDataUrl && (
          <div
            className="glass-card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              background: 'rgba(0,0,0,0.5)',
            }}
          >
            <img src={qrDataUrl} alt="QR Code" style={{ borderRadius: '12px', width: '200px', height: '200px' }} />
            <a
              href={qrDataUrl}
              download="qrcode.png"
              className="btn-primary"
              style={{ textDecoration: 'none' }}
            >
              <Download size={15} /> Скачать QR-код (PNG)
            </a>
          </div>
        )}

        {/* Text Output */}
        {activeMode !== 'qr' && outputVal && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Результат конвертации:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => handleCopy(outputVal)}
                >
                  {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => handleDownload(outputVal, 'converted_data.txt')}
                >
                  <Download size={13} /> Скачать
                </button>
              </div>
            </div>
            <textarea
              rows={8}
              readOnly
              value={outputVal}
              style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.6)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
