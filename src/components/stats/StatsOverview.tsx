import { useMemo } from 'react';
import { Project } from '../../types/project';
import { Vertical } from '../../hooks/useVerticals';
import { Status } from '../../types/status';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { StatsCard } from './StatsCard';
import { HighlightCard } from './HighlightCard';
import { calculateOverviewData, type OverviewData } from '../../utils/statsOverviewUtils';

interface StatsOverviewProps {
  projects: Project[];
  statuses: Status[];
  verticals: Vertical[];
  collaborators?: any[];
}

export function StatsOverview({ projects, statuses, verticals, collaborators = [] }: StatsOverviewProps) {
  // Calculate all overview data
  const overviewData = useMemo(() => 
    calculateOverviewData(projects, verticals, statuses, collaborators),
    [projects, verticals, statuses, collaborators]
  );

  return (
    <div className="space-y-6">
      {/* Section 1: Performance Summary */}
      <PerformanceSummary data={overviewData.performanceSummary} />
      
      {/* Section 2: Highlights */}
      <Highlights data={overviewData.highlights} />
      
      {/* Section 3: Vertical Breakdown */}
      {overviewData.verticalBreakdown.data.length > 0 && (
        <VerticalBreakdown data={overviewData.verticalBreakdown} />
      )}
      
      {/* Section 4: Efficiency Stats */}
      <EfficiencyStats data={overviewData.efficiencyStats} />
      
      {/* Section 5: Weekly Pulse */}
      <WeeklyPulse data={overviewData.weeklyPulse} />
      
      {/* Section 6: Team Snapshot */}
      {overviewData.teamSnapshot.totalCollaborators > 0 && (
        <TeamSnapshot data={overviewData.teamSnapshot} />
      )}
      
      {/* Section 7: Fun Closing */}
      <FunClosing message={overviewData.closingMessage} />
    </div>
  );
}

// ============================================================================
// SECTION 1: PERFORMANCE SUMMARY
// ============================================================================

function PerformanceSummary({ data }: { data: OverviewData['performanceSummary'] }) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">🧭 Performance Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hero Message */}
        <div className="text-center">
          <p className="text-xl md:text-2xl font-medium">
            You've managed{' '}
            <span className="text-blue-500 dark:text-blue-400 font-bold">
              {data.totalProjects} project{data.totalProjects !== 1 ? 's' : ''}
            </span>{' '}
            so far — wow, someone's been busy! 💼✨
          </p>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Progress</span>
            <span className="text-3xl font-bold text-blue-500 dark:text-blue-400">
              {data.completionRate}%
            </span>
          </div>
          <Progress value={data.completionRate} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{data.completedProjects} completed</span>
            <span>{data.inProgressProjects} in progress</span>
          </div>
        </div>

        {/* Completion Message */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <p className="text-base text-center">
            {data.completionMessage}
          </p>
        </div>

        {/* Collaborators Preview */}
        {data.topCollaborators.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">
              👥 Working with {data.totalCollaborators} amazing {data.totalCollaborators === 1 ? 'person' : 'people'}
            </span>
            <div className="flex -space-x-2">
              {data.topCollaborators.map((collab) => (
                <Avatar key={collab.id} className="h-8 w-8 border-2 border-background">
                  {collab.avatar && <AvatarImage src={collab.avatar} />}
                  <AvatarFallback className="text-xs">{collab.initials}</AvatarFallback>
                </Avatar>
              ))}
              {data.totalCollaborators > 3 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs">+{data.totalCollaborators - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SECTION 2: HIGHLIGHTS
// ============================================================================

function Highlights({ data }: { data: OverviewData['highlights'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Vertical */}
      {data.topVertical && (
        <HighlightCard emoji="🔥" title="Top Category">
          <Badge 
            style={{ backgroundColor: data.topVertical.color, color: '#fff' }}
            className="mr-2"
          >
            {data.topVertical.name}
          </Badge>
          <span>
            {data.topVertical.count} out of {data.topVertical.total} projects (
            {data.topVertical.percentage}%) are pure {data.topVertical.name.toLowerCase()} grind{' '}
            {data.topVertical.emoji}
          </span>
        </HighlightCard>
      )}

      {/* Fastest Project */}
      {data.fastestProject && (
        <HighlightCard emoji="⚡" title="Fastest Project">
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {data.fastestProject.name}
          </span>{' '}
          — finished in record time ({data.fastestProject.days} day{data.fastestProject.days !== 1 ? 's' : ''})!
        </HighlightCard>
      )}

      {/* Longest Project */}
      {data.longestProject && (
        <HighlightCard emoji="🐢" title="Longest Timeline">
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {data.longestProject.name}
          </span>{' '}
          — {data.longestProject.days} day{data.longestProject.days !== 1 ? 's' : ''} planned timeline, {data.longestProject.message}
        </HighlightCard>
      )}

      {/* Most Active Collaborator */}
      {data.mostActiveCollaborator && (
        <HighlightCard emoji="👥" title="Most Active Collaborator">
          <div className="flex items-center gap-2 flex-wrap">
            <Avatar className="h-8 w-8">
              {data.mostActiveCollaborator.avatar && (
                <AvatarImage src={data.mostActiveCollaborator.avatar} />
              )}
              <AvatarFallback className="text-xs">
                {data.mostActiveCollaborator.initials}
              </AvatarFallback>
            </Avatar>
            <p className="flex-1 min-w-0">
              <span className="font-semibold">
                {data.mostActiveCollaborator.name}
              </span>{' '}
              — found in {data.mostActiveCollaborator.simultaneousProjects} simultaneous project{data.mostActiveCollaborator.simultaneousProjects !== 1 ? 's' : ''} 😂
            </p>
          </div>
        </HighlightCard>
      )}

      {/* Best Week */}
      {data.bestWeek && (
        <HighlightCard emoji="🎯" title="Best Week">
          <span className="font-semibold">{data.bestWeek.dateRange}</span> —{' '}
          {data.bestWeek.projects} project{data.bestWeek.projects !== 1 ? 's' : ''},{' '}
          {data.bestWeek.assets} asset{data.bestWeek.assets !== 1 ? 's' : ''},{' '}
          {data.bestWeek.actions} action{data.bestWeek.actions !== 1 ? 's' : ''}… are you okay? 😅
        </HighlightCard>
      )}
    </div>
  );
}

// ============================================================================
// SECTION 3: VERTICAL BREAKDOWN
// ============================================================================

function VerticalBreakdown({ data }: { data: OverviewData['verticalBreakdown'] }) {
  const chartData = data.data.map((v) => ({
    name: v.name,
    value: v.count,
    color: v.color
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span>📊</span>
          Category Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown List */}
        <div className="space-y-4">
          {data.data.map((vertical) => (
            <div key={vertical.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: vertical.color }}
                  />
                  <span className="text-sm font-medium">{vertical.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {vertical.count} project{vertical.count !== 1 ? 's' : ''} ({vertical.percentage}%)
                </span>
              </div>
              <Progress value={vertical.percentage} className="h-2" />
            </div>
          ))}
        </div>

        {/* Fun Caption */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <p className="text-sm text-center text-muted-foreground italic">
            "{data.caption}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SECTION 4: EFFICIENCY STATS
// ============================================================================

function EfficiencyStats({ data }: { data: OverviewData['efficiencyStats'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        icon="⏱️"
        value={data.avgDuration.value}
        unit="days avg"
        label={data.avgDuration.label}
        comment={data.avgDuration.comment}
      />
      <StatsCard
        icon="📦"
        value={data.avgAssets.value}
        label={data.avgAssets.label}
        comment={data.avgAssets.comment}
        color="text-purple-400"
      />
      {data.longestProject && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐌</span>
              <span className="text-sm text-muted-foreground">Longest Project</span>
            </div>
            <div className="space-y-1">
              <div className="text-blue-600 dark:text-blue-400 truncate" title={data.longestProject.name}>
                {data.longestProject.name}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{data.longestProject.days}</span>
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              <p className="text-xs text-muted-foreground italic">
                {data.longestProject.comment}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SECTION 5: WEEKLY PULSE
// ============================================================================

function WeeklyPulse({ data }: { data: OverviewData['weeklyPulse'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span>📅</span>
          This Week's Pulse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Message */}
        <p className="text-base text-center">
          This week you created{' '}
          <span className="font-bold text-blue-600 dark:text-blue-400">{data.projectsCreated} project{data.projectsCreated !== 1 ? 's' : ''}</span>, added{' '}
          <span className="font-bold text-green-600 dark:text-green-400">{data.assetsAdded} asset{data.assetsAdded !== 1 ? 's' : ''}</span>, and completed{' '}
          <span className="font-bold text-purple-600 dark:text-purple-400">{data.actionsCompleted} action{data.actionsCompleted !== 1 ? 's' : ''}</span>.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {data.projectsCreated}
            </div>
            <div className="text-xs text-muted-foreground">Projects</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {data.assetsAdded}
            </div>
            <div className="text-xs text-muted-foreground">Assets</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {data.actionsCompleted}
            </div>
            <div className="text-xs text-muted-foreground">Actions</div>
          </div>
        </div>

        {/* Trend Message */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border flex items-center gap-3">
          {data.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />}
          {data.trend === 'down' && <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />}
          {data.trend === 'same' && <div className="h-5 w-5 flex-shrink-0" />}
          <p className="text-sm flex-1">{data.trendMessage}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SECTION 6: TEAM SNAPSHOT
// ============================================================================

function TeamSnapshot({ data }: { data: OverviewData['teamSnapshot'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span>👥</span>
          Your Crew
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Count */}
        <p className="text-base text-center">
          You've worked with{' '}
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {data.totalCollaborators} unique collaborator{data.totalCollaborators !== 1 ? 's' : ''}
          </span>{' '}
          so far.
        </p>

        {/* Avatar Grid */}
        {data.topCollaborators.length > 0 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {data.topCollaborators.map((collab) => (
              <div key={collab.id} className="flex flex-col items-center gap-2">
                <Avatar className="h-12 w-12">
                  {collab.avatar && <AvatarImage src={collab.avatar} />}
                  <AvatarFallback>{collab.initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate w-full text-center">
                  {collab.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Top Squad Message */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <p className="text-sm text-center">
            {data.topSquadMessage}
          </p>
        </div>

        {/* New Joiners */}
        {data.newCollaborators.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span>🎉 New joiners spotted:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {data.newCollaborators.join(', ')} 👀
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SECTION 7: FUN CLOSING
// ============================================================================

function FunClosing({ message }: { message: string }) {
  return (
    <div className="flex justify-center">
      <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-blue-500/20 dark:border-blue-500/30 max-w-2xl w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-5xl">✨</div>
          <p className="text-lg leading-relaxed">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
