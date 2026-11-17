import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeImageProps {
  text: string;
  size?: number;
  className?: string;
  alt?: string;
}

export function QrCodeImage({
  text,
  size = 320,
  className = 'w-36 h-36',
  alt = 'Plain-text QR code containing pitch and LinkedIn headline',
}: QrCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (!text) {
      setDataUrl('');
      return;
    }

    QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) {
          setDataUrl(url);
          setError('');
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to encode QR');
        }
      });

    return () => {
      active = false;
    };
  }, [text, size]);

  if (error) {
    return (
      <div
        className={`${className} flex items-center justify-center border border-slate-200 bg-slate-50 text-[11px] text-slate-500 p-2 text-center`}
      >
        {error}
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`${className} animate-pulse bg-slate-100 border border-slate-200 rounded`}
        aria-label="Generating QR code"
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      className={`${className} block bg-white rounded-sm select-none`}
    />
  );
}
