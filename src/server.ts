
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import questionRoutes from './routes/questions';
import performanceRoutes from './routes/performance';
import { authenticateToken } from './middleware/auth';
import geminiRoute from './routes/geminiRoute';
import codeRoutes from './routes/codeRoutes';

dotenv.config();

const app = express();
const server = createServer(app);

// Enhanced CORS configuration for Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:5173",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://tamannayadav741:Tamanna@cluster0.abcrmr1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as any).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Routes
app.use('/api', geminiRoute);
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/code', codeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  console.log('Socket authentication attempt:', {
    socketId: socket.id,
    hasToken: !!token,
    timestamp: new Date().toISOString()
  });
  
  if (!token) {
    console.log('Socket authentication failed: No token provided');
    return next(new Error('Authentication error: No token provided'));
  }
  
  // Add your token verification logic here if needed
  // For now, just check if token exists
  if (token) {
    console.log('Socket authentication successful for:', socket.id);
    next();
  } else {
    console.log('Socket authentication failed: Invalid token');
    next(new Error('Authentication error: Invalid token'));
  }
});

// Track participants and their metadata
interface ParticipantInfo {
  socketId: string;
  username: string;
  joinedAt: Date;
}

const participants: Record<string, Map<string, ParticipantInfo>> = {};

// Enhanced Socket.IO handling for mock interviews
io.on('connection', (socket) => {
  console.log(`✅ User connected for mock interview:`, {
    socketId: socket.id,
    timestamp: new Date().toISOString(),
    transport: socket.conn.transport.name
  });

  socket.on('join-interview', (data) => {
    const { interviewId, username } = data;
    
    console.log(`👤 User joining interview:`, {
      socketId: socket.id,
      interviewId,
      username,
      timestamp: new Date().toISOString()
    });

    // Leave any previous rooms
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
        console.log(`Left previous room: ${room}`);
      }
    });

    // Join the new interview room
    socket.join(interviewId);

    // Initialize participants map for this interview if it doesn't exist
    if (!participants[interviewId]) {
      participants[interviewId] = new Map();
    }

    // Add participant info
    participants[interviewId].set(socket.id, {
      socketId: socket.id,
      username: username || 'Anonymous',
      joinedAt: new Date()
    });

    const participantCount = participants[interviewId].size;
    const participantList = Array.from(participants[interviewId].values());
    
    console.log(`📊 Interview ${interviewId} participants:`, {
      count: participantCount,
      participants: participantList.map(p => ({ username: p.username, socketId: p.socketId }))
    });

    // Notify other users in the room about the new joiner
    socket.to(interviewId).emit('user-joined', {
      userId: socket.id,
      username: username || 'Anonymous',
      timestamp: new Date().toISOString()
    });

    // Send updated participant count to ALL users in the room (including the new joiner)
    io.to(interviewId).emit('participants-update', {
      count: participantCount,
      participants: participantList.map(p => ({
        username: p.username,
        joinedAt: p.joinedAt
      }))
    });

    console.log(`✉️ Sent participant count ${participantCount} to room ${interviewId}`);
    
    // Send welcome message to the new joiner
    socket.emit('interview-joined', {
      interviewId,
      participantCount,
      message: `Successfully joined interview ${interviewId}`
    });
  });

  socket.on('interview-message', (data) => {
    const { interviewId, user, message } = data;
    
    console.log(`💬 Message in interview ${interviewId}:`, {
      from: user,
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      timestamp: new Date().toISOString()
    });

    // Broadcast message to other participants in the room
    socket.to(interviewId).emit('interview-message', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('code-change', (data) => {
    const { interviewId, code } = data;
    
    console.log(`💻 Code change in interview ${interviewId}:`, {
      codeLength: code ? code.length : 0,
      timestamp: new Date().toISOString()
    });

    // Broadcast code change to other participants
    socket.to(interviewId).emit('code-change', {
      interviewId,
      code,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ User disconnected:`, {
      socketId: socket.id,
      reason,
      timestamp: new Date().toISOString()
    });

    // Remove participant from all interview rooms
    for (const interviewId in participants) {
      const interviewParticipants = participants[interviewId];
      
      if (interviewParticipants.has(socket.id)) {
        const participantInfo = interviewParticipants.get(socket.id);
        interviewParticipants.delete(socket.id);
        
        console.log(`🚪 Removed participant from interview ${interviewId}:`, {
          username: participantInfo?.username,
          socketId: socket.id,
          remainingCount: interviewParticipants.size
        });

        // Notify remaining participants about the disconnection
        socket.to(interviewId).emit('user-left', {
          userId: socket.id,
          username: participantInfo?.username,
          timestamp: new Date().toISOString()
        });

        // Send updated participant count to remaining users
        io.to(interviewId).emit('participants-update', {
          count: interviewParticipants.size,
          participants: Array.from(interviewParticipants.values()).map(p => ({
            username: p.username,
            joinedAt: p.joinedAt
          }))
        });

        // Clean up empty interview rooms
        if (interviewParticipants.size === 0) {
          console.log(`🧹 Cleaning up empty interview room: ${interviewId}`);
          delete participants[interviewId];
        }
        
        break; // Participant can only be in one interview at a time
      }
    }
  });

  // Handle socket errors
  socket.on('error', (error) => {
    console.error(`🔥 Socket error for ${socket.id}:`, error);
  });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error(`🔥 Connection error for ${socket.id}:`, error);
  });
});

// Periodic cleanup of stale data (optional)
setInterval(() => {
  const now = new Date();
  let cleanedRooms = 0;
  
  for (const interviewId in participants) {
    const interviewParticipants = participants[interviewId];
    
    // Remove participants that have been inactive for more than 1 hour
    for (const [socketId, participantInfo] of interviewParticipants.entries()) {
      const timeDiff = now.getTime() - participantInfo.joinedAt.getTime();
      const oneHour = 60 * 60 * 1000;
      
      if (timeDiff > oneHour) {
        interviewParticipants.delete(socketId);
        console.log(`🧹 Cleaned up stale participant: ${participantInfo.username} from ${interviewId}`);
      }
    }
    
    // Remove empty rooms
    if (interviewParticipants.size === 0) {
      delete participants[interviewId];
      cleanedRooms++;
    }
  }
  
  if (cleanedRooms > 0) {
    console.log(`🧹 Periodic cleanup: Removed ${cleanedRooms} empty interview rooms`);
  }
}, 30 * 60 * 1000); // Run every 30 minutes

// Log server statistics periodically
setInterval(() => {
  const totalRooms = Object.keys(participants).length;
  const totalParticipants = Object.values(participants).reduce((sum, room) => sum + room.size, 0);
  
}, 5 * 60 * 1000); // Every 5 minutes

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

});

export default app;