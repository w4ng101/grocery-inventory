'use client';

import { useState, useEffect, useCallback } from 'react';
import type { InventorySummary, ExpiringProduct } from '@/types';

export function useInventory(initialParams: Record<string, string> = {}) {
  const [data, setData] = useState<InventorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [params, setParams] = useState(initialParams);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      const res = await window.fetch(`/api/inventory?${qs}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.pagination) setPagination(json.pagination);
      } else {
        setError(json.error);
      }
    } catch (e) {
      setError('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, error, pagination, params, setParams, refetch: fetch };
}

export function useExpiringProducts(params: Record<string, string> = {}) {
  const [data, setData] = useState<ExpiringProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, total_pages: 0 });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await window.fetch(`/api/expiry?${qs}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.pagination) setPagination(json.pagination);
      }
    } catch {
      setError('Failed to load expiry data');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, error, pagination, refetch: fetch };
}
