import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'scouting-app',
  brokers: ['kafka:9092'],
});

export const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
};