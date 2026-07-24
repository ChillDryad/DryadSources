import { ExcludableMultiSelectProp, Option, PublicationStatus } from "@suwatte/daisuke";
export declare const getSortOptions: () => Option[];
export declare const getSortKey: (key: string, ascending: boolean) => string;
export declare const convertSTTFilter: (filters: {
    [key: string]: ExcludableMultiSelectProp;
}) => Record<string, string[]>;
export declare const convertStatus: (key: string) => PublicationStatus.ONGOING | PublicationStatus.COMPLETED | PublicationStatus.HIATUS;
