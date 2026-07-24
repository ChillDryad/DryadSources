import { FuzzyDate } from "../types";
export * from "./form";
export * from "./mediaList";
export * from "./user";
/**
 * Parse Param from url, URL and URLSearchParam not available in JSCore environment
 */
export declare function getParamFromURL(url: string, param: string): string;
/**
 * Checks if a user is authenticated
 */
export declare function authenticated(): Promise<boolean>;
export declare const AUTHENTICATED_CLIENT: NetworkClient;
/**
 * Makes a request to the Anilist GraphQL API
 */
export declare function request<T>(query: string, variables?: any): Promise<T>;
/**
 * Parses a string id into an integer id
 */
export declare const parseID: (id: string) => number;
/**
 * parses an anilist fuzzy date to a date
 */
export declare const parseFuzzyDate: (date: FuzzyDate) => Date | undefined;
/**
 * converts a js date to an anilist fuzzy date
 */
export declare const convertToFuzzyDate: (date: Date) => FuzzyDate;
export declare const parseWebUrl: (id: number | string) => string;
export declare const preferenceKeys: {
    nsfw: string;
};
