# 🏆 Ligue Scolaire - Role-Based Dashboard System

A comprehensive Next.js 16 (Turbopack) + Firebase application with role-based authentication and responsive dashboards.

## 🚀 Features

### 🔐 Authentication & Role Management
- **Firebase Auth** with Google Sign-In and Email/Password
- **Role-based routing**:
  - `youssefloay@gmail.com` → `/admin` (Admin Dashboard)
  - Other users → `/user` (User Dashboard)
- **Session persistence** with automatic redirects
- **Loading states** and error handling

### 👤 User Dashboard (`/user`)
Beautiful, responsive dashboard with real-time data:

#### 📅 Today's Matches
- Live match cards with animations
- Real-time scores and status updates
- "LIVE" indicators with pulsing animations
- Responsive grid layout (1 col mobile, 2-3 desktop)

#### ⏰ Upcoming Matches
- Horizontal scrollable cards on mobile
- Date/time information
- Venue details

#### 🏆 League Standings
- Interactive table with team rankings
- Top 3 teams highlighted with medals
- Win/Draw/Loss statistics
- Goals for/against and point totals
- Fade-in animations

#### 👥 Teams & Players
- Team cards with logos and colors
- Click to navigate to team details
- Player count information

### 🏟️ Team Details Page (`/team/[id]`)
- **Team information** with logo, colors, stadium
- **Players organized by position**:
  - Goalkeepers (🥅)
  - Defenders (🛡️)
  - Midfielders (⚽)
  - Attackers (🎯)
- **Player cards** with numbers, ages, positions
- **Responsive grid** (2 cols mobile, 4 desktop)

## 🎨 Design & Animations

### 🎭 Framer Motion Animations
- **Entrance animations** with staggered delays
- **Hover effects** on cards and buttons
- **Loading transitions** between pages
- **Smooth page transitions**

### 🎨 Modern UI Components
- **TailwindCSS** for responsive design
- **shadcn/ui** components (Cards, Buttons, Tables, Badges)
- **Gradient backgrounds** and soft shadows
- **Color-coded elements** (positions, status, teams)

### 📱 Responsive Design
- **Mobile-first** approach
- **Breakpoint system**: sm, md, lg, xl
- **Touch-friendly** interactions
- **Horizontal scrolling** on mobile for match cards

## 🔥 Firebase Integration

### 📊 Firestore Collections

```typescript
// Teams
{
  id: string
  name: string
  logo?: string
  color?: string
  founded?: string
  stadium?: string
  description?: string
}

// Players  
{
  id: string
  teamId: string
  name: string
  age?: number
  position: "Gardien" | "Défenseur" | "Milieu" | "Attaquant"
  number?: number
  avatar?: string
}

// Matches
{
  id: string
  teamA: string
  teamB: string
  date: Date
  scoreA?: number
  scoreB?: number
  status: "today" | "upcoming" | "live" | "completed"
  venue?: string
}

// Standings
{
  id: string
  teamId: string
  teamName: string
  points: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  matchesPlayed: number
}
```

### 🔄 Real-time Updates
- **onSnapshot** listeners for live data
- **Automatic UI updates** when data changes
- **Loading skeletons** during data fetch
- **Error handling** for empty collections

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Firebase Configuration
The Firebase config is already set up in `lib/firebase.ts`. Make sure your Firebase project has:
- **Authentication** enabled (Google + Email/Password)
- **Firestore** database created
- **Security rules** configured

### 3. Seed Sample Data (Optional)
```bash
npx ts-node scripts/seed-data.ts
```

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000`

## 🗂️ Project Structure

```
├── app/
│   ├── login/page.tsx          # Login page
│   ├── user/page.tsx           # User dashboard
│   ├── team/[id]/page.tsx      # Team details
│   ├── admin/                  # Admin dashboard (existing)
│   └── public/                 # Public pages (existing)
├── components/
│   ├── user/                   # User dashboard components
│   │   ├── navbar.tsx
│   │   ├── match-card.tsx
│   │   ├── standings-table.tsx
│   │   ├── team-card.tsx
│   │   └── player-card.tsx
│   └── ui/                     # Shared UI components
├── lib/
│   ├── auth-context.tsx        # Authentication context
│   ├── firebase.ts             # Firebase configuration
│   └── utils.ts                # Utility functions
└── scripts/
    └── seed-data.ts            # Data seeding script
```

## 🎯 Key Components

### 🔐 AuthProvider (`lib/auth-context.tsx`)
- Manages authentication state
- Handles role-based redirects
- Provides auth methods (login, logout)

### 🏠 UserNavbar (`components/user/navbar.tsx`)
- Sticky navigation with logo
- User info display
- Logout functionality

### ⚽ MatchCard (`components/user/match-card.tsx`)
- Animated match display
- Status badges (Live, Today, Upcoming)
- Score display with team colors
- Venue information

### 🏆 StandingsTable (`components/user/standings-table.tsx`)
- Sortable league table
- Medal icons for top 3
- Color-coded statistics
- Responsive design

### 👥 TeamCard (`components/user/team-card.tsx`)
- Team logo and colors
- Player count
- Navigation to team details
- Hover animations

### 🏃 PlayerCard (`components/user/player-card.tsx`)
- Player information
- Position badges with icons
- Jersey numbers
- Age display

## 🎨 Styling Guide

### 🎨 Color Scheme
- **Primary**: Blue gradient (`from-blue-600 to-purple-600`)
- **Success**: Green (`text-green-600`)
- **Warning**: Yellow (`text-yellow-600`)
- **Error**: Red (`text-red-600`)
- **Neutral**: Gray shades

### 📐 Layout Patterns
- **Container**: `max-w-6xl mx-auto p-4 sm:p-6 lg:p-8`
- **Grid**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- **Card**: `bg-white rounded-lg shadow-lg border-0`
- **Gradient**: `bg-gradient-to-br from-blue-50 to-purple-50`

### 🎭 Animation Patterns
```typescript
// Entrance animation
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.1, duration: 0.5 }}

// Hover effect
whileHover={{ y: -4, transition: { duration: 0.2 } }}

// Stagger children
transition={{ staggerChildren: 0.1 }}
```

## 🔧 Customization

### 🎨 Adding New Team Colors
Update team documents in Firestore with `color` field:
```javascript
{
  name: "Les Aigles",
  color: "#3B82F6", // Hex color code
  // ... other fields
}
```

### 📊 Adding New Match Status
Update the `status` type in components:
```typescript
status: "today" | "upcoming" | "live" | "completed" | "postponed"
```

### 🏆 Customizing Standings
Modify the sorting logic in `StandingsTable`:
```typescript
.sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points
  // Add custom tiebreaker logic
})
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables (if any)
3. Deploy automatically on push

### Other Platforms
- **Netlify**: Works with Next.js
- **Firebase Hosting**: Native integration
- **Railway**: Simple deployment

## 🔒 Security Notes

- **Firebase Security Rules**: Configure proper read/write permissions
- **Authentication**: Only authenticated users can access dashboards
- **Role Validation**: Server-side role checking recommended for production
- **API Routes**: Secure any API endpoints with authentication

## 🎯 Future Enhancements

- [ ] **Push notifications** for live matches
- [ ] **Match predictions** and betting
- [ ] **Player statistics** tracking
- [ ] **Photo uploads** for teams/players
- [ ] **Match commentary** system
- [ ] **Mobile app** with React Native
- [ ] **Admin panel** improvements
- [ ] **Multi-language** support

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection**: Check console for Firebase errors
2. **Authentication**: Verify Firebase Auth configuration
3. **Data Loading**: Check Firestore security rules
4. **Animations**: Ensure Framer Motion is installed
5. **Responsive**: Test on different screen sizes

### Debug Mode
Add to your environment:
```bash
NEXT_PUBLIC_DEBUG=true
```

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify Firebase configuration
3. Test with sample data
4. Check component props and types

---

Built with ❤️ using Next.js 16, Firebase, TailwindCSS, and Framer Motion.