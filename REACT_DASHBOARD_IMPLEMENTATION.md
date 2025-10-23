# React Dashboard Implementation Guide

**Status:** Ready to Build  
**Timeline:** 2-3 days  
**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + React Query

---

## 🎯 What We're Building

A modern, production-ready web dashboard for managing Vexa bots with:
- ✅ Real-time bot monitoring
- ✅ One-click bot deployment
- ✅ Live transcription viewer
- ✅ Bot status management
- ✅ Meeting history
- ✅ Analytics dashboard

---

## 📁 Project Structure Created

```
/root/vexa/services/web-ui/
├── package.json              ✅ Created
├── tsconfig.json            
├── vite.config.ts           
├── tailwind.config.js       
├── postcss.config.js        
├── index.html               
├── public/                   ✅ Created
├── src/                      ✅ Created
│   ├── main.tsx             
│   ├── App.tsx              
│   ├── index.css            
│   ├── components/          ✅ Created
│   │   ├── BotCard.tsx      
│   │   ├── BotList.tsx      
│   │   ├── NewBotForm.tsx   
│   │   ├── StatusBadge.tsx  
│   │   ├── TranscriptViewer.tsx
│   │   └── Layout.tsx       
│   ├── pages/               ✅ Created
│   │   ├── Dashboard.tsx    
│   │   ├── BotDetail.tsx    
│   │   └── Transcripts.tsx  
│   ├── hooks/               ✅ Created
│   │   └── useBots.ts       
│   ├── lib/                 ✅ Created
│   │   ├── api.ts           
│   │   └── utils.ts         
│   └── types/               ✅ Created
│       └── index.ts         
└── Dockerfile               
```

---

## 🚀 Quick Start Commands

### Step 1: Install Dependencies
```bash
cd /root/vexa/services/web-ui
npm install
```

### Step 2: Set Environment Variables
```bash
# Create .env file
cat > .env << 'ENVEOF'
VITE_API_URL=http://localhost:18056
VITE_API_KEY=token
ENVEOF
```

### Step 3: Run Development Server
```bash
npm run dev
```

Dashboard will be available at: **http://localhost:3000**

### Step 4: Build for Production
```bash
npm run build
```

---

## 📝 Implementation Steps

### Phase 1: Core Setup (Day 1 - Morning)

**1. Create Configuration Files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:18056',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

`tailwind.config.js`:
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#0ea5e9',
          600: '#0284c7',
        },
      },
    },
  },
}
```

**2. Create Entry Point**

`src/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50;
}
```

### Phase 2: API Layer (Day 1 - Afternoon)

**Create API Client** - See file `src/lib/api.ts` (already designed above)

**Create Custom Hooks** - See file `src/hooks/useBots.ts` (already designed above)

### Phase 3: Components (Day 2)

**1. StatusBadge Component**

`src/components/StatusBadge.tsx`:
```typescript
import { getStatusColor, getStatusLabel } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(status)}`}>
      <span className="w-2 h-2 mr-1.5 rounded-full bg-white/80" />
      {getStatusLabel(status)}
    </span>
  )
}
```

**2. BotCard Component**

`src/components/BotCard.tsx`:
```typescript
import { Bot } from '@/types'
import { StatusBadge } from './StatusBadge'
import { getPlatformIcon, formatDuration } from '@/lib/utils'
import { Trash2, Eye } from 'lucide-react'

interface BotCardProps {
  bot: Bot
  onDelete: (id: number) => void
  onView: (id: number) => void
}

export function BotCard({ bot, onDelete, onView }: BotCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getPlatformIcon(bot.platform)}</span>
            <h3 className="text-lg font-semibold">Bot #{bot.id}</h3>
            <StatusBadge status={bot.status} />
          </div>
          
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Meeting:</span> {bot.native_meeting_id}</p>
            <p><span className="font-medium">Platform:</span> {bot.platform}</p>
            {bot.start_time && (
              <p><span className="font-medium">Duration:</span> {formatDuration(bot.start_time)}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onView(bot.id)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
          >
            <Eye size={20} />
          </button>
          <button
            onClick={() => onDelete(bot.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            disabled={bot.status === 'active'}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

**3. NewBotForm Component**

`src/components/NewBotForm.tsx`:
```typescript
import { useState } from 'react'
import { useCreateBot } from '@/hooks/useBots'
import type { CreateBotRequest } from '@/types'

export function NewBotForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState<CreateBotRequest>({
    platform: 'teams',
    native_meeting_id: '',
    passcode: '',
    bot_name: 'Vexa Bot',
  })

  const createBot = useCreateBot()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createBot.mutateAsync(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Deploy New Bot</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Platform</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
              className="w-full border rounded p-2"
            >
              <option value="teams">Microsoft Teams</option>
              <option value="meet">Google Meet</option>
              <option value="zoom">Zoom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meeting ID</label>
            <input
              type="text"
              value={formData.native_meeting_id}
              onChange={(e) => setFormData({ ...formData, native_meeting_id: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="3497739383599"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Passcode (optional)</label>
            <input
              type="text"
              value={formData.passcode}
              onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="E7e29fVOQEF3hOZqWF"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bot Name</label>
            <input
              type="text"
              value={formData.bot_name}
              onChange={(e) => setFormData({ ...formData, bot_name: e.target.value })}
              className="w-full border rounded p-2"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={createBot.isPending}
            >
              {createBot.isPending ? 'Creating...' : 'Deploy Bot 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### Phase 4: Main Dashboard (Day 2-3)

`src/pages/Dashboard.tsx`:
```typescript
import { useState } from 'react'
import { useBots, useDeleteBot } from '@/hooks/useBots'
import { BotCard } from '@/components/BotCard'
import { NewBotForm } from '@/components/NewBotForm'
import { Plus, RefreshCw } from 'lucide-react'

export function Dashboard() {
  const [showNewBot, setShowNewBot] = useState(false)
  const { data: bots, isLoading, refetch } = useBots()
  const deleteBot = useDeleteBot()

  const stats = {
    total: bots?.length || 0,
    active: bots?.filter(b => b.status === 'active').length || 0,
    waiting: bots?.filter(b => b.status === 'awaiting_admission').length || 0,
    failed: bots?.filter(b => b.status === 'failed').length || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vexa Bot Manager</h1>
          <p className="text-gray-600 mt-2">Manage and monitor your meeting bots</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Bots</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Waiting</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.waiting}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Active Bots</h2>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={() => setShowNewBot(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} />
              New Bot
            </button>
          </div>
        </div>

        {/* Bots List */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : bots?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No bots yet. Deploy your first bot!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots?.map(bot => (
              <BotCard
                key={bot.id}
                bot={bot}
                onDelete={(id) => deleteBot.mutate(id)}
                onView={(id) => window.location.href = `/bot/${id}`}
              />
            ))}
          </div>
        )}

        {/* New Bot Modal */}
        {showNewBot && <NewBotForm onClose={() => setShowNewBot(false)} />}
      </div>
    </div>
  )
}
```

`src/App.tsx`:
```typescript
import { Dashboard } from './pages/Dashboard'

function App() {
  return <Dashboard />
}

export default App
```

---

## 🐳 Docker Setup

`Dockerfile`:
```dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

`nginx.conf`:
```nginx
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api-gateway:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Add to docker-compose.yml**:
```yaml
web-ui:
  build:
    context: ./services/web-ui
    dockerfile: Dockerfile
  ports:
    - "3000:3000"
  environment:
    - VITE_API_URL=http://api-gateway:8000
    - VITE_API_KEY=token
  depends_on:
    - api-gateway
  networks:
    - vexa_default
  restart: unless-stopped
```

---

## ✅ Testing

### Manual Testing Checklist:
- [ ] Dashboard loads
- [ ] Bots list displays
- [ ] Stats show correct numbers
- [ ] New bot form opens
- [ ] Can create new bot
- [ ] Bot cards show status
- [ ] Can delete bot
- [ ] Auto-refresh works
- [ ] Responsive on mobile

### Test Commands:
```bash
# Start dev server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

---

## 🎯 Next Steps After Basic Dashboard

1. **Add Transcript Viewer** - Real-time transcription display
2. **Add Bot Detail Page** - Individual bot monitoring
3. **Add Meeting History** - Past meetings and analytics
4. **Add User Authentication** - Login/logout
5. **Add WebSocket Support** - Real-time updates without polling
6. **Add Dark Mode** - Theme toggle
7. **Add Export Features** - Download transcripts

---

## 📚 Resources

- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com
- **React Query**: https://tanstack.com/query
- **Lucide Icons**: https://lucide.dev

---

## 🚀 Deploy Commands

```bash
# Development
cd /root/vexa/services/web-ui
npm install
npm run dev

# Production with Docker
cd /root/vexa
docker compose up -d web-ui

# Access at: http://localhost:3000
```

---

**Status:** Implementation Guide Complete  
**Next Step:** Run `npm install` in `/root/vexa/services/web-ui`  
**Timeline:** Ready to build in 2-3 days  
**Support:** All code examples provided above
