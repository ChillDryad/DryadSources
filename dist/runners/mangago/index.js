"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Target = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const parser_1 = require("./parser");
const constants_1 = require("./constants");
class Target {
    baseURL = "https://www.mangago.me";
    client = new NetworkClient();
    parser = new parser_1.Parser();
    info = {
        id: "kusa.mangago",
        name: "Mangago",
        thumbnail: "mangago.png",
        version: 0.4,
        website: this.baseURL,
        supportedLanguages: ["EN_US"],
        rating: daisuke_1.CatalogRating.MIXED,
    };
    async getDirectory(request) {
        let url = "";
        if (request?.query) {
            url = `${this.baseURL}/r/l_search/?name=${request.query}&page=${request.page || 1}`;
            const response = await this.client.get(url);
            const results = this.parser.parseQuery(response.data);
            return {
                results,
                isLastPage: results.length < 10,
            };
        }
        else {
            const included = [
                ...(request.filters?.genres?.included ?? []),
                ...(request.filters?.adult?.included ?? []),
            ];
            const excluded = [
                ...(request.filters?.genres?.excluded ?? []),
                ...(request.filters?.adult?.excluded ?? []),
            ];
            url = `${this.baseURL}/genre/${included.length > 0 ? included.join(",") : "All"}/${request.page ?? 1}/?f=${request.filters?.status?.includes("completed") ? "0" : "1"}&o=${request.filters?.status?.includes("ongoing") ? "0" : "1"}&sortby=${request.sort.id || "view"}&e=${excluded.length > 0 ? excluded.join(",") : ""}`;
            const response = await this.client.get(url);
            const results = this.parser.parseSearch(response.data);
            return {
                results,
                isLastPage: results.length < 48,
            };
        }
    }
    async getContent(contentId) {
        const response = await this.client.get(`${this.baseURL}/read-manga/${contentId}`);
        const parsed = this.parser.parseManga(response.data, contentId);
        return parsed;
    }
    async getChapters(contentId) {
        const response = await this.client.get(`${this.baseURL}/read-manga/${contentId}`);
        const parsed = this.parser.parseChapters(response.data, contentId);
        return parsed;
    }
    async getChapterData(contentId, chapterId) {
        const url = `${this.baseURL}/read-manga/${contentId}${chapterId}`;
        const response = await this.client.get(url);
        return { pages: this.parser.parsePages(response.data) };
    }
    async getDirectoryConfig() {
        return {
            filters: [
                {
                    id: "genres",
                    title: "Genres",
                    type: daisuke_1.FilterType.EXCLUDABLE_MULTISELECT,
                    options: constants_1.TAGS.sort((a, b) => a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1),
                },
                {
                    id: "status",
                    title: "Upload Status",
                    type: daisuke_1.FilterType.MULTISELECT,
                    options: constants_1.STATUS.sort((a, b) => a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1),
                },
                {
                    id: "adult",
                    title: "Adult Genres",
                    type: daisuke_1.FilterType.EXCLUDABLE_MULTISELECT,
                    options: constants_1.ADULT.sort((a, b) => a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1),
                },
            ],
            sort: {
                options: constants_1.SORT,
                default: {
                    id: "comment_count",
                },
            },
        };
    }
}
exports.Target = Target;
