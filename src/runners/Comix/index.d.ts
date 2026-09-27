import { type Chapter, type ChapterData, type Content, type ContentSource, type DirectoryConfig, type DirectoryRequest, type ImageRequestHandler, type NetworkRequest, type PageLink, type PageSection, type PagedResult, type ResolvedPageSection, type RunnerInfo } from "@suwatte/daisuke";
export declare class Target implements ContentSource, ImageRequestHandler {
    baseUrl: string;
    apiUrl: string;
    info: RunnerInfo;
    get config(): {
        cloudflareResolutionURL: string;
    };
    client: NetworkClient;
    willRequestImage(url: string): Promise<NetworkRequest>;
    getSectionsForPage(page: PageLink): Promise<PageSection[]>;
    resolvePageSection(link: PageLink, sectionID: string): Promise<ResolvedPageSection>;
    getDirectory(request: DirectoryRequest): Promise<PagedResult>;
    getContent(contentId: string): Promise<Content>;
    getChapters(contentId: string): Promise<Chapter[]>;
    getChapterData(contentId: string, chapterId: string): Promise<ChapterData>;
    getDirectoryConfig(): Promise<DirectoryConfig>;
}
