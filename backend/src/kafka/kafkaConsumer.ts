import { Kafka } from 'kafkajs';
import PlayerProfile from '../models/PlayerProfile';
import Scouting, { ScoutingStatus } from '../models/Scouting';
import Application, { ApplicationStatus } from '../models/Application';
import Notification from '../models/Notification';
import { matchesFilters } from '../utils/matchesFilters';

const kafka = new Kafka({
    clientId: 'scouting-app-consumer',
    brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'scouting-application-group' });

export const startConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'scouting-applications', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }: any) => {
            const { scoutingId, playerId } = JSON.parse(message.value.toString());

            const profile = await PlayerProfile.findById(playerId);
            const scouting = await Scouting.findById(scoutingId);

            if (!profile || !scouting) return;

            if (scouting.scouting_status !== ScoutingStatus.ACTIVE) return;

            if (!matchesFilters(profile, scouting)) return;
            
            const updatedScouting = await Scouting.findOneAndUpdate(
                {
                    _id: scouting._id,
                    selected_count: { $lt: scouting.players_required },
                },
                { $inc: { selected_count: 1 } },
                { new: true }
            );

            if (!updatedScouting) {
                
                console.log(`Scouting ${scouting._id} full. Player ${profile._id} rejected.`);
                return;
            }
           
            const application = await Application.create({
                scoutingId: scouting._id,
                playerId: profile._id,
                organizationId: scouting.organizationId,
                status: ApplicationStatus.PENDING,
            });
        
            await Notification.create({
                userId: scouting.organizationId,
                type: 'APPLICATION_RECEIVED',
                message: `New applicant for your scouting: ${profile._id}`,
                relatedId: application._id,
            });

            console.log(`Player ${profile._id} applied successfully to scouting ${scouting._id}`);
        },
    });
};