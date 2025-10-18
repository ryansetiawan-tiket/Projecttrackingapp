import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSnackbarSettings } from '../hooks/useSnackbarSettings';
import { getContrastColor } from '../utils/colorUtils';

export function SnackbarBanner() {
  const { snackbar, shouldShowSnackbar } = useSnackbarSettings();
  const [isDismissed, setIsDismissed] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);

  // Reset dismissed state when snackbar settings change
  useEffect(() => {
    // Generate a unique key for this snackbar configuration
    const snackbarKey = `snackbar-dismissed-${snackbar.text}-${snackbar.startDate}-${snackbar.endDate}`;
    
    // If banner is not dismissable, always show it and clear any existing dismissed state
    if (!snackbar.dismissable) {
      setIsDismissed(false);
      // Clear localStorage to clean up old dismissed state
      localStorage.removeItem(snackbarKey);
      return;
    }
    
    // Load dismissed state from localStorage
    const dismissed = localStorage.getItem(snackbarKey);
    setIsDismissed(dismissed === 'true');
  }, [snackbar.text, snackbar.startDate, snackbar.endDate, snackbar.dismissable]);

  // Handle auto-hide timer
  useEffect(() => {
    // Don't auto-hide if banner is not dismissable or if auto-hide is disabled
    if (!snackbar.autoHide || !snackbar.dismissable || !isVisible) {
      setProgress(100);
      return;
    }

    const duration = snackbar.autoHideDuration * 1000; // Convert to milliseconds
    const interval = 50; // Update every 50ms for smooth animation
    const decrement = (interval / duration) * 100;

    setProgress(100);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          handleDismiss();
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [snackbar.autoHide, snackbar.autoHideDuration, snackbar.dismissable, isVisible]);

  // Update visibility based on settings
  useEffect(() => {
    // If not dismissable, always show when shouldShowSnackbar is true
    // Otherwise, check if it's been dismissed
    const visible = shouldShowSnackbar() && (!snackbar.dismissable || !isDismissed);
    setIsVisible(visible);
  }, [shouldShowSnackbar, isDismissed, snackbar.dismissable]);

  const handleDismiss = () => {
    // Only allow dismissing if banner is dismissable
    if (!snackbar.dismissable) {
      return;
    }
    
    setIsDismissed(true);
    const snackbarKey = `snackbar-dismissed-${snackbar.text}-${snackbar.startDate}-${snackbar.endDate}`;
    localStorage.setItem(snackbarKey, 'true');
  };

  // Get icon based on preset
  const getPresetIcon = () => {
    switch (snackbar.icon.value) {
      case 'info':
        return <Info className="h-5 w-5 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 flex-shrink-0" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 flex-shrink-0" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 flex-shrink-0" />;
      default:
        return null;
    }
  };

  // Render icon
  const renderIcon = () => {
    if (snackbar.icon.type === 'none' || !snackbar.icon.value) {
      return null;
    }

    if (snackbar.icon.type === 'preset') {
      return getPresetIcon();
    }

    if (snackbar.icon.type === 'emoji') {
      return (
        <span className="text-xl flex-shrink-0" role="img" aria-label="icon">
          {snackbar.icon.value}
        </span>
      );
    }

    if (snackbar.icon.type === 'image') {
      return (
        <img 
          src={snackbar.icon.value} 
          alt="Banner icon" 
          className="h-5 w-5 flex-shrink-0 object-contain"
        />
      );
    }

    return null;
  };

  if (!isVisible) return null;

  // Calculate text color based on auto contrast setting
  const textColor = snackbar.useAutoContrast 
    ? getContrastColor(snackbar.backgroundColor)
    : snackbar.textColor;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full rounded-lg"
        style={{
          backgroundColor: snackbar.backgroundColor,
          color: textColor,
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Icon + Text */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {renderIcon()}
              
              <p className="flex-1 min-w-0">
                {snackbar.text}
              </p>
            </div>

            {/* Close button */}
            {snackbar.dismissable && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Dismiss announcement"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Auto-hide progress bar - only show if dismissable AND auto-hide enabled */}
        {snackbar.autoHide && snackbar.dismissable && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30"
            style={{ width: `${progress}%` }}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
