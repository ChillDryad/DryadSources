"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Target = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const constants_1 = require("./constants");
const cheerio_1 = require("cheerio");
class Target {
    info = {
        id: "kusa.dynastyscans",
        name: "Dynasty Scans",
        thumbnail: "dynasty.png",
        version: 0.8,
        website: constants_1.BASE_URL,
        supportedLanguages: ["EN_US"],
        rating: daisuke_1.CatalogRating.MIXED,
    };
    limitedClient = new daisuke_1.NetworkClientBuilder().setRateLimit(10, 5).build();
    client = new NetworkClient();
    async getDirectory(request) {
        const params = {};
        if (request?.filters?.genres) {
            const included = [];
            const excluded = [];
            for (const filter in request.filters) {
                included.push(...(request.filters[filter].included || []));
                excluded.push(...(request.filters[filter].excluded || []));
            }
            params.with = included.map((g) => `&with[]=${g}`);
            params.without = excluded.map((g) => `&without[]=${g}`);
        }
        params.page = request.page;
        params.q = request.query ? request.query.replace(" ", "+") : "";
        const response = await this.client.get(`${constants_1.BASE_URL}/search?classes%5B%5D=Anthology&classes%5B%5D=Series`, { params });
        const $ = (0, cheerio_1.load)(response.data);
        const titles = $("dl.chapter-list dd").toArray();
        const results = [];
        for (const title of titles) {
            const url = `${constants_1.BASE_URL}${$("a.name", title).attr("href")}.json`;
            const details = await this.limitedClient.get(url);
            const parsedDetails = JSON.parse(details.data);
            if (parsedDetails.name)
                results.push({
                    id: url.split(`${constants_1.BASE_URL}/`)[1],
                    title: parsedDetails.name,
                    cover: `${constants_1.BASE_URL}${parsedDetails.cover}` ?? "",
                });
        }
        return {
            results,
            isLastPage: titles.length < 20,
        };
    }
    async getContent(contentId) {
        const response = await this.client.get(`${constants_1.BASE_URL}/${contentId}`);
        const details = JSON.parse(response.data);
        return { title: details.name, cover: `${constants_1.BASE_URL}${details.cover}` };
    }
    async getChapters(contentId) {
        const response = await this.client.get(`${constants_1.BASE_URL}/${contentId}`);
        const details = JSON.parse(response.data);
        // let volume = ""
        const chapters = [];
        for (const entry in details.taggings.reverse()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const current = details.taggings[entry];
            if (current?.title !== undefined) {
                const newChapter = {
                    chapterId: current.permalink,
                    title: current.title,
                    number: Number(current.title.match(/chapter \d+/gi)?.[0].match(/\d+/)[0]) ||
                        0,
                    index: Number(entry),
                    // volume: Number(volume),
                    date: new Date(current.released_on),
                    language: "en_us",
                };
                chapters.push(newChapter);
            }
        }
        return chapters;
    }
    async getChapterData(_contentId, chapterId) {
        const response = await this.client.get(`${constants_1.BASE_URL}/chapters/${chapterId}.json`);
        const details = JSON.parse(response.data);
        const pages = details.pages.map((page) => ({
            url: `${constants_1.BASE_URL}${page.url}`,
        }));
        return { pages };
    }
    async getDirectoryConfig() {
        return {};
    }
}
exports.Target = Target;
