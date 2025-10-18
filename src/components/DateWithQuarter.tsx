import { formatDateWithQuarter } from '../utils/quarterUtils';

interface DateWithQuarterProps {
  dateString: string | null | undefined;
  className?: string;
  fallbackText?: string;
  showQuarter?: boolean;
}

/**
 * Component to display a date with subtle quarter prefix
 * Quarter appears in muted color for subtle display
 */
export function DateWithQuarter({ 
  dateString, 
  className = '', 
  fallbackText = '-',
  showQuarter = true
}: DateWithQuarterProps) {
  const formatted = formatDateWithQuarter(dateString);
  
  // If it's a string (error case or dash), return as-is
  if (typeof formatted === 'string') {
    return <span className={className}>{formatted === '-' ? fallbackText : formatted}</span>;
  }
  
  // Render without quarter if showQuarter is false
  if (!showQuarter) {
    return <span className={className}>{formatted.date}</span>;
  }
  
  // Otherwise render with styled quarter
  return (
    <span className={className}>
      <span className="text-muted-foreground/40 mr-1">{formatted.quarter}</span>
      <span>{formatted.date}</span>
    </span>
  );
}
