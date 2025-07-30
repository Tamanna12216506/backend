"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const questions_1 = __importDefault(require("./routes/questions"));
const performance_1 = __importDefault(require("./routes/performance"));
const geminiRoute_1 = __importDefault(require("./routes/geminiRoute"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000" || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);
// Database connection
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb+srv://tamannayadav741:Tamanna@cluster0.abcrmr1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});
// Routes
app.use('/api', geminiRoute_1.default); // Now available at http://localhost:5000/api/test-gemini
app.use('/api/auth', auth_1.default);
app.use('/api/questions', questions_1.default);
app.use('/api/performance', performance_1.default);
// Socket.IO for real-time mock interviews
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    // Add token verification logic here
    next();
});
io.on('connection', (socket) => {
    console.log('User connected for mock interview:', socket.id);
    socket.on('join-interview', (data) => {
        socket.join(data.interviewId);
        socket.to(data.interviewId).emit('user-joined', {
            userId: socket.id,
            username: data.username
        });
    });
    socket.on('interview-message', (data) => {
        socket.to(data.interviewId).emit('interview-message', {
            ...data,
            timestamp: new Date().toISOString()
        });
    });
    socket.on('code-change', (data) => {
        socket.to(data.interviewId).emit('code-change', data);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map