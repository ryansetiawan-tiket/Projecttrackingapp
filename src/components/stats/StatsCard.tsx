import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LucideIcon } from 'lucide-react';
import { formatDaysToMonthsDays } from '../../utils/statsCalculations';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  children?: ReactNode;
  className?: string;
  isDuration?: boolean; // New prop to indicate duration formatting
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  children,
  className = '',
  isDuration = false
}: StatsCardProps) {
  // Format value if it's a duration (number of days)
  const displayValue = isDuration && typeof value === 'number' 
    ? formatDaysToMonthsDays(value)
    : value;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-3xl font-bold">{displayValue}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <Badge 
              variant={
                trend.type === 'positive' ? 'default' : 
                trend.type === 'negative' ? 'destructive' : 
                'secondary'
              }
              className="text-xs"
            >
              {trend.value}
            </Badge>
          )}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}