'use client';
import React, { useEffect, useRef } from 'react';

interface BarcodeVisualProps {
  code?: string;
  compact?: boolean;
}

/**
 * Renders a real machine-readable barcode (EAN-13, EAN-8, or Code 128) using JsBarcode.
 * Compatible with TVS BS-C103G and all standard 1D barcode scanners.
 */
export function BarcodeVisual({ code, compact = false }: BarcodeVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!code || !svgRef.current) return;
    let cancelled = false;
    const svg = svgRef.current;

    import('jsbarcode').then(({ default: JsBarcode }) => {
      if (cancelled || !svg) return;
      // Auto-detect format: EAN-13 for 13-digit numeric, EAN-8 for 8-digit, else Code 128
      const fmt = /^\d{13}$/.test(code) ? 'EAN13' : /^\d{8}$/.test(code) ? 'EAN8' : 'CODE128';
      const opts = {
        lineColor: '#111827',
        width: compact ? 1 : 1.5,
        height: compact ? 28 : 46,
        displayValue: true,
        fontSize: compact ? 8 : 11,
        margin: compact ? 3 : 6,
        background: 'transparent',
      };
      try {
        JsBarcode(svg, code, { format: fmt, ...opts });
      } catch {
        // Fallback: try Code 128 which accepts any ASCII string
        try {
          JsBarcode(svg, code, { format: 'CODE128', ...opts });
        } catch { /* truly invalid – leave blank */ }
      }
    }).catch(() => { /* CDN / network failure */ });

    return () => { cancelled = true; };
  }, [code, compact]);

  if (!code) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className={compact ? 'min-w-[110px] max-w-[150px]' : 'w-full max-w-[280px]'}>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}
