/**
 * Get's the scoring format for the current authenticated user
 */
export declare const getScoreFormat: () => Promise<string>;
export declare const getViewer: () => Promise<{
    id: number;
    name: string;
    avatar: {
        large: string;
    };
    bannerImage?: string;
    options: {
        titleLanguage: string;
        displayAdultContent: boolean;
    };
    mediaListOptions: {
        mangaList: {
            sectionOrder: string[];
        };
    };
}>;
