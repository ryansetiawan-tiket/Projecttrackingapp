// Chart Data Formatters for Recharts

import { 
  StatusDistribution, 
  VerticalDistribution, 
  TypeDistribution,
  MonthDistribution,
  QuarterDistribution 
} from '../types/stats';

// ============================================================================
// PIE CHART FORMATTERS
// ============================================================================

export function formatForPieChart(data: VerticalDistribution[] | TypeDistribution[] | StatusDistribution[]) {
  return data.map(item => ({
    name: 'vertical' in item ? item.vertical : 'type' in item ? item.type : item.status,
    value: item.count,
    fill: item.color,
    percentage: item.percentage
  }));
}

// ============================================================================
// BAR CHART FORMATTERS
// ============================================================================

export function formatForBarChart(data: StatusDistribution[] | TypeDistribution[]) {
  return data.map(item => ({
    name: 'status' in item ? item.status : item.type,
    value: item.count,
    fill: item.color,
    percentage: item.percentage
  }));
}

export function formatForHorizontalBarChart(data: StatusDistribution[]) {
  return data.map(item => ({
    name: item.status,
    value: item.count,
    fill: item.color,
    percentage: item.percentage,
    // For horizontal bar charts, we might want the label on the left
    label: `${item.status} (${item.count})`
  }));
}

// ============================================================================
// LINE CHART FORMATTERS
// ============================================================================

export function formatForLineChart(data: MonthDistribution[]) {
  return data.map(item => ({
    name: `${item.month} ${item.year}`,
    value: item.count,
    month: item.month,
    year: item.year
  }));
}

// ============================================================================
// TIMELINE/QUARTER FORMATTERS
// ============================================================================

export function formatForQuarterChart(data: QuarterDistribution[]) {
  return data.map(item => ({
    name: item.quarter,
    value: item.count,
    quarter: item.quarterNumber,
    year: item.year,
    projects: item.projects
  }));
}

// ============================================================================
// DONUT CHART FORMATTERS (with center text)
// ============================================================================

export function formatForDonutChart(
  data: VerticalDistribution[] | TypeDistribution[],
  centerText?: string
) {
  return {
    data: formatForPieChart(data),
    centerText: centerText || `${data.length} Total`
  };
}

// ============================================================================
// CHART COLOR PALETTE
// ============================================================================

export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: 'hsl(150, 60%, 50%)',
  warning: 'hsl(45, 100%, 60%)',
  danger: 'hsl(0, 70%, 50%)',
  info: 'hsl(210, 70%, 50%)',
  muted: 'hsl(var(--muted-foreground))',
  
  // Chart specific colors
  chart1: 'hsl(280, 80%, 60%)',
  chart2: 'hsl(200, 80%, 50%)',
  chart3: 'hsl(150, 80%, 45%)',
  chart4: 'hsl(45, 100%, 60%)',
  chart5: 'hsl(350, 80%, 60%)',
  chart6: 'hsl(270, 70%, 55%)',
  chart7: 'hsl(180, 70%, 50%)',
  chart8: 'hsl(120, 70%, 45%)',
};

export const CHART_COLOR_ARRAY = [
  CHART_COLORS.chart1,
  CHART_COLORS.chart2,
  CHART_COLORS.chart3,
  CHART_COLORS.chart4,
  CHART_COLORS.chart5,
  CHART_COLORS.chart6,
  CHART_COLORS.chart7,
  CHART_COLORS.chart8,
];

// ============================================================================
// CHART HELPERS
// ============================================================================

export function getChartColor(index: number): string {
  return CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length];
}

export function formatChartTooltip(value: number, name: string): string {
  return `${name}: ${value}`;
}

export function formatPercentageLabel(percentage: number): string {
  return `${percentage}%`;
}

// ============================================================================
// RESPONSIVE CHART DIMENSIONS
// ============================================================================

export function getResponsiveChartHeight(isMobile: boolean): number {
  return isMobile ? 200 : 300;
}

export function getResponsiveChartWidth(isMobile: boolean): string {
  return '100%';
}

// ============================================================================
// CHART DATA VALIDATORS
// ============================================================================

export function hasChartData(data: any[]): boolean {
  return data && data.length > 0;
}

export function getTotalFromChartData(data: Array<{ value: number }>): number {
  return data.reduce((sum, item) => sum + item.value, 0);
}

// ============================================================================
// CHART AXIS FORMATTERS
// ============================================================================

export function formatYAxisTick(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

export function formatXAxisTick(value: string, maxLength: number = 10): string {
  if (value.length > maxLength) {
    return value.substring(0, maxLength) + '...';
  }
  return value;
}

// ============================================================================
// PROGRESS/COMPLETION FORMATTERS
// ============================================================================

export function formatProgressData(completed: number, total: number) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    completed,
    remaining: total - completed,
    total,
    percentage,
    data: [
      { name: 'Completed', value: completed, fill: CHART_COLORS.success },
      { name: 'Remaining', value: total - completed, fill: CHART_COLORS.muted }
    ]
  };
}

// ============================================================================
// DISTRIBUTION FORMATTERS
// ============================================================================

export function formatDistributionData(
  items: Array<{ range: string; count: number }>,
  colors?: string[]
) {
  return items.map((item, index) => ({
    name: item.range,
    value: item.count,
    fill: colors ? colors[index] : getChartColor(index)
  }));
}

// ============================================================================
// LEGEND FORMATTERS
// ============================================================================

export function formatLegendValue(value: string, entry: any): string {
  const percentage = entry.payload?.percentage;
  if (percentage !== undefined) {
    return `${value} (${percentage}%)`;
  }
  return value;
}

// ============================================================================
// EMPTY STATE HELPERS
// ============================================================================

export function getEmptyChartMessage(dataType: string): string {
  const messages: Record<string, string> = {
    projects: 'No projects to display',
    assets: 'No assets to display',
    collaborators: 'No collaborators to display',
    actions: 'No actions to display',
    default: 'No data available'
  };
  
  return messages[dataType] || messages.default;
}
