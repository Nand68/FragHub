import cron from 'node-cron';
import OTP from '../models/OTP';

export const startCronJobs = () => {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const result = await OTP.deleteMany({ expiresAt: { $lt: new Date() } });
      if (result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
      }
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  });

  console.log('Cron jobs started');
};
