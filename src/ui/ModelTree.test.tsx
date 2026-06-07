// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelTree } from './ModelTree';
import type { Part } from '../contracts/sceneModel';

const parts: Part[] = [
  { id: 'p0', name: 'Cut001', positions: new Float32Array(), color: [1, 0, 0] },
  { id: 'p1', name: 'Solid 2', positions: new Float32Array() },
];

describe('ModelTree', () => {
  it('lists part names and fires toggle', () => {
    const onToggle = vi.fn();
    render(<ModelTree parts={parts} visibility={{ p0: true, p1: false }} selectedId={null} onToggle={onToggle} onSelect={() => {}} />);
    expect(screen.getByText('Cut001')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('toggle p0'));
    expect(onToggle).toHaveBeenCalledWith('p0');
  });
});
