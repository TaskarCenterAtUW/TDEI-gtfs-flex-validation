import { Prop } from "nodets-ms-core/lib/models";
import { GTFSFlexUpload } from "./gtfs-flex-upload";

export class GTFSFlexValidation extends GTFSFlexUpload {
    @Prop('is_valid')
    isValid: boolean = false;
    @Prop('validation_message')
    validationMessage?: string;
    @Prop('validation_time')
    validationTime: number = 0;
}