// specs/006 T021: ProgressTrail xác định / không xác định (contracts/motion-ui-contract.md §3).
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressTrail } from './ProgressTrail';

describe('ProgressTrail', () => {
  it('xác định: progressbar có nhãn, aria-valuenow / aria-valuemax', () => {
    render(<ProgressTrail value={2} max={4} label="Đã quét QR: 2/4 điểm" />);
    const bar = screen.getByRole('progressbar', { name: 'Đã quét QR: 2/4 điểm' });
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
  });

  it('không xác định: không aria-valuenow, không số', () => {
    render(<ProgressTrail indeterminate label="Đang tải" />);
    const bar = screen.getByRole('progressbar', { name: 'Đang tải' });
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    expect(bar.textContent).toBe('');
  });
});
