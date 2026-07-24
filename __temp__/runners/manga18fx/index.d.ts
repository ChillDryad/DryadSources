import { Chapter, ChapterData, Content, ContentSource, DirectoryConfig, DirectoryRequest, PagedResult, RunnerInfo } from "@suwatte/daisuke";
export declare class Target implements ContentSource {
    baseUrl: string;
    client: NetworkClient;
    info: RunnerInfo;
    getDirectory(request: DirectoryRequest): Promise<PagedResult>;
    getContent(contentId: string): Promise<Content>;
    getChapters(contentId: string): Promise<Chapter[]>;
    getChapterData(contentId: string, chapterId: string): Promise<ChapterData>;
    getDirectoryConfig(): Promise<DirectoryConfig>;
}
