import { Highlight, PagedResult } from "@suwatte/daisuke";
/**
 * Gets the media list entry for a given title
 */
export declare const getMediaListEntry: (id: string) => Promise<import("../types").Media>;
export declare const parseTrackItem: (id: string) => Promise<Highlight>;
export declare const getMediaListCollection: (name: string) => Promise<PagedResult>;
