import { createServer } from 'http';
import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { startCronJobs } from './jobs/cronJobs';
import { initSocket } from './socket';

const startServer = async () => {
  try {
    await connectDatabase();
    startCronJobs();

    const httpServer = createServer(app);
    initSocket(httpServer);

    const PORT = Number(config.port);
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT} (accessible at http://10.207.37.219:${PORT})`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
