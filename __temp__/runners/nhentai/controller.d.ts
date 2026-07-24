import type { ChapterData, DirectoryRequest, DirectoryFilter, PagedResult, Content, Chapter } from "@suwatte/daisuke";
export declare class Controller {
    private BASE;
    private client;
    private parser;
    getFilters(): DirectoryFilter[];
    getSearchResults(query: DirectoryRequest): Promise<PagedResult>;
    getContent(id: string): Promise<Content>;
    getChapters(id: string): Promise<Chapter[]>;
    getChapterData(chapterId: string): Promise<ChapterData>;
}
