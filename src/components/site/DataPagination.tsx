"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type DataPaginationProps = {
  /** 1-based current page */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** First item index on this page (1-based display) */
  rangeStart?: number;
  /** Last item index on this page (inclusive, 1-based display) */
  rangeEnd?: number;
  totalItems?: number;
  className?: string;
  /** When true, renders nothing if totalPages ≤ 1 */
  hideWhenSinglePage?: boolean;
};

function pageButtons(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: (number | "ellipsis")[] = [];
  out.push(1);
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) out.push("ellipsis");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("ellipsis");
  if (total > 1) out.push(total);
  return out;
}

const pageBtnBase =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40";

/**
 * Client-side pagination: squared controls, black active page, bordered inactive (reference layout).
 */
export function DataPagination({
  page,
  totalPages,
  onPageChange,
  rangeStart,
  rangeEnd,
  totalItems,
  className,
  hideWhenSinglePage,
}: DataPaginationProps) {
  if (hideWhenSinglePage && totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const pages = pageButtons(safePage, Math.max(1, totalPages));
  const summary: ReactNode =
    rangeStart != null && rangeEnd != null && totalItems != null && totalItems > 0 ? (
      <p className="text-center text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{rangeStart}</span>–
        <span className="font-medium text-foreground">{rangeEnd}</span> of{" "}
        <span className="font-medium text-foreground">{totalItems}</span>
      </p>
    ) : null;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {summary}
      <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
        <PaginationIconButton
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" strokeWidth={2} />
        </PaginationIconButton>

        {pages.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`e-${idx}`}
              className={cn(pageBtnBase, "border-border bg-card text-muted-foreground")}
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={item === safePage ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                pageBtnBase,
                item === safePage
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:bg-secondary",
              )}
            >
              {item}
            </button>
          ),
        )}

        <PaginationIconButton
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" strokeWidth={2} />
        </PaginationIconButton>
      </nav>
    </div>
  );
}

function PaginationIconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(pageBtnBase, "border-border bg-card text-foreground hover:bg-secondary", className)}
      {...props}
    />
  );
}
