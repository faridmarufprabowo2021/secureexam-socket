# SecureExam Socket Server

Socket.IO server untuk fitur realtime SecureExam Pro.

## Requirements

- Node.js 18+
- npm atau yarn

## Setup Lokal

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build untuk production
npm run build

# Run production
npm start
```

## Environment Variables

Buat file `.env`:

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

## Socket Events

### Namespace: `/exam` (untuk siswa)

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | Client→Server | Siswa join exam |
| `leave-room` | Client→Server | Siswa keluar |
| `violation` | Client→Server | Report pelanggaran |
| `broadcast` | Server→Client | Pesan dari guru |
| `kicked` | Server→Client | Siswa di-kick |
| `blocked` | Server→Client | Siswa di-block |

### Namespace: `/monitoring` (untuk guru)

| Event | Direction | Description |
|-------|-----------|-------------|
| `subscribe-exam` | Client→Server | Subscribe ke exam |
| `send-broadcast` | Client→Server | Kirim broadcast |
| `kick-student` | Client→Server | Kick siswa |
| `block-student` | Client→Server | Block siswa |
| `student-joined` | Server→Client | Notif siswa masuk |
| `violation-alert` | Server→Client | Alert pelanggaran |

## Deploy ke Render

1. Push ke GitHub
2. Buat Web Service di Render
3. Connect ke repo ini
4. Set environment variables
5. Deploy!
