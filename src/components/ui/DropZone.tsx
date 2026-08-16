import React, { useRef, useState } from 'react';
import { UploadCloud, FileType } from 'lucide-react';
import { triggerHaptic } from '../../lib/storage';

interface DropZoneProps {
  accept: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const DropZone: React.FC<DropZoneProps> = ({
  accept,
  multiple = false,
  onFilesSelected,
  title = 'Перетащите файлы сюда или нажмите для выбора',
  subtitle = 'Поддерживаются любые размеры файлов',
  icon,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      triggerHaptic('medium');
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      triggerHaptic('medium');
      onFilesSelected(Array.from(e.target.files));
    }
    // reset so same file can be chosen again
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={`dropzone ${isDragOver ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-light)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          {icon || <UploadCloud size={28} />}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {title}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {subtitle}
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--primary-light)',
            background: 'rgba(99, 102, 241, 0.08)',
            padding: '4px 12px',
            borderRadius: '9999px',
            marginTop: '4px',
          }}
        >
          <FileType size={13} />
          <span>Форматы: {accept.replace(/\./g, ' ').toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
