import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface UseScrollPaginationOptions<T> {
  /** All items after filtering/searching (for client-side scroll pagination) */
  items?: T[];
  /** Batch size per page (default: 15) */
  pageSize?: number;
  /** Optional server-side fetch function */
  fetchMore?: (page: number) => Promise<{ data: T[]; total?: number; hasMore?: boolean }>;
  /** Optional total count if known (e.g. from server metadata) */
  serverTotal?: number;
  /** Whether the initial query is loading */
  isLoading?: boolean;
}

export interface UseScrollPaginationReturn<T> {
  /** Items to render in the table */
  visibleItems: T[];
  /** Current page index (1-indexed) */
  page: number;
  /** Number of items per batch */
  pageSize: number;
  /** Total count of items matching filters */
  totalCount: number;
  /** Whether more records exist */
  hasMore: boolean;
  /** Whether currently appending next batch */
  loadingMore: boolean;
  /** Manual trigger to load next batch */
  loadMore: () => void;
  /** Reset pagination back to page 1 */
  reset: () => void;
  /** Ref to place on sentinel element below table */
  sentinelRef: (node: HTMLElement | null) => void;
}

export function useScrollPagination<T>({
  items,
  pageSize = 15,
  fetchMore,
  serverTotal,
  isLoading = false,
}: UseScrollPaginationOptions<T>): UseScrollPaginationReturn<T> {
  const [page, setPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // If client-side items array is provided
  const isClientSide = Array.isArray(items);
  const totalCount = isClientSide ? items.length : (serverTotal ?? 0);

  const visibleItems = useMemo(() => {
    if (isClientSide) {
      return items.slice(0, page * pageSize);
    }
    return [];
  }, [items, isClientSide, page, pageSize]);

  const hasMore = useMemo(() => {
    if (isClientSide) {
      return visibleItems.length < totalCount;
    }
    return false;
  }, [isClientSide, visibleItems.length, totalCount]);

  const loadMoreLock = useRef<boolean>(false);

  const loadMore = useCallback(async () => {
    if (loadingMore || isLoading || !hasMore || loadMoreLock.current) return;

    loadMoreLock.current = true;
    setLoadingMore(true);

    if (isClientSide) {
      // Gentle 220ms simulated async tick so skeleton loaders smoothly bridge batches
      setTimeout(() => {
        setPage((prev) => prev + 1);
        setLoadingMore(false);
        loadMoreLock.current = false;
      }, 220);
    } else if (fetchMore) {
      try {
        await fetchMore(page + 1);
        setPage((prev) => prev + 1);
      } catch (err) {
        console.error('Failed to fetch more records:', err);
      } finally {
        setLoadingMore(false);
        loadMoreLock.current = false;
      }
    } else {
      setLoadingMore(false);
      loadMoreLock.current = false;
    }
  }, [loadingMore, isLoading, hasMore, isClientSide, fetchMore, page]);

  // Reset to page 1 when items array length changes or reference changes (e.g. search/filter updated)
  useEffect(() => {
    if (isClientSide) {
      setPage(1);
    }
  }, [items]);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  // IntersectionObserver callback ref for sentinel
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const first = entries[0];
          if (first && first.isIntersecting && hasMore && !loadingMore && !isLoading) {
            loadMore();
          }
        },
        {
          root: null,
          rootMargin: '250px', // Pre-load 250px before reaching bottom
          threshold: 0.1,
        }
      );

      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, isLoading, loadMore]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    visibleItems,
    page,
    pageSize,
    totalCount,
    hasMore,
    loadingMore,
    loadMore,
    reset,
    sentinelRef,
  };
}

