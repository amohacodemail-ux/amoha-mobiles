import React from 'react';
import { formatProductName } from '@/lib/utils';

interface ProductNameDisplayProps {
  name: string;
  product?: any;
  className?: string;
}

export default function ProductNameDisplay({ name, product, className = '' }: ProductNameDisplayProps) {
  const formatted = formatProductName(name, product);
  
  const suffix = '\u00A0\u2013\u00A0Used\u00A0Phone';
  if (formatted.endsWith(suffix) || formatted.endsWith(' – Used Phone')) {
    const baseName = formatted.replace(suffix, '').replace(' – Used Phone', '');
    return (
      <span className={className}>
        {baseName}
        <span className="inline-block ml-2 align-middle rounded-full bg-blue-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 tracking-wider uppercase shadow-sm whitespace-nowrap" style={{ transform: 'translateY(-1px)' }}>
          USED PHONE
        </span>
      </span>
    );
  }
  
  return <span className={className}>{formatted}</span>;
}
