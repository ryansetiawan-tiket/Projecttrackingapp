import { cn } from '../ui/utils';
import { getContrastColor } from '../../utils/colorUtils';

interface EventBarProps {
  title: string;
  status: string;
  statusColor: string;
  urgencyColor?: string | null;
  daysLeft?: number | null;
  isMultiDay?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
}

export function EventBar({
  title,
  status,
  statusColor,
  urgencyColor = null,
  daysLeft = null,
  isMultiDay = false,
  isStart = true,
  isEnd = true,
  onClick,
  onLongPress
}: EventBarProps) {
  const isDone = status === 'Done';
  const textColor = getContrastColor(statusColor);

  // Format days left badge text
  const getDaysLeftBadgeText = (): string | null => {
    if (status === 'Done' || daysLeft === null) return null;
    
    if (daysLeft < 0) {
      return `${Math.abs(daysLeft)}d over`;
    } else if (daysLeft === 0) {
      return 'Today';
    } else if (daysLeft <= 14) {
      return `${daysLeft}d`;
    }
    
    return null;
  };

  // Get darker version of urgency color for better contrast
  const getDarkerUrgencyColor = (color: string | null): string => {
    if (!color) return '#1F2937';
    
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const darkerR = Math.round(r * 0.6);
    const darkerG = Math.round(g * 0.6);
    const darkerB = Math.round(b * 0.6);
    
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(darkerR)}${toHex(darkerG)}${toHex(darkerB)}`;
  };

  const badgeText = getDaysLeftBadgeText();

  // Long press handling
  let pressTimer: NodeJS.Timeout | null = null;
  
  const handleTouchStart = () => {
    if (onLongPress) {
      pressTimer = setTimeout(() => {
        onLongPress();
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, 500);
    }
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  return (
    <button
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cn(
        "flex items-center h-8 min-h-[32px] px-2.5 transition-all touch-manipulation w-full",
        "hover:brightness-95 active:scale-[0.98]",
        isDone && "opacity-70"
      )}
      style={{
        backgroundColor: statusColor,
        color: textColor,
        borderRadius: isStart && isEnd ? '8px' : 
                      isStart ? '8px 0 0 8px' : 
                      isEnd ? '0 8px 8px 0' : '0',
        ...(urgencyColor && {
          border: `2px solid ${urgencyColor}`,
          boxShadow: `0 0 8px ${urgencyColor}40`
        })
      }}
    >
      {/* Multi-day indicator - start cap */}
      {isMultiDay && !isStart && (
        <div className="flex-shrink-0 mr-1">
          <div 
            className="w-1 h-4 rounded-full"
            style={{ backgroundColor: textColor, opacity: 0.4 }}
          />
        </div>
      )}
      
      {/* Urgency indicator dot */}
      {urgencyColor && (
        <div 
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 mr-1.5 ring-1 ring-white/30"
          style={{ backgroundColor: urgencyColor }}
        />
      )}
      
      {/* Days left badge */}
      {badgeText && (
        <div 
          className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 mr-1.5"
          style={{ 
            backgroundColor: urgencyColor ? `${urgencyColor}30` : 'rgba(255,255,255,0.15)',
            color: getDarkerUrgencyColor(urgencyColor),
            border: urgencyColor ? `1px solid ${urgencyColor}60` : 'none'
          }}
        >
          {badgeText}
        </div>
      )}
      
      {/* Title - truncated to 1 line */}
      <span className="flex-1 text-sm font-medium truncate text-left">
        {title}
      </span>
      
      {/* Multi-day indicator - end cap */}
      {isMultiDay && !isEnd && (
        <div className="flex-shrink-0 ml-1">
          <div 
            className="w-1 h-4 rounded-full"
            style={{ backgroundColor: textColor, opacity: 0.4 }}
          />
        </div>
      )}
    </button>
  );
}
