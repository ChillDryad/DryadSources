import { type Chapter, type ChapterData, type Content, type ContentSource, type DirectoryConfig, type DirectoryRequest, type PagedResult, type RunnerInfo } from "@suwatte/daisuke";
export declare class Target implements ContentSource {
    info: RunnerInfo;
    private controller;
    getContent(contentId: string): Promise<Content>;
    getChapters(contentId: string): Promise<Chapter[]>;
    getChapterData(_contentId: string, chapterId: string): Promise<ChapterData>;
    getDirectory(request: DirectoryRequest): Promise<PagedResult>;
    getDirectoryConfig(): Promise<DirectoryConfig>;
}
