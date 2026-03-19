import cron from 'node-cron';
import { batchProcessMatches } from '../services/matchingEngine.js';

// Run matching algorithm every night at 2 AM
export const startMatchingCron = () => {
    cron.schedule('0 2 * * *', async () => {
        console.log('🕐 Running nightly match calculation...');
        try {
            await batchProcessMatches();
            console.log('✅ Nightly match calculation completed');
        } catch (error) {
            console.error('❌ Error in nightly match calculation:', error);
        }
    });

    console.log('✅ Matching cron job scheduled (runs daily at 2 AM)');
};
