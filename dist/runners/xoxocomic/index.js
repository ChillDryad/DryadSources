"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Target = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const cheerio_1 = require("cheerio");
class Target {
    info = {
        id: "kusa.xoxocomics",
        name: "XOXO Comics",
        version: 0.1,
        website: "https://xoxocomic.com/",
        supportedLanguages: ["EN_UK"],
        thumbnail: "xoxo.png",
        minSupportedAppVersion: "5.0",
        rating: daisuke_1.CatalogRating.MIXED,
    };
    baseUrl = "https://xoxocomic.com";
    client = new NetworkClient();
    async getDirectory(request) {
        const params = {};
        params.page = request.page || 1;
        const url = request.query
            ? `${this.baseUrl}/search-comic?keyword=${request.query}`
            : `${this.baseUrl}/popular-comic`;
        console.log(url);
        const response = await this.client.get(url, {
            params,
        });
        const $ = (0, cheerio_1.load)(response.data);
        const items = $("div.items div.row .item").toArray();
        const highlights = items.map((item) => {
            const id = $("a", item).attr("href").split(`${this.baseUrl}/`)[1];
            const title = $("figcaption h3 a", item).text();
            const cover = $("img", item).attr("data-original");
            return { id, title, cover };
        });
        return {
            results: highlights,
            isLastPage: highlights.length < 36,
        };
    }
    async getContent(contentId) {
        let page = 1;
        const response = await this.client.get(`${this.baseUrl}/${contentId}`);
        const $ = (0, cheerio_1.load)(response.data);
        const chapters = await this.parseChapters(response.data);
        while (chapters.length % 50 === 0) {
            page++;
            const res = await this.client.get(`${this.baseUrl}/${contentId}`, {
                params: {
                    page,
                },
            });
            chapters.push(...(await this.parseChapters(res.data, page)));
        }
        console.log(chapters[0]);
        return {
            title: $("h1.title-detail").text(),
            cover: $("div.detail-info img").attr("src"),
            chapters: chapters,
            recommendedPanelMode: daisuke_1.ReadingMode.PAGED_COMIC,
        };
    }
    /**
     * first entry is null
     * need to swap map to while
     * 50 chapters per page.
     */
    async parseChapters(html, page) {
        const $ = (0, cheerio_1.load)(html);
        const entries = $("div.list-chapter ul li.row").toArray();
        const chapters = [];
        let i = 0;
        let index = page ? 1 + page * 50 : 1;
        while (i < entries.length) {
            const entry = entries[i];
            const chapterId = $("a", entry).attr("href");
            const date = new Date($("div.text-center", entry).text());
            const title = $("a", entry).text().trim();
            if (chapterId) {
                chapters.push({
                    chapterId: chapterId.split("/comic/")[1],
                    title,
                    date,
                    number: index,
                    index,
                    language: "EN_UK",
                });
                index += 1;
            }
            i++;
        }
        return chapters.sort((a, b) => a.index - b.index);
    }
    async getChapters(contentId) {
        let page = 1;
        const response = await this.client.get(`${this.baseUrl}/${contentId}`);
        const chapters = await this.parseChapters(response.data);
        while (chapters.length % 50 === 0) {
            page++;
            const res = await this.client.get(`${this.baseUrl}/${contentId}`, {
                params: {
                    page,
                },
            });
            chapters.push(...(await this.parseChapters(res.data, page)));
        }
        return chapters;
    }
    async getChapterData(_contentId, chapterId) {
        const res = await this.client.get(`${this.baseUrl}/comic/${chapterId}/all`);
        const $ = (0, cheerio_1.load)(res.data);
        const pages = $("div.page-chapter").toArray();
        return {
            pages: pages.map((page) => ({
                url: $("img", page).attr("data-original"),
            })),
        };
    }
    async getDirectoryConfig(_configID) {
        return {};
    }
}
exports.Target = Target;
