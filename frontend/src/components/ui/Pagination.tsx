'use client';

import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-9 items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] px-2 text-xs font-medium text-gray-500 dark:text-gray-400 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-sm"
      >
        <HiChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {getPageNumbers().map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="flex h-9 w-7 items-center justify-center text-gray-600 sm:h-10 sm:w-8">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-all sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm ${
              currentPage === page
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                : 'border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-9 items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] px-2 text-xs font-medium text-gray-500 dark:text-gray-400 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-white/10 disabled:hover:bg-gray-50 dark:disabled:hover:bg-white/[0.04] disabled:hover:text-gray-500 sm:h-10 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-sm"
      >
        <span className="hidden sm:inline">Next</span>
        <HiChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

