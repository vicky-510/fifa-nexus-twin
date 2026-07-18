const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler.middleware');
const authRoutes = require('./routes/auth.routes');
const simulationRoutes = require('./routes/simulation.routes');
const referenceRoutes = require('./routes/reference.routes');
const logger = require('./utils/logger');

const app = express();

app.use(helmet());

// Gzip responses — the reference payloads (16 stadiums, full match schedule)
// are large, repetitive JSON that compresses ~5-10x. SSE streams are excluded:
// compression buffers output, which would break incremental event delivery.
app.use(
  compression({
    filter: (req, res) => {
      if (req.path.endsWith('/stream')) return false;
      return compression.filter(req, res);
    }
  })
);

// Determine allowed CORS origins
const allowedOrigins = [
  'http://localhost:4200',
  'https://localhost:4200'
];

if (process.env.FRONTEND_URL) {
  // Push production URL if configured
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

logger.info(`CORS configuration loaded. Allowed origins: ${allowedOrigins.join(', ')}`);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. tools, backend-to-backend, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is matched
    const isAllowed = allowedOrigins.some(allowed => {
      return origin === allowed || origin.startsWith(allowed + '/');
    });
    
    if (isAllowed) {
      return callback(null, true);
    } else {
      logger.warn(`CORS access denied for origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Simulation payloads are small JSON bodies; capping size limits abuse via
// oversized requests without affecting any legitimate use of this API.
app.use(express.json({ limit: '100kb' }));

// Simple incoming request log
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  next();
});

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api', simulationRoutes);
app.use('/api', referenceRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
