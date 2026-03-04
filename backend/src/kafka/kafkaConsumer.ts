import { Kafka } from 'kafkajs';
import PlayerProfile from '../models/PlayerProfile';
import Scouting, { ScoutingStatus } from '../models/Scouting';
import Application, { ApplicationStatus } from '../models/Application';
import Notification from '../models/Notification';
import { matchesFilters } from '../utils/matchesFilters';

const kafka = new Kafka({
    clientId: 'scouting-app-consumer',
    brokers: ['kafka:9092'],
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

            if (scouting.selected_count >= scouting.players_required) {
                console.log(`Scouting ${scouting._id} full. Player ${profile._id} application skipped.`);
                return;
            }

            // If player has a previous REJECTED application, remove it first (unique index)
            // WITHDRAWN records are already deleted by the controller before sending to Kafka
            await Application.deleteOne({
                scoutingId: scouting._id,
                playerId: profile._id,
                status: ApplicationStatus.REJECTED,
            });

            let application;
            try {
                application = await Application.create({
                    scoutingId: scouting._id,
                    playerId: profile._id,
                    organizationId: scouting.organizationId,
                    status: ApplicationStatus.PENDING,
                });
            } catch (err: any) {
                if (err.code === 11000) {
                    // Already has a PENDING/SELECTED application — silently skip
                    console.log(`Player ${profile._id} already has an active application for scouting ${scouting._id}. Skipped.`);
                    return;
                }
                throw err;
            }

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