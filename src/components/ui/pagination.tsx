import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageWindowSize = 4;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const visiblePageCount = Math.min(pageWindowSize, totalPages);
  const firstVisiblePage = Math.min(
    Math.max(1, safeCurrentPage - 1),
    totalPages - visiblePageCount + 1,
  );
  const pages = Array.from(
    { length: visiblePageCount },
    (_, index) => firstVisiblePage + index,
  );

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <span className="text-xs text-text-secondary">
        Halaman {safeCurrentPage} dari {totalPages}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          aria-label="Halaman sebelumnya"
          className="rounded-lg p-1.5 text-text transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => {
              if (page !== safeCurrentPage) onPageChange(page);
            }}
            aria-current={page === safeCurrentPage ? "page" : undefined}
            className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
              page === safeCurrentPage
                ? "bg-primary text-white"
                : "text-text hover:bg-background"
            }`}>
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() =>
            onPageChange(Math.min(totalPages, safeCurrentPage + 1))
          }
          disabled={safeCurrentPage === totalPages}
          aria-label="Halaman berikutnya"
          className="rounded-lg p-1.5 text-text transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
