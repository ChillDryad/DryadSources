import { type Chapter, type ChapterData, type Content, type DirectoryConfig, type DirectoryRequest, type PagedResult, type RunnerInfo, type ContentSource } from "@suwatte/daisuke";
export declare class Target implements ContentSource {
    info: RunnerInfo;
    limitedClient: NetworkClient;
    client: NetworkClient;
    getDirectory(request: DirectoryRequest): Promise<PagedResult>;
    getContent(contentId: string): Promise<Content>;
    getChapters(contentId: string): Promise<Chapter[]>;
    getChapterData(_contentId: string, chapterId: string): Promise<ChapterData>;
    getDirectoryConfig(): Promise<DirectoryConfig>;
}
