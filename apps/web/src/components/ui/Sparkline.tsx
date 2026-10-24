import * as React from 'react';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: 'accent' | 'healthy' | 'warning' | 'critical' | 'muted';
  showArea?: boolean;
  className?: string;
}

const colorMap = {
  accent:   '#E05C28',
  healthy:  '#2E7D32',
  warning:  '#D4820A',
  critical: '#C0392B',
  muted:    '#8C877E',
};

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'accent',
  showArea = true,
  className,
}: SparklineProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const strokeColor = colorMap[color];

  React.useEffect(() => {
    if (!svgRef.current || data.length < 2) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, width]);
    const y = d3.scaleLinear()
      .domain([d3.min(data)! * 0.95, d3.max(data)! * 1.05])
      .range([height - 1, 1]);

    const line = d3.line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveCatmullRom.alpha(0.5));

    if (showArea) {
      const area = d3.area<number>()
        .x((_, i) => x(i))
        .y0(height)
        .y1((d) => y(d))
        .curve(d3.curveCatmullRom.alpha(0.5));

      svg.append('path')
        .datum(data)
        .attr('d', area)
        .attr('fill', strokeColor)
        .attr('fill-opacity', 0.1);
    }

    svg.append('path')
      .datum(data)
      .attr('d', line)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 1.5)
      .attr('fill', 'none');

    // Endpoint dot
    svg.append('circle')
      .attr('cx', x(data.length - 1))
      .attr('cy', y(data[data.length - 1]))
      .attr('r', 2)
      .attr('fill', strokeColor);
  }, [data, width, height, strokeColor, showArea]);

  if (data.length < 2) return <span className="text-xs text-ink-faint">—</span>;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    />
  );
}
