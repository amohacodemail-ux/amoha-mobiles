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

/**
 * Auto-detect barcode format based on code pattern
 */
function detectFormat(code: string): BarcodeFormat {
  if (/^\d{13}$/.test(code)) return 'EAN13';
  if (/^\d{8}$/.test(code)) return 'EAN8';
  if (/^\d{12}$/.test(code)) return 'UPCA';
  return 'CODE128';
}

/**
 * Renders a real machine-readable barcode using JsBarcode.
 * Compatible with TVS BS-C103G and all standard 1D barcode scanners.
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
    if (!code) {
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
        if (cancelled || !svg) return;

        // Determine format — respect explicit type (don't auto-switch 13-digit codes to EAN13)
        const format = type || detectFormat(code);

        const opts = {
          lineColor: '#111827',
          width: width ?? (compact ? 1 : 1.5),
          height: height ?? (compact ? 28 : 46),
          displayValue: showValue,
          fontSize: compact ? 8 : 11,
          margin: compact ? 3 : 6,
          background: 'transparent',
          valid: function(valid: boolean) {
            if (!valid && !cancelled) {
              setError('Invalid barcode format');
            }
          },
        };

        try {
          JsBarcode(svg, code, { format, ...opts });
          setLoading(false);
        } catch (err) {
          // Fallback: try Code 128 which accepts any ASCII string
          try {
            JsBarcode(svg, code, { format: 'CODE128', ...opts });
            setError(null);
            setLoading(false);
          } catch (fallbackErr) {
            if (!cancelled) {
              setError('Invalid barcode data');
              setLoading(false);
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError('Failed to load barcode library');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, type, compact, height, width, showValue]);

  if (!code) {
    return (
      <span className="text-xs text-muted-foreground">—</span>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-1 text-xs text-destructive ${className}`}>
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'min-w-[110px] max-w-[150px]' : 'w-full max-w-[280px]'} ${className}`}>
      {loading && (
        <div className="animate-pulse bg-muted h-8 rounded" />
      )}
      <svg
        ref={svgRef}
        className={`w-full ${loading ? 'hidden' : 'block'}`}
      />
    </div>
  );
}
