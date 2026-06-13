'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLocalTimeZone } from '@/lib/time';

export function TimezoneDetector() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const detected = getLocalTimeZone();
    const current = params.get('tz') ?? 'America/Los_Angeles';
    if (detected && detected !== current) {
      const next = new URLSearchParams(params.toString());
      next.set('tz', detected);
      router.replace(`/schedule?${next.toString()}`);
    }
  }, []); // run once on mount
  return null;
}
