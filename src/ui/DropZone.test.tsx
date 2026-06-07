// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropZone } from './DropZone';

describe('DropZone', () => {
  it('shows demo buttons when empty and emits a pick with the full filename', () => {
    const onPickDemo = vi.fn();
    render(<DropZone empty onFile={() => {}} onPickDemo={onPickDemo} />);
    fireEvent.click(screen.getByText('lego_brick (FCStd)'));
    expect(onPickDemo).toHaveBeenCalledWith('lego_brick.fcstd');

    fireEvent.click(screen.getByText('bolt_m16 (STL)'));
    expect(onPickDemo).toHaveBeenCalledWith('bolt_m16.stl');
  });

  it('emits onFile when a file is dropped', () => {
    const onFile = vi.fn();
    render(<DropZone empty onFile={onFile} onPickDemo={() => {}} />);
    const file = new File([new Uint8Array([1, 2, 3])], 'x.stl');
    const dz = screen.getByTestId('dropzone');
    fireEvent.drop(dz, { dataTransfer: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
  });
});
