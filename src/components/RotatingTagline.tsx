import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * RotatingTagline Component
 * 
 * Displays a fun rotating tagline that changes every 30 minutes AND on every refresh.
 * 
 * How it works:
 * - On page load/refresh: Shows a random tagline
 * - Every 30 minutes: Rotates to the next tagline sequentially
 * - This gives variety on each visit while maintaining predictable rotation in a session
 * 
 * To edit messages: Simply modify the TAGLINES array below.
 * To change rotation frequency: Modify ROTATION_MINUTES constant.
 */

// Configuration: How often to rotate messages (in minutes)
const ROTATION_MINUTES = 30;

// 50 Fun English taglines - Feel free to edit these!
const TAGLINES = [
  "Tracking projects like a boss since... well, today probably",
  "Where deadlines come to negotiate",
  "Your friendly neighborhood chaos organizer",
  "Making project management slightly less painful",
  "Because sticky notes were getting out of hand",
  "Turning 'I'll do it later' into 'I did it yesterday'",
  "Where assets go to become legends",
  "Professional procrastination prevention system",
  "Deadline whisperer and timeline tamer",
  "Organizing chaos, one project at a time",
  "Your projects called, they want updates",
  "Making Gantt charts look like child's play",
  "Where 'urgent' actually means urgent",
  "Transforming coffee into completed projects",
  "The app your PM wishes they had thought of",
  "Because Excel spreadsheets just weren't cutting it",
  "Powered by deadlines and determination",
  "Where multitasking meets actual tracking",
  "Your projects deserve better than a napkin",
  "Making 'organized mess' an oxymoron",
  "Deadline survivor headquarters",
  "Where timelines fear to be ignored",
  "Project status: It's complicated, but organized",
  "Turning panic into progress since today",
  "Your assets are showing, better track them",
  "Because forgetting tasks is so last season",
  "Where collaboration meets organization",
  "Making timelines great again",
  "Project tracking without the existential dread",
  "Your future self will thank you for this",
  "Deadline anxiety management system",
  "Where projects come to life, not die",
  "Making Mondays slightly more bearable",
  "Because your brain has better things to remember",
  "Project management with a side of sanity",
  "Where status updates actually happen",
  "Turning chaos into colorful organized chaos",
  "Your productivity comfort zone",
  "Making project managers look good since now",
  "Where timelines go from scary to manageable",
  "Because winging it isn't a strategy",
  "Project tracking: Now with less stress",
  "Where assets meet their deadlines",
  "Organized confusion at its finest",
  "Making progress visible, one project at a time",
  "Your projects' favorite tracking app",
  "Because someone has to keep track",
  "Where deliverables actually get delivered",
  "Project management minus the management fees",
  "Turning 'someday' into 'this Tuesday'"
];

/**
 * Get a random tagline index for initial load
 * Each refresh will show a different random tagline
 */
function getRandomTaglineIndex(): number {
  return Math.floor(Math.random() * TAGLINES.length);
}

/**
 * Calculate milliseconds until next rotation
 */
function getMillisecondsUntilNextRotation(): number {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const currentSlotMinutes = Math.floor(minutes / ROTATION_MINUTES) * ROTATION_MINUTES;
  const nextSlotMinutes = currentSlotMinutes + ROTATION_MINUTES;
  
  const minutesUntilNext = nextSlotMinutes - minutes;
  return minutesUntilNext * 60 * 1000 - (now.getSeconds() * 1000 + now.getMilliseconds());
}

export function RotatingTagline() {
  const [currentIndex, setCurrentIndex] = useState(getRandomTaglineIndex());
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Update tagline every 30 minutes, rotating sequentially
    const scheduleNextUpdate = () => {
      const msUntilNext = getMillisecondsUntilNextRotation();
      
      return setTimeout(() => {
        setIsAnimating(true);
        // Small delay before updating to allow exit animation
        setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % TAGLINES.length);
          setIsAnimating(false);
        }, 150);
        
        // Schedule next update
        scheduleNextUpdate();
      }, msUntilNext);
    };

    const timeoutId = scheduleNextUpdate();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="overflow-hidden max-w-full">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-xs sm:text-sm text-muted-foreground line-clamp-2 pr-2"
        >
          {TAGLINES[currentIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
