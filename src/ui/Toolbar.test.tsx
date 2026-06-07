// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from './Toolbar';

const baseProps = {
  displayMode: 'shaded-edges' as const,
  quality: 'normal' as const,
  hasModel: true,
  section: false,
  measure: false,
  sectionAxis: 'z' as const,
  sectionOffset: 0,
  sectionRange: [0, 1] as [number, number],
  onView: vi.fn(),
  onFit: vi.fn(),
  onDisplayMode: vi.fn(),
  onToggleSection: vi.fn(),
  onSectionAxis: vi.fn(),
  onSectionOffset: vi.fn(),
  onToggleMeasure: vi.fn(),
  onQuality: vi.fn(),
  onScreenshot: vi.fn(),
  onClearModel: vi.fn(),
};

describe('Toolbar', () => {
  it('emits clear when the user wants to open another file', () => {
    const onClearModel = vi.fn();
    render(<Toolbar {...baseProps} onClearModel={onClearModel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open another' }));

    expect(onClearModel).toHaveBeenCalledTimes(1);
  });
});
