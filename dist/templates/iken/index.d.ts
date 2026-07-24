import type { Chapter, ChapterData, Content, DirectoryConfig, DirectoryRequest, PagedResult, Property } from "@suwatte/daisuke";
export declare abstract class IkenTemplate {
    constructor(params: Record<string, string>);
    getDirectory(request: DirectoryRequest): Promise<PagedResult>;
    getContent(contentId: string): Promise<Content>;
    getChapters(contentId: string): Promise<Chapter[]>;
    getChapterData(_contentId: string, chapterId: string): Promise<ChapterData>;
    getTags?(): Promise<Property[]>;
    getDirectoryConfig(_configID?: string | undefined): Promise<DirectoryConfig>;
}
