import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface UseScrollPaginationOptions<T> {
  /** All items after filtering/searching (for client-side scroll pagination fallback) */
  items?: T[];
  /** Batch size per page (default: 15) */
  pageSize?: number;
  /** Server-side fetch function: receives (page, pageSize). Returns data array, total count, and optional meta/summary */
  fetchPage?: (page: number, pageSize: number) => Promise<{ data: T[]; total?: number; summary?: any; [key: string]: any }>;
  /** Legacy alias for fetchPage: (page: number) => Promise<{ data: T[]; total?: number; hasMore?: boolean }> */
  fetchMore?: (page: number) => Promise<{ data: T[]; total?: number; hasMore?: boolean; [key: string]: any }>;
  /** Optional initial server total count */
  serverTotal?: number;
  /** Whether the initial query is loading */
  isLoading?: boolean;
  /** Dependency array: when these change (e.g. search query, tab, status filter), pagination resets to page 1 and re-fetches */
  deps?: any[];
  /** Callback when a page completes loading (passes full response & page number) */
  onPageLoaded?: (response: any, page: number) => void;
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
  /** Combined loading state (initial loading or external loading) */
  isLoading: boolean;
  /** Manual trigger to load next batch */
  loadMore: () => void;
  /** Reset pagination back to page 1 */
  reset: () => void;
  /** Re-fetch page 1 in server mode */
  reload: () => void;
  /** Update server records state directly (e.g. status updates) */
  setRecords: React.Dispatch<React.SetStateAction<T[]>>;
  /** Ref to place on sentinel element below table */
  sentinelRef: (node: HTMLElement | null) => void;
}

export function useScrollPagination<T>({
  items,
  pageSize = 15,
  fetchPage,
  fetchMore,
  serverTotal = 0,
  isLoading = false,
  deps = [],
  onPageLoaded,
}: UseScrollPaginationOptions<T>): UseScrollPaginationReturn<T> {
  const isClientSide = Array.isArray(items);
  const [serverRecords, setServerRecords] = useState<T[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(serverTotal);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [serverLoading, setServerLoading] = useState<boolean>(!isClientSide);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreLock = useRef<boolean>(false);

  // Normalize fetcher: fetchPage has priority, fallback to fetchMore
  const fetchFn = useMemo(() => {
    if (fetchPage) return fetchPage;
    if (fetchMore) return (p: number) => fetchMore(p);
    return undefined;
  }, [fetchPage, fetchMore]);

  // Client-side items slicing vs server-side accumulated records
  const visibleItems = useMemo(() => {
    if (isClientSide) {
      return items.slice(0, page * pageSize);
    }
    return serverRecords;
  }, [items, isClientSide, page, pageSize, serverRecords]);

  const resolvedTotal = isClientSide ? items.length : totalCount;

  const hasMore = useMemo(() => {
    if (isClientSide) {
      return visibleItems.length < resolvedTotal;
    }
    return visibleItems.length < resolvedTotal && resolvedTotal > 0;
  }, [isClientSide, visibleItems.length, resolvedTotal]);

  const activeFetchReqId = useRef<number>(0);

  // Server-side initial fetch & refetch on deps change
  const executeInitialFetch = useCallback(() => {
    if (isClientSide || !fetchFn) return;

    const reqId = ++activeFetchReqId.current;
    setServerLoading(true);
    setPage(1);

    fetchFn(1, pageSize)
      .then((res: any) => {
        if (reqId !== activeFetchReqId.current) return;
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const total = typeof res?.total === 'number' ? res.total : data.length;
        setServerRecords(data);
        setTotalCount(total);
        onPageLoaded?.(res, 1);
      })
      .catch((err: any) => {
        if (reqId !== activeFetchReqId.current) return;
        console.error('[useScrollPagination] Fetch page 1 error:', err);
      })
      .finally(() => {
        if (reqId === activeFetchReqId.current) {
          setServerLoading(false);
        }
      });
  }, [isClientSide, fetchFn, pageSize, onPageLoaded]);

  useEffect(() => {
    if (isClientSide) {
      setPage(1);
    } else {
      executeInitialFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClientSide, executeInitialFetch, ...deps]);

  // Load next batch
  const loadMore = useCallback(async () => {
    const isCurrentlyLoading = isClientSide ? isLoading : (serverLoading || isLoading);
    if (loadingMore || isCurrentlyLoading || !hasMore || loadMoreLock.current) return;

    loadMoreLock.current = true;
    setLoadingMore(true);

    if (isClientSide) {
      // Gentle 200ms simulated async tick so skeleton loaders smoothly bridge batches
      setTimeout(() => {
        setPage((prev) => prev + 1);
        setLoadingMore(false);
        loadMoreLock.current = false;
      }, 200);
    } else if (fetchFn) {
      const nextPage = page + 1;
      try {
        const res: any = await fetchFn(nextPage, pageSize);
        const nextData = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (typeof res?.total === 'number') {
          setTotalCount(res.total);
        }
        setServerRecords((prev) => [...prev, ...nextData]);
        setPage(nextPage);
        onPageLoaded?.(res, nextPage);
      } catch (err) {
        console.error('[useScrollPagination] Load more page error:', err);
      } finally {
        setLoadingMore(false);
        loadMoreLock.current = false;
      }
    } else {
      setLoadingMore(false);
      loadMoreLock.current = false;
    }
  }, [
    isClientSide,
    isLoading,
    serverLoading,
    loadingMore,
    hasMore,
    fetchFn,
    page,
    pageSize,
    onPageLoaded,
  ]);

  const reset = useCallback(() => {
    setPage(1);
    if (!isClientSide) {
      executeInitialFetch();
    }
  }, [isClientSide, executeInitialFetch]);

  const reload = useCallback(() => {
    if (!isClientSide) {
      executeInitialFetch();
    } else {
      setPage(1);
    }
  }, [isClientSide, executeInitialFetch]);

  // IntersectionObserver callback ref for sentinel
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      const isBusy = isClientSide ? (loadingMore || isLoading) : (loadingMore || serverLoading || isLoading);

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const first = entries[0];
          if (first && first.isIntersecting && hasMore && !isBusy) {
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
    [hasMore, isClientSide, loadingMore, serverLoading, isLoading, loadMore]
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
    totalCount: resolvedTotal,
    hasMore,
    loadingMore,
    isLoading: isClientSide ? isLoading : (serverLoading || isLoading),
    loadMore,
    reset,
    reload,
    setRecords: setServerRecords,
    sentinelRef,
  };
}
