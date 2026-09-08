import { connect, type Channel, type ChannelModel } from "amqplib";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

let connection: ChannelModel | undefined;
let channel: Channel | undefined;

export async function getRabbitMqChannel(): Promise<Channel> {
  if (channel) return channel;

  connection = await connect(env.RABBITMQ_URL);
  connection.on("error", (err) => logger.error({ err }, "RabbitMQ connection error"));
  connection.on("close", () => {
    logger.warn("RabbitMQ connection closed");
    channel = undefined;
    connection = undefined;
  });

  channel = await connection.createChannel();
  return channel;
}
