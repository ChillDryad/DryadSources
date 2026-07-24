import { type Chapter, type ChapterData, type Content, type ContentSource, type DirectoryConfig, type DirectoryRequest, type ImageRequestHandler, type NetworkRequest, type PageLink, type PageSection, type PagedResult, type ResolvedPageSection, type RunnerInfo } from "@suwatte/daisuke";
export declare class Target implements ContentSource, ImageRequestHandler {
    baseUrl: string;
    info: RunnerInfo;
    client: NetworkClient;
    willRequestImage(url: string): Promise<NetworkRequest>;
    getSectionsForPage(page: PageLink): Promise<PageSection[]>;
    resolvePageSection(link: PageLink, sectionID: string): Promise<ResolvedPageSection>;
    getDirectory(request: DirectoryRequest): Promise<PagedResult>;
    getContent(contentId: string): Promise<Content>;
    getChapters(contentId: string): Promise<Chapter[]>;
    private fetchChapters;
    getChapterData(contentId: string, chapterId: string): Promise<ChapterData>;
    getDirectoryConfig(): Promise<DirectoryConfig>;
}
