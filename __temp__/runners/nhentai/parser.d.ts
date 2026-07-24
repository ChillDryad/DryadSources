import type { ChapterPage, Content } from "@suwatte/daisuke";
export declare class Parser {
    parsePagedResponse(html: string): {
        id: string;
        cover: string;
        title: string;
        language: string;
    }[];
    parseContent(html: string, contentId: string): Content;
    parsePages(html: string): ChapterPage[];
}
