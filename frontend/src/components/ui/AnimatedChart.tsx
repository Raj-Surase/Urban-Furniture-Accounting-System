import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardBody, ButtonGroup, Button, Chip } from '@heroui/react';
import { Activity, BarChart2, LineChart as LineChartIcon, Zap } from 'lucide-react';

export interface DataPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface AnimatedChartProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  color?: string;
  height?: number;
}

export const AnimatedChart: React.FC<AnimatedChartProps> = ({
  title,
  subtitle,
  data,
  color = '#3b82f6',
  height = 240,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = 700;
  const chartHeight = height;

  // Compute SVG coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.value / maxValue) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  // Area & Line Path (Cubic Bezier Spline)
  const createSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const linePath = createSmoothPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  return (
    <Card className="border border-border/50 dark:border-white/[0.08] bg-card/85 backdrop-blur-xl shadow-hero-card rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 sm:px-7 pt-6 sm:pt-7">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 font-sans">
              <Activity className="w-4 h-4 text-primary" />
              {title}
            </h3>
            <Chip size="sm" color="primary" variant="flat" className="text-xs font-semibold">
              Live Realtime Feed
            </Chip>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ButtonGroup size="sm" variant="flat" className="bg-sidebar-accent/50 p-0.5 rounded-xl border border-border/40">
            <Button
              isIconOnly
              color={chartType === 'area' ? 'primary' : 'default'}
              onClick={() => setChartType('area')}
              title="Area Line Chart"
              className="rounded-lg h-7 w-7"
            >
              <LineChartIcon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              color={chartType === 'bar' ? 'primary' : 'default'}
              onClick={() => setChartType('bar')}
              title="Bar Chart"
              className="rounded-lg h-7 w-7"
            >
              <BarChart2 className="w-4 h-4" />
            </Button>
          </ButtonGroup>
        </div>
      </CardHeader>

      <CardBody className="p-6 sm:p-7 pt-2">
        <div className="relative w-full overflow-hidden select-none">
          {/* Tooltip overlay */}
          <AnimatePresence>
            {hoveredPoint && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-2 right-4 z-20 pointer-events-none bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg backdrop-blur flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">{hoveredPoint.label}:</span>
                <span className="font-mono font-bold text-blue-300">
                  {hoveredPoint.value.toLocaleString()} items / reqs
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SVG Viewport */}
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible"
            style={{ maxHeight: height }}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Subtle Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-gray-200 dark:text-gray-800"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-gray-400 font-mono"
                  >
                    {Math.round(maxValue * ratio)}
                  </text>
                </g>
              );
            })}

            {/* Render Area or Bar Chart */}
            {chartType === 'area' ? (
              <g>
                {/* Area Gradient */}
                <motion.path
                  d={areaPath}
                  fill="url(#areaGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                />

                {/* Smooth Animated Line */}
                <motion.path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />

                {/* Data Points */}
                {points.map((pt, i) => (
                  <g
                    key={i}
                    onMouseEnter={() => {
                      setHoveredPoint(pt);
                      setHoveredIndex(i);
                    }}
                    onMouseLeave={() => {
                      setHoveredPoint(null);
                      setHoveredIndex(null);
                    }}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredIndex === i ? 6 : 4}
                      className="fill-white dark:fill-gray-900 transition-all duration-150"
                      stroke={color}
                      strokeWidth="2.5"
                    />
                    {hoveredIndex === i && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="12"
                        fill={color}
                        opacity="0.2"
                        className="animate-ping"
                      />
                    )}
                  </g>
                ))}
              </g>
            ) : (
              /* Bar Chart */
              <g>
                {points.map((pt, i) => {
                  const barWidth = Math.max(12, ((chartWidth - paddingX * 2) / points.length) * 0.6);
                  const barHeight = (pt.value / maxValue) * (chartHeight - paddingY * 2);
                  const barY = chartHeight - paddingY - barHeight;

                  return (
                    <g
                      key={i}
                      onMouseEnter={() => {
                        setHoveredPoint(pt);
                        setHoveredIndex(i);
                      }}
                      onMouseLeave={() => {
                        setHoveredPoint(null);
                        setHoveredIndex(null);
                      }}
                      className="cursor-pointer group"
                    >
                      <motion.rect
                        x={pt.x - barWidth / 2}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        fill="url(#barGradient)"
                        initial={{ height: 0, y: chartHeight - paddingY }}
                        animate={{ height: barHeight, y: barY }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="transition-all hover:brightness-110"
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* X-Axis Labels */}
            {points.map((pt, i) => (
              <text
                key={i}
                x={pt.x}
                y={chartHeight - 10}
                textAnchor="middle"
                className="text-[11px] fill-gray-500 font-medium select-none"
              >
                {pt.label}
              </text>
            ))}
          </svg>
        </div>
      </CardBody>
    </Card>
  );
};

