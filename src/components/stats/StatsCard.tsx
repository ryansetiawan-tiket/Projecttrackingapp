import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LucideIcon } from 'lucide-react';
import { formatDaysToMonthsDays } from '../../utils/statsCalculations';

interface StatsCardProps {
  title?: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon | string; // Support both Lucide icons and emoji strings
  trend?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  children?: ReactNode;
  className?: string;
  isDuration?: boolean;
  // New props for Overview redesign
  label?: string;
  unit?: string;
  comment?: string;
  color?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  children,
  className = '',
  isDuration = false,
  label,
  unit,
  comment,
  color = 'text-blue-400'
}: StatsCardProps) {
  // Format value if it's a duration (number of days)
  const displayValue = isDuration && typeof value === 'number' 
    ? formatDaysToMonthsDays(value)
    : value;

  // New compact style for Overview tab
  if (label || comment) {
    const IconComponent = typeof icon === 'function' ? icon : null;
    const emojiIcon = typeof icon === 'string' ? icon : null;

    return (
      <Card className={className}>
        <CardContent className="p-6 space-y-3 text-center">
          {/* Icon */}
          {emojiIcon && <div className="text-4xl">{emojiIcon}</div>}
          {IconComponent && <IconComponent className="h-10 w-10 mx-auto text-muted-foreground" />}
          
          {/* Big Number */}
          <div className={`text-3xl font-bold ${color}`}>{displayValue}</div>
          
          {/* Unit */}
          {unit && (
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {unit}
            </div>
          )}
          
          {/* Label */}
          {label && (
            <div className="text-sm font-medium">
              {label}
            </div>
          )}
          
          {/* Fun Comment */}
          {comment && (
            <div className="text-xs text-muted-foreground italic">
              "{comment}"
            </div>
          )}
          
          {children}
        </CardContent>
      </Card>
    );
  }

  // Original style for other tabs
  const IconComponent = typeof icon === 'function' ? icon : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
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