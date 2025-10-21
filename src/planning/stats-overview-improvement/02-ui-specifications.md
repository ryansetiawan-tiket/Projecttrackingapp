# UI Specifications - Stats Overview Redesign 🎨

**Purpose:** Define the visual design, layout, and component structure for the redesigned Overview tab.

---

## 🎨 Overall Layout

### Container Structure
```tsx
<div className="space-y-6">
  {/* 1. Performance Summary */}
  {/* 2. Highlights Grid */}
  {/* 3. Vertical Breakdown */}
  {/* 4. Efficiency Stats Grid */}
  {/* 5. Weekly Pulse */}
  {/* 6. Team Snapshot */}
  {/* 7. Fun Closing */}
</div>
```

### Spacing & Rhythm
- **Between sections:** `space-y-6` (24px)
- **Within cards:** `space-y-4` (16px)
- **Grid gaps:** `gap-4` (16px)
- **Card padding:** `p-6` (24px)

---

## 📐 Section-by-Section Specifications

### **1. 🧭 Performance Summary (Hero Section)**

#### Layout
```
┌────────────────────────────────────────────────┐
│  Performance Summary                            │
├────────────────────────────────────────────────┤
│                                                 │
│  You've managed 16 projects so far —           │
│  wow, someone's been busy! 💼✨                 │
│                                                 │
│  ─────────────────────────── 56.3%             │
│  [████████████░░░░░░░░░]                       │
│  9 completed • 7 in progress                   │
│                                                 │
│  56.3% completion rate! The other half         │
│  might still be on coffee break ☕😅            │
│                                                 │
│  📈 Working with 13 amazing people             │
│  [Avatar] [Avatar] [Avatar] +10                │
│                                                 │
└────────────────────────────────────────────────┘
```

#### Component Structure
```tsx
<Card className="bg-gradient-to-br from-[#1a1a1d] to-[#121212] border-[#3a3a3a]">
  <CardHeader>
    <CardTitle className="text-lg">🧭 Performance Summary</CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Hero Message */}
    <div className="text-center">
      <p className="text-2xl font-medium text-neutral-50">
        You've managed <span className="text-blue-400 font-bold">16 projects</span> so far —
        wow, someone's been busy! 💼✨
      </p>
    </div>

    {/* Progress Section */}
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Overall Progress</span>
        <span className="text-3xl font-bold text-blue-400">56.3%</span>
      </div>
      <Progress value={56.3} className="h-3" />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>9 completed</span>
        <span>7 in progress</span>
      </div>
    </div>

    {/* Completion Message */}
    <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]">
      <p className="text-base text-neutral-200 text-center">
        56.3% completion rate! The other half might still be on coffee break ☕😅
      </p>
    </div>

    {/* Collaborators Preview */}
    <div className="flex items-center justify-center gap-3">
      <span className="text-sm text-muted-foreground">👥 Working with 13 amazing people</span>
      <div className="flex -space-x-2">
        <Avatar className="h-8 w-8 border-2 border-background">
          <AvatarImage src="/avatars/agung.jpg" />
          <AvatarFallback>AG</AvatarFallback>
        </Avatar>
        {/* More avatars... */}
        <div className="h-8 w-8 rounded-full bg-[#2a2a2a] border-2 border-background flex items-center justify-center">
          <span className="text-xs">+10</span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

#### Styling Details
- **Gradient background:** `from-[#1a1a1d] to-[#121212]`
- **Hero text:** `text-2xl`, `font-medium`, numbers in `text-blue-400 font-bold`
- **Big percentage:** `text-3xl font-bold text-blue-400`
- **Progress bar:** `h-3`, custom color
- **Message box:** `bg-[#0a0a0a]`, `border-[#2a2a2a]`, rounded

---

### **2. 💡 Highlights (4 Insight Cards)**

#### Layout
```
┌──────────────┐ ┌──────────────┐
│ 🔥 Top       │ │ ⚡ Fastest   │
│ Category     │ │ Project      │
│              │ │              │
│ Loyalty      │ │ Blackpink    │
│ 8/16 (50%)   │ │ 3 days       │
└──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ 👥 Most      │ │ 🎯 Best      │
│ Active       │ │ Week         │
│              │ │              │
│ Agung        │ │ Oct 14-20    │
│ 3 projects   │ │ 146 actions  │
└──────────────┘ └──────────────┘
```

#### Component Structure
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Card 1: Top Category */}
  <Card className="bg-[#121212] border-[#3a3a3a] hover:border-[#4a4a4a] transition-colors">
    <CardContent className="p-6 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-3xl">🔥</span>
        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Top Category</h3>
          <p className="text-base leading-relaxed">
            <Badge 
              style={{ backgroundColor: '#ffb84d', color: '#000' }}
              className="mr-2"
            >
              Loyalty
            </Badge>
            <span className="text-neutral-200">
              8 out of 16 projects (50%) are pure loyalty grind
            </span>
          </p>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Card 2: Fastest Project */}
  <Card className="bg-[#121212] border-[#3a3a3a] hover:border-[#4a4a4a] transition-colors">
    <CardContent className="p-6 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-3xl">⚡</span>
        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Fastest Project</h3>
          <p className="text-base leading-relaxed text-neutral-200">
            <span className="font-semibold text-blue-400">Blackpink Campaign</span> — 
            finished in record time (3 days)!
          </p>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Card 3: Most Active Collaborator */}
  <Card className="bg-[#121212] border-[#3a3a3a] hover:border-[#4a4a4a] transition-colors">
    <CardContent className="p-6 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-3xl">👥</span>
        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Most Active Collaborator</h3>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>AG</AvatarFallback>
            </Avatar>
            <p className="text-base leading-relaxed text-neutral-200">
              <span className="font-semibold">Agung</span> — found in 3 simultaneous projects 😂
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Card 4: Best Week */}
  <Card className="bg-[#121212] border-[#3a3a3a] hover:border-[#4a4a4a] transition-colors">
    <CardContent className="p-6 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-3xl">🎯</span>
        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Best Week</h3>
          <p className="text-base leading-relaxed text-neutral-200">
            <span className="font-semibold">Oct 14–20</span> — 
            9 projects, 24 assets, 146 actions… are you okay? 😅
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

#### Styling Details
- **Grid:** `grid-cols-1 md:grid-cols-2 gap-4`
- **Card hover:** `hover:border-[#4a4a4a]`
- **Emoji:** `text-3xl`, positioned top-left
- **Header:** `text-sm text-muted-foreground`
- **Content:** `text-base leading-relaxed text-neutral-200`
- **Emphasis:** `font-semibold text-blue-400`

---

### **3. 📊 Vertical Breakdown**

#### Layout
```
┌────────────────────────────────────────┐
│  📊 Category Breakdown                 │
├────────────────────────────────────────┤
│                                         │
│      [Donut or Bar Chart]              │
│                                         │
│  💛 Loyalty    8 projects (50%)        │
│  ████████████████░░░░░░░░░░░          │
│                                         │
│  🚀 Growth     1 project (6%)          │
│  ███░░░░░░░░░░░░░░░░░░░░░░░          │
│                                         │
│  🪩 Disco      2 projects (13%)        │
│  ██████░░░░░░░░░░░░░░░░░░░░          │
│                                         │
│  "Loyalty's stealing the spotlight 🏆" │
│                                         │
└────────────────────────────────────────┘
```

#### Component Structure
```tsx
<Card className="bg-[#121212] border-[#3a3a3a]">
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
            data={verticalData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {verticalData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Breakdown List */}
    <div className="space-y-4">
      {verticalData.map((vertical) => (
        <div key={vertical.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: vertical.color }}
              />
              <span className="text-sm font-medium">{vertical.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {vertical.count} projects ({vertical.percentage}%)
            </span>
          </div>
          <Progress 
            value={vertical.percentage} 
            className="h-2"
            style={{ 
              '--progress-background': vertical.color 
            } as React.CSSProperties}
          />
        </div>
      ))}
    </div>

    {/* Fun Caption */}
    <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]">
      <p className="text-sm text-center text-neutral-300 italic">
        "Loyalty's stealing the spotlight 🏆, while Growth's chilling on the bench."
      </p>
    </div>
  </CardContent>
</Card>
```

#### Chart Options
Use either **Donut Chart** or **Horizontal Bar Chart**:

**Donut Chart (Recommended):**
- More visual interest
- Good for 2-5 categories
- Shows proportions clearly

**Bar Chart (Alternative):**
- Better for many categories
- Easier to compare exact values
- More space-efficient

---

### **4. ⚙️ Efficiency Stats (KPI Fun Zone)**

#### Layout
```
┌──────────────┐ ┌──────────────┐
│ ⏱️           │ │ 🕓           │
│ 6.4 days     │ │ 78%          │
│ avg duration │ │ on-time      │
│ "not bad!"   │ │ "reliable!"  │
└──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ ⛔           │ │ 📦           │
│ 1.2 days     │ │ 2.3          │
│ avg delay    │ │ avg assets   │
│ "fashionable"│ │ "lean!"      │
└──────────────┘ └──────────────┘
```

#### Component Structure
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* Stat Card Template */}
  <Card className="bg-[#121212] border-[#3a3a3a]">
    <CardContent className="p-6 space-y-3 text-center">
      {/* Icon */}
      <div className="text-4xl">⏱️</div>
      
      {/* Big Number */}
      <div className="text-3xl font-bold text-blue-400">6.4</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        days avg
      </div>
      
      {/* Label */}
      <div className="text-sm font-medium text-neutral-200">
        Project Duration
      </div>
      
      {/* Fun Comment */}
      <div className="text-xs text-muted-foreground italic">
        "not bad, not Netflix-binge-long either 🍿"
      </div>
    </CardContent>
  </Card>

  {/* Repeat for other stats */}
</div>
```

#### Styling Details
- **Grid:** `grid-cols-2 md:grid-cols-4 gap-4`
- **Emoji icon:** `text-4xl`, centered
- **Big number:** `text-3xl font-bold text-blue-400`
- **Label:** `text-xs uppercase tracking-wide`
- **Fun comment:** `text-xs italic text-muted-foreground`

---

### **5. 📅 Weekly Pulse**

#### Layout
```
┌────────────────────────────────────────┐
│  📅 This Week's Pulse                  │
├────────────────────────────────────────┤
│                                         │
│  This week you created 9 projects,     │
│  added 24 assets, and completed        │
│  146 actions.                          │
│                                         │
│  ┌─────────┬─────────┬─────────┐      │
│  │ 9       │ 24      │ 146     │      │
│  │ Projects│ Assets  │ Actions │      │
│  └─────────┴─────────┴─────────┘      │
│                                         │
│  📈 Up from last week — productivity's │
│     on fire 🔥 (and maybe your brain)  │
│                                         │
└────────────────────────────────────────┘
```

#### Component Structure
```tsx
<Card className="bg-[#121212] border-[#3a3a3a]">
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <span>📅</span>
      This Week's Pulse
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Main Message */}
    <p className="text-base text-neutral-200 text-center">
      This week you created <span className="font-bold text-blue-400">9 projects</span>, 
      added <span className="font-bold text-green-400">24 assets</span>, and completed 
      <span className="font-bold text-purple-400">146 actions</span>.
    </p>

    {/* Stats Grid */}
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center space-y-1">
        <div className="text-3xl font-bold text-blue-400">9</div>
        <div className="text-xs text-muted-foreground">Projects</div>
      </div>
      <div className="text-center space-y-1">
        <div className="text-3xl font-bold text-green-400">24</div>
        <div className="text-xs text-muted-foreground">Assets</div>
      </div>
      <div className="text-center space-y-1">
        <div className="text-3xl font-bold text-purple-400">146</div>
        <div className="text-xs text-muted-foreground">Actions</div>
      </div>
    </div>

    {/* Trend Message */}
    <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a] flex items-center gap-3">
      <TrendingUp className="h-5 w-5 text-green-400" />
      <p className="text-sm text-neutral-300">
        Up from last week — productivity's on fire 🔥 (and maybe your brain too 😵)
      </p>
    </div>
  </CardContent>
</Card>
```

---

### **6. 👥 Team Snapshot**

#### Layout
```
┌────────────────────────────────────────┐
│  👥 Your Crew                          │
├────────────────────────────────────────┤
│                                         │
│  You've worked with 13 unique          │
│  collaborators so far.                 │
│                                         │
│  [Avatar Grid - 4 columns]             │
│  [AG] [MB] [DR] [PT]                  │
│  [AL] [JT] [SR] [MK]                  │
│  ...                                    │
│                                         │
│  Top squad: Agung, Misbeh, Dira,       │
│  and Putu — these legends never        │
│  sleep 😎                               │
│                                         │
│  🎉 New joiners: Alvin, Jotin 👀       │
│                                         │
└────────────────────────────────────────┘
```

#### Component Structure
```tsx
<Card className="bg-[#121212] border-[#3a3a3a]">
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <span>👥</span>
      Your Crew
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Total Count */}
    <p className="text-base text-neutral-200 text-center">
      You've worked with <span className="font-bold text-blue-400">13 unique collaborators</span> so far.
    </p>

    {/* Avatar Grid */}
    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
      {collaborators.map((collab) => (
        <div key={collab.id} className="flex flex-col items-center gap-2">
          <Avatar className="h-12 w-12">
            <AvatarImage src={collab.avatar} />
            <AvatarFallback>{collab.initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate w-full text-center">
            {collab.name}
          </span>
        </div>
      ))}
    </div>

    {/* Top Squad Message */}
    <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]">
      <p className="text-sm text-neutral-300 text-center">
        Top squad: <span className="font-semibold">Agung, Misbeh, Dira, and Putu</span> — 
        these legends never sleep 😎
      </p>
    </div>

    {/* New Joiners (conditional) */}
    {newCollaborators.length > 0 && (
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>🎉 New joiners spotted:</span>
        <span className="font-semibold text-green-400">
          {newCollaborators.join(', ')} 👀
        </span>
      </div>
    )}
  </CardContent>
</Card>
```

---

### **7. ✨ Fun Closing Message**

#### Layout
```
┌────────────────────────────────────────┐
│                                         │
│         ✨                              │
│                                         │
│  Keep it up — your projects need you   │
│  (and probably caffeine). ☕💪          │
│                                         │
└────────────────────────────────────────┘
```

#### Component Structure
```tsx
<div className="flex justify-center">
  <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-blue-500/20 max-w-2xl">
    <CardContent className="p-8 text-center space-y-4">
      <div className="text-5xl">✨</div>
      <p className="text-lg text-neutral-200 leading-relaxed">
        Keep it up — your projects need you (and probably caffeine). ☕💪
      </p>
    </CardContent>
  </Card>
</div>
```

#### Styling Details
- **Gradient background:** `from-blue-500/10 via-purple-500/10 to-pink-500/10`
- **Border:** `border-blue-500/20`
- **Icon:** `text-5xl`
- **Text:** `text-lg leading-relaxed`
- **Centered:** `max-w-2xl mx-auto`

---

## 📱 Responsive Behavior

### Breakpoints

**Mobile (< 768px):**
- Highlights: 1 column grid
- Efficiency stats: 2 columns
- Team avatars: 4 columns
- Reduced padding (`p-4` instead of `p-6`)

**Tablet (768px - 1024px):**
- Highlights: 2 columns
- Efficiency stats: 4 columns
- Team avatars: 6 columns

**Desktop (> 1024px):**
- All grids at full width
- Maximum readability

### Mobile-Specific Adjustments
```tsx
// Hero text
<p className="text-xl md:text-2xl">...</p>

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// Card padding
<CardContent className="p-4 md:p-6">

// Avatar grid
<div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
```

---

## 🎨 Color Palette

### Primary Colors
- **Blue (primary):** `#3b82f6` / `text-blue-400`
- **Green (success):** `#22c55e` / `text-green-400`
- **Purple (actions):** `#a855f7` / `text-purple-400`
- **Yellow (warning):** `#eab308` / `text-yellow-400`

### Background Colors
- **Card background:** `bg-[#121212]`
- **Card border:** `border-[#3a3a3a]`
- **Inner box:** `bg-[#0a0a0a]`, `border-[#2a2a2a]`
- **Gradient card:** `from-[#1a1a1d] to-[#121212]`

### Text Colors
- **Primary:** `text-neutral-50`
- **Secondary:** `text-neutral-200`
- **Muted:** `text-muted-foreground`
- **Emphasis:** `text-blue-400`, `font-bold`

---

## 🧩 Reusable Components

### StatCard Component
```tsx
interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  unit?: string;
  comment?: string;
  color?: string;
}

export function StatCard({ icon, value, label, unit, comment, color = 'text-blue-400' }: StatCardProps) {
  return (
    <Card className="bg-[#121212] border-[#3a3a3a]">
      <CardContent className="p-6 space-y-3 text-center">
        <div className="text-4xl">{icon}</div>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        {unit && <div className="text-xs text-muted-foreground uppercase tracking-wide">{unit}</div>}
        <div className="text-sm font-medium text-neutral-200">{label}</div>
        {comment && <div className="text-xs text-muted-foreground italic">"{comment}"</div>}
      </CardContent>
    </Card>
  );
}
```

### HighlightCard Component
```tsx
interface HighlightCardProps {
  emoji: string;
  title: string;
  children: React.ReactNode;
}

export function HighlightCard({ emoji, title, children }: HighlightCardProps) {
  return (
    <Card className="bg-[#121212] border-[#3a3a3a] hover:border-[#4a4a4a] transition-colors">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{emoji}</span>
          <div className="flex-1 space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
            <div className="text-base leading-relaxed text-neutral-200">
              {children}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## ✅ UI Checklist

Before implementation:

- [ ] All sections use consistent spacing
- [ ] Cards have hover states
- [ ] Colors match dark mode theme
- [ ] Typography hierarchy is clear
- [ ] Mobile responsive breakpoints set
- [ ] Loading states considered
- [ ] Empty states designed
- [ ] Accessibility (ARIA labels, contrast)

---

**Next:** Review Data Requirements (03-data-requirements.md)
