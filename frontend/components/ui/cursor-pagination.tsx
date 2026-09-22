"use client";

import React from "react";
import { Button } from "./button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export interface CursorPaginationProps {
  limit: number;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  currentPage: number;
  totalItems?: number;
  currentCount?: number;
  isLoading?: boolean;
}

export function CursorPagination({
  limit,
  onLimitChange,
  limitOptions = [10, 20, 50],
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  currentPage,
  totalItems,
  currentCount,
  isLoading = false,
}: CursorPaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-surface border-t border-border text-sm">
      {/* Items info and limit dropdown */}
      <div className="flex items-center gap-4 text-surface-foreground/70">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={isLoading}
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          {totalItems !== undefined ? (
            <span>
              Page {currentPage} &bull; {currentCount ?? 0} of {totalItems} items
            </span>
          ) : (
            <span>
              Page {currentPage}
              {currentCount !== undefined && ` (${currentCount} items)`}
            </span>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />}
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!hasPreviousPage || isLoading}
          className="h-8 px-3 text-xs flex items-center gap-1 border-border/80 hover:bg-surface-hover"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </Button>
        <span className="text-xs px-2 font-medium text-surface-foreground/60">
          Page {currentPage}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage || isLoading}
          className="h-8 px-3 text-xs flex items-center gap-1 border-border/80 hover:bg-surface-hover"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
