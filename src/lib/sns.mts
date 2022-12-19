// import { SNS } from "aws-sdk";
import { SNSClient, PublishCommand, PublishCommandInput } from "@aws-sdk/client-sns";
export class SimpleNotificationService {

    private readonly region: string;
    private readonly topicArn: string;
    private readonly sns: SNSClient;

    constructor(region: string, topicArn: string) {

        if (!region) throw new Error('region is required');
        if (!topicArn) throw new Error('topicArn is required.');

        this.region = region;
        this.topicArn = topicArn;

        // Create an SNS client
        // Set the AWS region in which your SNS topic is located
        // this.sns = new SNS({ region: region });
        this.sns = new SNSClient({ region: region });
    }

    async publish(messageContent: string) {
        if (!messageContent) {
            return;
        }
        const params: PublishCommandInput = {
            Message: messageContent,
            TopicArn: this.topicArn
        };
        const command = new PublishCommand(params)
        // Send the SNS message
        try {
            return await this.sns.send(command);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        } catch (err: unknown) {
            console.error('Error', err);
            throw err;
        }
    }
}
