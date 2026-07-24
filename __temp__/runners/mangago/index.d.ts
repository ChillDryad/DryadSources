import { type Chapter, type ChapterData, type Content, type ContentSource, type DirectoryConfig, type DirectoryRequest, type PagedResult, type RunnerInfo } from "@suwatte/daisuke";
import { Parser } from "./parser";
export declare class Target implements ContentSource {
    baseURL: string;
    client: NetworkClient;
    parser: Parser;
    info: RunnerInfo;
    getDirectory(request: DirectoryRequest): Promise<PagedResult>;
    getContent(contentId: string): Promise<Content>;
    getChapters(contentId: string): Promise<Chapter[]>;
    getChapterData(contentId: string, chapterId: string): Promise<ChapterData>;
    getDirectoryConfig(): Promise<DirectoryConfig>;
}
