"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Target = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const cheerio_1 = require("cheerio");
const constants_1 = require("./constants");
class Target {
    baseUrl = "https://manga18fx.com";
    client = new NetworkClient();
    info = {
        id: "kusa.manga18fx",
        name: "Manga18fx",
        thumbnail: "manga18fx.jpg",
        version: 0.2,
        website: this.baseUrl,
        supportedLanguages: ["EN_US"],
        rating: daisuke_1.CatalogRating.NSFW,
    };
    async getDirectory(request) {
        let url = this.baseUrl;
        if (request.query)
            url = `${url}/search?q=${request.query.replace(" ", "+")}${request.page ? `&page=${request.page}` : ""}`;
        else if (request?.filters?.genres)
            url = `${url}/manga-genre/${request.filters.genres}${request.page ? `/${request.page}` : ""}`;
        const response = await this.client.get(url);
        const $ = (0, cheerio_1.load)(response.data);
        const webtoons = $("div.listupd div.page-item").toArray();
        const highlights = webtoons.map((webtoon) => {
            return {
                title: $("h3 a", webtoon).text().trim(),
                id: $("h3 a", webtoon).attr("href"),
                cover: $("div.thumb-manga a img", webtoon).attr("data-src") ??
                    $("div.thumb-manga a img", webtoon).attr("src"),
            };
        });
        return {
            results: highlights,
            isLastPage: highlights.length < 24,
        };
    }
    async getContent(contentId) {
        const response = await this.client.get(`${this.baseUrl}${contentId}`);
        const $ = (0, cheerio_1.load)(response.data);
        const title = $("h1").text().trim();
        const cover = $("div.tab-summary div.summary_image img").attr("data-src") ??
            $("div.tab-summary div.summary_image img").attr("src");
        const summary = $("div.panel-story-description div.dsct").text();
        // const additionalTitles = $("")
        const chapters = await this.getChapters(contentId);
        return {
            title,
            cover,
            summary,
            chapters,
        };
    }
    async getChapters(contentId) {
        const response = await this.client.get(`${this.baseUrl}${contentId}`);
        const $ = (0, cheerio_1.load)(response.data);
        const data = $("li.a-h").toArray();
        const chapters = data.map((chapter, i) => {
            const chapterNumber = Number($("a.chapter-name", chapter)
                .text()
                .match(/(\d|\.)+/g)?.[0]);
            return {
                chapterId: $("a.chapter-name", chapter)
                    .attr("href")
                    .split("manga/")[1]
                    .split("/")[1],
                title: $("a.chapter-name", chapter).text(),
                index: i,
                number: chapterNumber,
                language: "EN_US",
                date: new Date(),
                webUrl: `${this.baseUrl}${$("a.chapter-name", chapter).attr("href")}`,
            };
        });
        return chapters;
    }
    async getChapterData(contentId, chapterId) {
        const response = await this.client.get(`${this.baseUrl}${contentId}/${chapterId}`);
        const $ = (0, cheerio_1.load)(response.data);
        const pages = $("div.page-break")
            .toArray()
            .map((page) => {
            return { url: $("img", page).attr("data-src") ?? $("img").attr("src") };
        });
        return { pages };
    }
    async getDirectoryConfig() {
        return {
            filters: [
                {
                    id: "genres",
                    title: "Genres",
                    type: daisuke_1.FilterType.SELECT,
                    options: constants_1.GENRES,
                },
            ],
        };
    }
}
exports.Target = Target;
