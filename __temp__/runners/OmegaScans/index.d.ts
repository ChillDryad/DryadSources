import { type Chapter, type ChapterData, type Content, type ContentSource, type DirectoryConfig, type DirectoryRequest, type PageLink, type PageSection, type PagedResult, type ResolvedPageSection, type RunnerInfo } from "@suwatte/daisuke";
export declare class Target implements ContentSource {
    baseUrl: string;
    apiUrl: string;
    info: RunnerInfo;
    client: NetworkClient;
    getSectionsForPage(page: PageLink): Promise<PageSection[]>;
    resolvePageSection(link: PageLink, section: string): Promise<ResolvedPageSection>;
    getDirectory(request: DirectoryRequest): Promise<PagedResult>;
    getSeriesSlug(contentId: string): Promise<any>;
    getContent(contentId: string): Promise<Content>;
    getChapters(contentId: string): Promise<Chapter[]>;
    getChapterData(contentId: string, chapterId: string): Promise<ChapterData>;
    getDirectoryConfig(): Promise<DirectoryConfig>;
}
