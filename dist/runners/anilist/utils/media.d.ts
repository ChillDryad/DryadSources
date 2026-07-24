import { DirectoryFilter, DirectoryRequest, FullTrackItem, Highlight, PageSection, PagedResult } from "@suwatte/daisuke";
export declare const getSearchResults: (titles: string[]) => Promise<Highlight[]>;
export declare const simpleSearch: (search: string) => Promise<Highlight[]>;
export declare const getHomePage: () => Promise<PageSection[]>;
export declare const getHomePageViewMore: (key: string, page: number) => Promise<PagedResult>;
export declare const getFullMedia: (id: string) => Promise<FullTrackItem>;
export declare const fullSearch: (query: DirectoryRequest) => Promise<Highlight[]>;
export type AnilistTag = {
    category: string;
    isAdult: boolean;
    name: string;
};
export type GroupedAnilistTag = {
    [key: string]: AnilistTag[];
};
export declare const groupTags: (tags: AnilistTag[]) => GroupedAnilistTag;
export declare const buildGenres: () => Promise<DirectoryFilter[]>;
