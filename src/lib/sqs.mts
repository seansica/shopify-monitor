import { SQSClient, SendMessageCommand, SendMessageCommandInput, DeleteMessageCommand, DeleteMessageCommandInput } from '@aws-sdk/client-sqs';

export class MySQSClient {

    private readonly queueUrl: string;
    private readonly sqs: SQSClient;

    constructor(queueUrl: string) {

        if (!queueUrl) throw new Error('constructor failed - queueUrl is required.');

        this.sqs = new SQSClient({ apiVersion: '2012-11-05' });
        this.queueUrl = queueUrl;

        console.log(`Initialized new SQSClient with queue URL '${this.queueUrl}'`);
    }

    async publish(messageContent: string, messageGroupId: string) {
        console.log(`Received request to publish message content: ${messageContent}`);
        if (!messageContent) {
            return;
        }
        const params: SendMessageCommandInput = {
            MessageGroupId: messageGroupId,
            QueueUrl: this.queueUrl,
            MessageBody: messageContent
        };
        const sendCommand = new SendMessageCommand(params);

        // Send the SQS message

        try {
            await this.sqs.send(sendCommand);
            console.log(`Successfully sent message: ${messageContent}`);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        } catch (err: unknown) {
            console.error(`Error sending message: ${err}`);
            throw err;
        }
        console.log(`Successfully published message.`);
    }

    async delete(receiptHandle: string) {
        const deleteCommand: DeleteMessageCommand = new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: receiptHandle
        })
        try {
            await this.sqs.send(deleteCommand);
            console.log(`Successfully deleted message: ${receiptHandle}`);
        } catch (err: unknown) {
            console.error(`Error deleting message: ${err}`);
            throw err;
        }
        console.log(`Successfully deleted message.`);
    }
}
