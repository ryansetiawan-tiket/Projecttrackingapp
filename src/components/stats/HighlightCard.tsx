import { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';

interface HighlightCardProps {
  emoji: string;
  title: string;
  children: ReactNode;
}

export function HighlightCard({ emoji, title, children }: HighlightCardProps) {
  return (
    <Card className="bg-[#121212] border-[#3a3a3a] hover:border-[#4a4a4a] transition-colors">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">{emoji}</span>
          <div className="flex-1 space-y-2 min-w-0">
            <h3 className="font-medium text-sm text-muted-foreground">
              {title}
            </h3>
            <div className="text-base leading-relaxed text-neutral-200">
              {children}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
