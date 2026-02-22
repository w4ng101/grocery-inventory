'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AnalyticsSummary, DailyRevenue, TopProduct, SlowMovingProduct } from '@/types';

export function useAnalyticsSummary() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await window.fetch('/api/analytics?type=summary');
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, isLoading, refetch: fetch };
}

export function useDailyRevenue(startDate?: string, endDate?: string) {
  const [data, setData] = useState<DailyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const qs = new URLSearchParams({
          type: 'daily_revenue',
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate }),
        }).toString();
        const res = await window.fetch(`/api/analytics?${qs}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [startDate, endDate]);

  return { data, isLoading };
}

export function useTopProducts(limit = 10, startDate?: string, endDate?: string) {
  const [data, setData] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const qs = new URLSearchParams({
          type: 'top_products',
          limit: limit.toString(),
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate }),
        }).toString();
        const res = await window.fetch(`/api/analytics?${qs}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [limit, startDate, endDate]);

  return { data, isLoading };
}

export function useSlowMovingProducts(days = 30) {
  const [data, setData] = useState<SlowMovingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await window.fetch(`/api/analytics?type=slow_moving&days=${days}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [days]);

  return { data, isLoading };
}
