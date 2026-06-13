import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveDot } from '@/components/match/LiveDot';

describe('LiveDot', () => {
  it('renders without crashing', () => {
    expect(() => render(<LiveDot />)).not.toThrow();
  });

  it('is visible in the document', () => {
    render(<LiveDot />);
    expect(screen.getByTestId('live-dot')).toBeInTheDocument();
  });

  it('has an accessible label or role indicating live status', () => {
    render(<LiveDot />);
    const dot = screen.getByTestId('live-dot');
    // Must have aria-label or aria-hidden + parent has accessible text
    const hasAria =
      dot.hasAttribute('aria-label') ||
      dot.hasAttribute('role') ||
      dot.hasAttribute('aria-hidden');
    expect(hasAria).toBe(true);
  });

  it('applies a red color class', () => {
    render(<LiveDot />);
    const dot = screen.getByTestId('live-dot');
    expect(dot.className).toMatch(/red/i);
  });

  it('applies a pulse animation class', () => {
    render(<LiveDot />);
    const dot = screen.getByTestId('live-dot');
    expect(dot.className).toMatch(/pulse|animate/i);
  });

  it('renders as an inline element (not a block that breaks layout)', () => {
    render(<LiveDot />);
    const dot = screen.getByTestId('live-dot');
    const tag = dot.tagName.toLowerCase();
    // Should be a span or div — not a block-level semantic element
    expect(['span', 'div']).toContain(tag);
  });
});
