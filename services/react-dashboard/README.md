# 🚀 Vexa React Dashboard

Professional React dashboard for managing MS Teams meeting bots with real-time updates and analytics.

## 🎯 Features

- ✅ **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS
- ✅ **Real-time Updates**: Auto-refresh every 5 seconds
- ✅ **Professional UI**: shadcn/ui component library
- ✅ **Bot Management**: Create, view, and stop bots
- ✅ **Dashboard Stats**: Active bots, waiting, failed metrics
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **State Management**: Zustand + React Query
- ✅ **Docker Ready**: Production-ready containerization

## 🏃 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

### Docker

```bash
# From root directory
docker-compose up -d react-dashboard

# Access at http://localhost:3000
```

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **HTTP**: Axios
- **Charts**: Recharts (planned)
- **Icons**: Lucide React

## 🏗️ Architecture

```
app/                 # Next.js App Router
├── layout.tsx      # Root layout
├── page.tsx        # Dashboard home
└── providers.tsx   # React Query provider

components/
├── ui/             # shadcn/ui components
├── dashboard/      # Dashboard components
├── bots/           # Bot management
└── layout/         # Layout components

lib/
├── api.ts          # API client
├── stores/         # Zustand stores
└── utils.ts        # Utilities
```

## 🔗 API Integration

Connects to Vexa API Gateway at `http://localhost:18056`:

- `GET /bots` - List all bots
- `POST /bots` - Create new bot
- `GET /bots/{id}` - Get bot details
- `POST /bots/{id}/stop` - Stop bot
- `GET /bots/{id}/transcript` - Get transcript

## 🚀 Deployment

### Docker Compose

The dashboard is integrated into the main `docker-compose.yml`:

```yaml
react-dashboard:
  build: ./services/react-dashboard
  ports:
    - "3000:3000"
  environment:
    - NEXT_PUBLIC_API_URL=http://localhost:18056
```

### Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:18056
NEXT_PUBLIC_WS_URL=ws://localhost:18056
```

## 📝 Next Features

- [ ] Real-time WebSocket updates
- [ ] Transcript viewer
- [ ] Export functionality (PDF, CSV, JSON)
- [ ] Analytics dashboard
- [ ] Container management
- [ ] Dark mode
- [ ] Mobile responsive

## 📚 Documentation

See `/root/vexa/REACT_DASHBOARD_PHASE2.md` for complete documentation.

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Build Docker image
5. Push to GitHub

## 📄 License

See main project LICENSE file.
