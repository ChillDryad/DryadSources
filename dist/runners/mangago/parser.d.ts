import { type Property, type Chapter, PublicationStatus } from "@suwatte/daisuke";
import { type Element, type CheerioAPI } from "cheerio";
export declare class Parser {
    parseSearch(html: string): {
        id: string;
        title: string;
        cover: string;
    }[];
    parseQuery(html: string): {
        id: string;
        title: string;
        cover: string;
    }[];
    parseManga(html: string, contentId: string): {
        title: string;
        cover: string;
        chapters: Chapter[];
        summary: string;
        properties: Property[];
        status: PublicationStatus.ONGOING;
        isNSFW: boolean;
    };
    parseChapters(html: string, contentId: string): Chapter[];
    parsePages(html: string): {
        url: string;
    }[];
    /**
     * UTILS
     */
    arrayToChapters: ($: CheerioAPI, chapterList: Element[], contentId: string) => Chapter[];
    decodeImages(srcs: string): {
        url: string;
    }[];
}
