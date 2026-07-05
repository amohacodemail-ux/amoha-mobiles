'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export type BarcodeFormat = 'EAN13' | 'EAN8' | 'UPCA' | 'CODE128' | 'CODE39';

interface BarcodeVisualProps {
  code?: string;
  type?: BarcodeFormat;
  compact?: boolean;
  height?: number;
  width?: number;
  showValue?: boolean;
  className?: string;
}

function detectFormat(code: string): BarcodeFormat {
  if (/^\d{13}$/.test(code)) return 'EAN13';
  if (/^\d{8}$/.test(code)) return 'EAN8';
  if (/^\d{12}$/.test(code)) return 'UPCA';
  return 'CODE128';
}

const TYPE_MISMATCH_HINT: Partial<Record<BarcodeFormat, string>> = {
  EAN13: 'EAN-13 needs exactly 13 digits',
  EAN8: 'EAN-8 needs exactly 8 digits',
  UPCA: 'UPC-A needs exactly 12 digits',
};

/**
 * Renders a machine-readable barcode using JsBarcode.
 */
export function BarcodeVisual({
  code,
  type,
  compact = false,
  height,
  width,
  showValue = true,
  className = '',
}: BarcodeVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trimmed = code?.trim() || '';
    if (!trimmed) {
      setLoading(false);
      setError(null);
      return;
    }
    if (!svgRef.current) return;

    let cancelled = false;
    const svg = svgRef.current;
    setError(null);
    setLoading(true);

    import('jsbarcode')
      .then(({ default: JsBarcode }) => {
        if (cancelled || !svgRef.current) return;

        const format = type || detectFormat(trimmed);
        const opts = {
          lineColor: '#111827',
          width: width ?? (compact ? 1 : 1.5),
          height: height ?? (compact ? 28 : 46),
          displayValue: showValue,
          fontSize: compact ? 8 : 11,
          margin: compact ? 3 : 6,
          background: 'transparent',
        };

        const attemptRender = (tryFormat: BarcodeFormat): boolean => {
          try {
            svg.innerHTML = '';
            let valid = true;
            JsBarcode(svg, trimmed, {
              format: tryFormat,
              ...opts,
              valid: (ok: boolean) => {
                valid = ok;
              },
            });
            return valid;
          } catch {
            svg.innerHTML = '';
            return false;
          }
        };

        if (attemptRender(format)) {
          if (!cancelled) {
            setError(null);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setError(TYPE_MISMATCH_HINT[format] || 'Invalid barcode format');
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load barcode library');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, type, compact, height, width, showValue]);

  if (!code?.trim()) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  if (error) {
    return (
      <div className={`flex items-center gap-1 text-xs text-destructive ${className}`}>
        <AlertCircle className="h-3 w-3 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'min-w-[110px] max-w-[150px]' : 'w-full max-w-[280px]'} ${className}`}>
      {loading && <div className="animate-pulse bg-muted h-8 rounded" />}
      <svg ref={svgRef} className={`w-full ${loading ? 'hidden' : 'block'}`} />
    </div>
  );
}
