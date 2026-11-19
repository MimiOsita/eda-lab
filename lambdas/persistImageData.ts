import { SQSHandler } from "aws-lambda";
import {
    GetObjectCommand,
    GetObjectCommandInput,
    S3Client,
} from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const s3 = new S3Client();
const ddbDobClient = createDDbDocClient();

export const handler: SQSHandler = async (event) => {
    console.log("Event ", JSON.stringify(event));
    for (const record of event.Records) {
        const recordBody = JSON.parse(record.body);
        const snsMessage = JSON.parse(recordBody.Message);
        console.log("Record body ", JSON.stringify(snsMessage));
        if (snsMessage.Records) {
            for (const s3Message of snsMessage.Records) {
                const s3e = s3Message.s3;
                const srcBucket = s3e.bucket.name;

                const srcKey = decodeURIComponent(s3e.object.key.replace(/\+/g, " "));

                try {
                    await ddbDobClient.send(
                        new PutCommand({
                            TableName: process.env.TABLE_NAME,
                            Item: {
                                name: srcKey
                            },
                        })
                    );
                } catch (error) {
                    console.log(error);
                }
            }
        }
    }
};

function createDDbDocClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.Region });
    const marshallOptions = {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
        wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);

}