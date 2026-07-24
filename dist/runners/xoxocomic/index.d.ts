import type { Chapter, ChapterData, Content, ContentSource, DirectoryConfig, DirectoryRequest, PagedResult, RunnerInfo } from "@suwatte/daisuke";
export declare class Target implements ContentSource {
    info: RunnerInfo;
    baseUrl: string;
    client: NetworkClient;
    getDirectory(request: DirectoryRequest): Promise<PagedResult>;
    getContent(contentId: string): Promise<Content>;
    /**
     * first entry is null
     * need to swap map to while
     * 50 chapters per page.
     */
    parseChapters(html: string, page?: number): Promise<Chapter[]>;
    getChapters(contentId: string): Promise<Chapter[]>;
    getChapterData(_contentId: string, chapterId: string): Promise<ChapterData>;
    getDirectoryConfig(_configID?: string | undefined): Promise<DirectoryConfig>;
}
