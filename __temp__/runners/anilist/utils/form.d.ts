import { FormProps } from "../types";
import { Form } from "@suwatte/daisuke";
/**
 * Builds the Entry Edit Form for the given title using the media list entry
 */
export declare const buildEntryForm: (id: string) => Promise<Form>;
/**
 * Updates a media entry on anilist using the provided form
 */
export declare const handleSubmitEntryForm: (id: string, form: FormProps) => Promise<void>;
