import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ZeroGauge } from '../components/ZeroGauge';

describe('ZeroGauge Component', () => {
  it('renders correctly at 0.0', () => {
    render(<ZeroGauge score={0.0} />);
    const scoreElement = screen.getByTestId('gauge-score');
    expect(scoreElement.textContent).toBe('0.00');
    
    const fillElement = screen.getByTestId('gauge-fill');
    // At 0.0, the dashoffset should equal circumference (approx 125.6 for md size r=20)
    // 2 * Math.PI * 20 = 125.66
    const dashoffset = parseFloat(fillElement.getAttribute('stroke-dashoffset') || '0');
    const dasharray = parseFloat(fillElement.getAttribute('stroke-dasharray') || '0');
    expect(dashoffset).toBeCloseTo(dasharray, 1);
  });

  it('renders correctly at 0.4 (the floor)', () => {
    const { unmount } = render(<ZeroGauge score={0.4} />);
    const scoreElement = screen.getByTestId('gauge-score');
    expect(scoreElement.textContent).toBe('0.40');
    
    const fillElement = screen.getByTestId('gauge-fill');
    const dashoffset = parseFloat(fillElement.getAttribute('stroke-dashoffset') || '0');
    const dasharray = parseFloat(fillElement.getAttribute('stroke-dasharray') || '0');
    
    // At 0.4, offset should be 60% of circumference
    expect(dashoffset).toBeCloseTo(dasharray * 0.6, 1);
    
    // Color should be dispute-amber
    expect(fillElement.getAttribute('stroke')).toBe('var(--dispute-amber)');
    unmount();
  });

  it('renders correctly at 1.0', () => {
    const { unmount } = render(<ZeroGauge score={1.0} />);
    const scoreElement = screen.getByTestId('gauge-score');
    expect(scoreElement.textContent).toBe('1.00');
    
    const fillElement = screen.getByTestId('gauge-fill');
    const dashoffset = parseFloat(fillElement.getAttribute('stroke-dashoffset') || '100');
    // At 1.0, offset should be 0
    expect(dashoffset).toBeCloseTo(0, 1);
    
    // Color should be signal-cyan
    expect(fillElement.getAttribute('stroke')).toBe('var(--signal-cyan)');
    unmount();
  });
});
