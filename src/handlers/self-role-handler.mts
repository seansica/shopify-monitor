import Discord from 'discord.js';
import { Database } from '../lib/database/index.mjs';
import { ConfigTableType } from "../constants.mjs";

// Get environment variables - set by CloudFormation/SAM
const configTableName = process.env.CONFIG_TABLE;

if (!configTableName) throw new Error('CONFIG_TABLE must be defined.');

// Define the shape of the `event` argument
interface Event {
    body: string;
}

// Define the main function that handles the slash command
export const handler = async (event: Event) => {
    // Create an instance of Discord client
    const client = new Discord.Client();

    // Wait until the client is ready
    client.on('ready', async () => {
        // Parse the payload from the `event` argument
        const payload = JSON.parse(event.body);
        // Get the Discord message from the payload
        const message = payload.message;

        // Check if the message starts with the "/subscribe" command
        if (!message.content.startsWith('/subscribe')) return;

        // Get the argument after the "/subscribe" command
        const args = message.content.slice(10).split(' ');
        const role = args[0];

        // Check if the argument is valid
        if (!["norbauer", "des"].includes(role)) {
            // Send a reply to the message with an error if the argument is invalid
            message.reply("Invalid argument. Must be either 'norbauer' or 'des'");
            return;
        }

        // Get the Discord guild from the message
        const guild = message.guild;
        // Get the user who sent the message
        const user = message.author;
        // Find the role with the specified name
        const roleToAdd = guild.roles.cache.find((r: { name: any; }) => r.name === role);

        // Check if the role was found
        if (!roleToAdd) {
            // Send a reply to the message with an error if the role was not found
            message.reply(`Error: role '${role}' not found.`);
            return;
        }

        // Get the user ID
        const userId = user.id;
        // Define the item to be added to the DynamoDB table
        const params = {
            "UserId": {S: userId},
            "Role": {S: role},
            type: ConfigTableType.ROLE
        };

        try {
            // Add the role to the user and add the item to the DynamoDB table
            await user.roles.add(roleToAdd);
            await Database.putItem(configTableName, params);
            // Send a reply to the message with a success message
            message.reply(`Successfully subscribed to ${role}.`);
        } catch (error) {
            console.error("Error adding item to DynamoDB or adding role: ", error);
            message.reply("Error subscribing. Please try again later.");
        }
    });

    // Log in to the Discord client using a bot token
    client.login('yourDiscordBotToken');

    return {
        statusCode: 200,
        body: 'Discord Bot has been invoked'
    };
};
