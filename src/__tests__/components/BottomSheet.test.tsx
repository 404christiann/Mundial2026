import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomSheet } from '@/components/ui/BottomSheet';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

describe('BottomSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <BottomSheet open={false} onClose={vi.fn()} title="Test">content</BottomSheet>
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders dialog with children when open', () => {
    render(
      <BottomSheet open={true} onClose={vi.fn()} title="Group A">
        <span>standings here</span>
      </BottomSheet>
    );
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('standings here')).toBeDefined();
    expect(screen.getByText('Group A')).toBeDefined();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open={true} onClose={onClose} title="Test">content</BottomSheet>
    );
    // backdrop is the first div sibling before the dialog
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open={true} onClose={onClose} title="Test">content</BottomSheet>
    );

    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
