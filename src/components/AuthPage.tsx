import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  onBack?: () => void;
}

// Fun message sets - 30 variants that all match together
const MESSAGE_SETS = [
  {
    title: "Look who's back!",
    subtitle: "Your projects missed you. They said so. Seriously.",
    backText: "Nah, take me back",
    passwordLabel: "Secret code",
    passwordPlaceholder: "The one you always forget",
    signInButton: "Let's go!",
    proTip: "Pro tip: If you forgot your password, good luck remembering it now."
  },
  {
    title: "Oh hey there!",
    subtitle: "Ready to pretend to be productive today?",
    backText: "Actually, nevermind",
    passwordLabel: "Magic words",
    passwordPlaceholder: "Type the thing you know",
    signInButton: "Show me the assets!",
    proTip: "Pro tip: Password hints are for the weak. You got this."
  },
  {
    title: "Welcome back, legend",
    subtitle: "Your timeline has been waiting. Dramatically.",
    backText: "Return to headquarters",
    passwordLabel: "Authentication sequence",
    passwordPlaceholder: "The secret handshake",
    signInButton: "Access granted!",
    proTip: "Pro tip: Your password is case-sensitive. Yes, that matters. Yes, really."
  },
  {
    title: "You again?",
    subtitle: "Just kidding, we love having you here. Please stay.",
    backText: "Changed my mind",
    passwordLabel: "Password thingy",
    passwordPlaceholder: "You know what goes here",
    signInButton: "Fine, let me in",
    proTip: "Pro tip: Caps Lock is probably on. It's always on when you don't want it."
  },
  {
    title: "Alert! Alert!",
    subtitle: "Someone wants to actually do work today. Respect.",
    backText: "False alarm, back to work",
    passwordLabel: "Security checkpoint",
    passwordPlaceholder: "State your business",
    signInButton: "Proceed!",
    proTip: "Pro tip: Wrong password? Maybe try the other password. You know, that one."
  },
  {
    title: "Password time!",
    subtitle: "You know the drill. Make it quick, deadlines are watching.",
    backText: "Wait, go back!",
    passwordLabel: "The usual",
    passwordPlaceholder: "Don't overthink it",
    signInButton: "Quick, let me in!",
    proTip: "Pro tip: If it says 'wrong password', that means it's... wait for it... wrong."
  },
  {
    title: "Back so soon?",
    subtitle: "Either super productive or forgot to save something. We won't judge.",
    backText: "I forgot something...",
    passwordLabel: "Identity verification",
    passwordPlaceholder: "Prove it's you",
    signInButton: "Yep, it's me",
    proTip: "Pro tip: Your dog's name backwards is not a strong password. But we accept it."
  },
  {
    title: "The return of the king",
    subtitle: "Or queen. Or project manager. You get the idea.",
    backText: "Retreat to the castle",
    passwordLabel: "Royal seal",
    passwordPlaceholder: "Your majesty's code",
    signInButton: "Enter the realm",
    proTip: "Pro tip: 'password123' is not clever. But if it works, it works."
  },
  {
    title: "Greetings, human!",
    subtitle: "Your assets are ready. Your coffee probably isn't.",
    backText: "Oops, wrong portal",
    passwordLabel: "Human verification",
    passwordPlaceholder: "Beep boop beep",
    signInButton: "I am human!",
    proTip: "Pro tip: Robots don't need passwords. Sadly, you're not a robot."
  },
  {
    title: "Let's do this!",
    subtitle: "Another day, another chance to organize absolutely everything.",
    backText: "Back to the chaos",
    passwordLabel: "Access key",
    passwordPlaceholder: "The key to everything",
    signInButton: "Unlock!",
    proTip: "Pro tip: Passwords are like socks. Sometimes you lose one and nothing works."
  },
  {
    title: "Somebody's motivated!",
    subtitle: "Either that or you're procrastinating something else.",
    backText: "Take me home",
    passwordLabel: "Credentials",
    passwordPlaceholder: "Your secret sauce",
    signInButton: "I'm ready!",
    proTip: "Pro tip: If you're stuck, try typing slower. It doesn't help, but it feels productive."
  },
  {
    title: "Well, well, well...",
    subtitle: "Someone remembered their password on the first try!",
    backText: "Never happened",
    passwordLabel: "The password",
    passwordPlaceholder: "That thing from your brain",
    signInButton: "First try let's go!",
    proTip: "Pro tip: Still wrong? Maybe you changed it last month. You don't remember that either."
  },
  {
    title: "You're early today!",
    subtitle: "Or late. Time is a construct anyway.",
    backText: "Just browsing",
    passwordLabel: "Pass phrase",
    passwordPlaceholder: "Time is an illusion",
    signInButton: "What time is it?",
    proTip: "Pro tip: The best time to login was yesterday. The second best time is now."
  },
  {
    title: "The chosen one returns",
    subtitle: "Your projects have elected you as their favorite human.",
    backText: "Decline the honor",
    passwordLabel: "Chosen one code",
    passwordPlaceholder: "It was written",
    signInButton: "Accept my destiny",
    proTip: "Pro tip: With great passwords comes great responsibility to remember them."
  },
  {
    title: "Fancy meeting you here",
    subtitle: "In this app. That you own. Yeah, this is awkward.",
    backText: "Exit gracefully",
    passwordLabel: "Fancy password",
    passwordPlaceholder: "Something sophisticated",
    signInButton: "Shall we?",
    proTip: "Pro tip: Awkwardly typing the wrong password multiple times builds character."
  },
  {
    title: "Another day, another dollar",
    subtitle: "Except it's probably more like another day, another deadline.",
    backText: "Cancel everything",
    passwordLabel: "Work pass",
    passwordPlaceholder: "Earn your keep",
    signInButton: "Clock in",
    proTip: "Pro tip: Passwords don't pay bills, but they do unlock the thing that tracks bills."
  },
  {
    title: "Ready player one?",
    subtitle: "Your projects are loaded and ready to crush your soul.",
    backText: "Unload please",
    passwordLabel: "Player auth",
    passwordPlaceholder: "Enter to play",
    signInButton: "Game on!",
    proTip: "Pro tip: This is not a game. But treat your password like it's the final boss."
  },
  {
    title: "Surprise, surprise!",
    subtitle: "You actually opened the app instead of ignoring notifications.",
    backText: "Was an accident",
    passwordLabel: "Surprise code",
    passwordPlaceholder: "Plot twist",
    signInButton: "I meant to do that",
    proTip: "Pro tip: The real surprise is when you remember your password correctly."
  },
  {
    title: "The prophecy was true",
    subtitle: "You did eventually come back to finish that project.",
    backText: "Prophecy was wrong",
    passwordLabel: "Prophetic phrase",
    passwordPlaceholder: "As foretold",
    signInButton: "Fulfill the prophecy",
    proTip: "Pro tip: Ancient prophecies are easier to remember than modern passwords."
  },
  {
    title: "Houston, we have contact",
    subtitle: "Your projects are requesting permission to stress you out.",
    backText: "Mission abort",
    passwordLabel: "Launch code",
    passwordPlaceholder: "Houston control",
    signInButton: "Permission granted",
    proTip: "Pro tip: In space, no one can hear you rage-type the wrong password."
  },
  {
    title: "Breaking news!",
    subtitle: "Local project manager actually logs in to check progress.",
    backText: "Fake news",
    passwordLabel: "Press credentials",
    passwordPlaceholder: "Breaking: password here",
    signInButton: "Publish!",
    proTip: "Pro tip: Breaking news - you still don't remember which password you used."
  },
  {
    title: "Status: It's complicated",
    subtitle: "Between you and your deadline. Mostly because you forgot about it.",
    backText: "Relationship counseling",
    passwordLabel: "Complicated code",
    passwordPlaceholder: "It's not you, it's me",
    signInButton: "Let's talk",
    proTip: "Pro tip: Your relationship with passwords is also complicated. Therapy won't help."
  },
  {
    title: "One does not simply...",
    subtitle: "Walk into productivity without coffee. But here you are.",
    backText: "Get coffee first",
    passwordLabel: "One password",
    passwordPlaceholder: "Simply enter it",
    signInButton: "Walk in",
    proTip: "Pro tip: One does not simply remember complex passwords at 6 AM."
  },
  {
    title: "Plot twist!",
    subtitle: "You're about to discover how many tasks you forgot about.",
    backText: "Rewind please",
    passwordLabel: "Twist ending",
    passwordPlaceholder: "Unexpected input",
    signInButton: "Reveal the twist",
    proTip: "Pro tip: Plot twist - the password you're trying was for your old laptop."
  },
  {
    title: "Achievement unlocked",
    subtitle: "You remembered this app exists. Congrats on basic memory function.",
    backText: "Lock it back",
    passwordLabel: "Achievement code",
    passwordPlaceholder: "Unlock progress",
    signInButton: "Claim reward",
    proTip: "Pro tip: Achievement unlocked - Failed password attempt #4. Keep going!"
  },
  {
    title: "Warning: Contents may vary",
    subtitle: "Your project status might be different from what you remember.",
    backText: "I can't handle this",
    passwordLabel: "Warning bypass",
    passwordPlaceholder: "Proceed anyway",
    signInButton: "I've been warned",
    proTip: "Pro tip: Warning - Your password may have changed since you last remembered it."
  },
  {
    title: "Ding ding ding!",
    subtitle: "Winner of today's 'I should probably check my projects' award.",
    backText: "Return trophy",
    passwordLabel: "Winner's code",
    passwordPlaceholder: "Championship tier",
    signInButton: "Claim victory!",
    proTip: "Pro tip: Ding ding ding! Wrong password! Try again contestant!"
  },
  {
    title: "Welcome to the jungle",
    subtitle: "Where deadlines are made up and the points don't matter.",
    backText: "Take me to civilization",
    passwordLabel: "Jungle key",
    passwordPlaceholder: "Survival mode",
    signInButton: "Into the wild!",
    proTip: "Pro tip: In the jungle, the mighty jungle, the password sleeps... in your brain."
  },
  {
    title: "Is it just me...",
    subtitle: "Or did you open this app thinking it was something else?",
    backText: "Totally was",
    passwordLabel: "Confused password",
    passwordPlaceholder: "Wait, what app is this?",
    signInButton: "Yeah this one",
    proTip: "Pro tip: Is it just me or do all passwords look the same when you're typing?"
  },
  {
    title: "Roses are red, violets are blue",
    subtitle: "Your projects are waiting, and so are your deadlines too.",
    backText: "Poetry slam exit",
    passwordLabel: "Poetic phrase",
    passwordPlaceholder: "Roses are... wait",
    signInButton: "Beautiful!",
    proTip: "Pro tip: Roses are red, passwords are hard, why did I make it, my dog's birthday card?"
  }
];

export function AuthPage({ onBack }: AuthPageProps = {}) {
  // Auto-fill email from localStorage (default: ryan.setiawan@tiket.com)
  const defaultEmail = localStorage.getItem('admin-default-email') || 'ryan.setiawan@tiket.com';
  const [email] = useState(defaultEmail);
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  
  // Get random message set on every visit - different each time!
  const [messageSet] = useState(() => {
    const randomIndex = Math.floor(Math.random() * MESSAGE_SETS.length);
    return MESSAGE_SETS[randomIndex];
  });
  
  // Update email when default email changes
  useEffect(() => {
    const storedEmail = localStorage.getItem('admin-default-email') || 'ryan.setiawan@tiket.com';
    // Email is already set from localStorage
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Welcome back');
      // Navigate back to dashboard after successful sign in
      if (onBack) {
        onBack();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center">
            {messageSet.title}
          </CardTitle>
          <CardDescription className="text-center">
            {messageSet.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{messageSet.passwordLabel}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={messageSet.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : messageSet.signInButton}
            </Button>

            {onBack && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBack}
                className="w-full"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {messageSet.backText}
              </Button>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center italic">
              {messageSet.proTip}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
