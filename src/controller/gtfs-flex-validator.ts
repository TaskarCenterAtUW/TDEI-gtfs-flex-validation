import { Core } from "nodets-ms-core";
import { ILoggable } from "nodets-ms-core/lib/core/logger/abstracts/ILoggable";
import { QueueMessage } from "nodets-ms-core/lib/core/queue";
import { ITopicSubscription } from "nodets-ms-core/lib/core/queue/abstracts/IMessage-topic";
import { Topic } from "nodets-ms-core/lib/core/queue/topic";
import { unescape } from "querystring";
import { environment } from "../environment/environment";
import { GTFSFlexUpload } from "../model/event/gtfs-flex-upload";
import { GTFSFlexValidation } from "../model/event/gtfs-flex-validation";
import { IValidator } from "./interface/IValidator";


export class GTFSFlexValidator implements IValidator, ITopicSubscription {

    readonly listeningTopicName = environment.eventBus.uploadTopic ?? "";
    readonly publishingTopicName = environment.eventBus.validationTopic ?? "";
    readonly subscriptionName = environment.eventBus.uploadSubscription ?? "";
    listeningTopic: Topic;
    publishingTopic: Topic;
    logger: ILoggable;

    constructor() {
        Core.initialize();
        this.listeningTopic = Core.getTopic(this.listeningTopicName);
        this.publishingTopic = Core.getTopic(this.publishingTopicName);
        this.logger = Core.getLogger();
        this.listeningTopic.subscribe(this.subscriptionName, this).catch((error) => {
            console.log('Error while subscribing');
            console.log(error);
        });
    }

    onReceive(message: QueueMessage) {
        console.log('Received message');
        console.log(message);
        this.validate(message);

    }

    onError(error: Error) {
        console.log('Received error');
        console.log(error);
    }


    validate(message: QueueMessage): void {
        const gtfsUploadMessage = GTFSFlexUpload.from(message.data);
        console.log(gtfsUploadMessage.fileUploadPath);
        //https://xxxx-namespace.blob.core.windows.net/gtfsflex/2022%2FNOVEMBER%2F101%2Ffile_1669110207839_1518e1dd1d4741a19a5dbed8f9b8d0a1.zip
        const fileRelativePath = gtfsUploadMessage.fileUploadPath?.split('/').splice(-1)[0];
        if (fileRelativePath) {
            const filePathClean = unescape(fileRelativePath);
            const fileName = filePathClean.split('/').splice(-1)[0];
            console.log(fileName);
            if (fileName.includes('invalid')) {
                this.sendStatus(false, gtfsUploadMessage, 'Invalid file');
                return;
            }
            if (fileName.includes('valid')) {
                console.log('Valid file');
                this.sendStatus(true, gtfsUploadMessage);
                return;
            }
            console.log('Invalid file.. No regex found');
            this.sendStatus(false, gtfsUploadMessage, 'No regex found in file ' + fileName);
            return;
        }
    }

    private sendStatus(valid: boolean, uploadMessage: GTFSFlexUpload, validationMessage: string = '') {
        var statusMessage = GTFSFlexValidation.from(uploadMessage);
        statusMessage.isValid = valid;
        statusMessage.validationTime = 90; // This is hardcoded.
        statusMessage.validationMessage = validationMessage;
        this.publishingTopic.publish(QueueMessage.from(
            {
                messageId: '98383',
                message: "Validation complete",
                messageType: 'gtfsflexvalidation',
                data: statusMessage
            }
        ));
    }

}