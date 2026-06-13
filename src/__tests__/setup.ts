import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { clearCache } from '@/lib/football/cache';

afterEach(() => { clearCache(); });
