"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Target = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const cheerio_1 = require("cheerio");
const constants_1 = require("./constants");
class Target {
    baseUrl = "https://omegascans.org";
    apiUrl = this.baseUrl.replace("//", "//api.");
    info = {
        id: "kusa.omegascans",
        name: "OmegaScans",
        thumbnail: "omega.png",
        version: 1.3,
        website: this.baseUrl,
        supportedLanguages: ["EN_US"],
        rating: daisuke_1.CatalogRating.NSFW,
    };
    client = new NetworkClient();
    async getSectionsForPage(page) {
        if (page.id === "home")
            return [
                {
                    id: "top",
                    title: "Most Popular",
                    style: daisuke_1.SectionStyle.GALLERY,
                },
                {
                    id: "latest",
                    title: "Latest Update",
                    style: daisuke_1.SectionStyle.GALLERY,
                },
                {
                    id: "newest",
                    title: "Newest",
                    style: daisuke_1.SectionStyle.GALLERY,
                },
                {
                    id: "completed",
                    title: "Completed",
                    style: daisuke_1.SectionStyle.PADDED_LIST,
                },
            ];
        else
            throw new Error("You see nothing here.");
    }
    async resolvePageSection(link, section) {
        if (link.id === "home") {
            const params = {
                adult: true,
            };
            switch (section) {
                case "top":
                    params.orderBy = "total_views";
                    params.status = "All";
                    break;
                case "latest":
                    params.orderBy = "latest";
                    params.status = "All";
                    break;
                case "newest":
                    params.orderBy = "created_at";
                    params.status = "All";
                    break;
                case "completed":
                    params.orderBy = "latest";
                    params.status = "Completed";
                    break;
            }
            const response = await this.client.get(`${this.apiUrl}/query`, { params });
            const jsonResponse = JSON.parse(response.data).data;
            const highlights = jsonResponse.map((item) => ({
                id: item.id.toString(),
                title: item.title,
                cover: item.thumbnail,
            }));
            return {
                items: highlights,
            };
        }
        else
            throw new Error(`Unable to create sections for ${link.id}`);
    }
    async getDirectory(request) {
        const params = {};
        const genres = [];
        if (request?.filters?.genres)
            genres.push(request.filters.genres.map((g) => Number(g)));
        params.page = request.page;
        params.query_string = request?.query;
        params.status = request?.filters?.status;
        params.tags_ids = `[${genres.join(",")}]`;
        params.orderBy = request?.sort?.id ?? "latest";
        params.adult = true;
        const response = await this.client.get(`${this.apiUrl}/query`, {
            params,
        });
        const jsonResponse = JSON.parse(response.data);
        const highlights = jsonResponse.data.map((item) => ({
            id: item.id.toString(),
            title: item.title,
            cover: item.thumbnail,
        }));
        return {
            results: highlights,
            isLastPage: highlights.length < 12,
        };
    }
    async getSeriesSlug(contentId) {
        const seriesSlug = await this.client.get(`${this.apiUrl}/chapter/query`, {
            params: { page: 1, perPage: 1, series_id: contentId },
        });
        const slug = JSON.parse(seriesSlug.data).data?.[0].series.series_slug;
        if (slug === undefined)
            throw `Could not parse ${contentId}`;
        return slug;
    }
    async getContent(contentId) {
        // TODO: remove this when context is enabled.
        const slug = await this.getSeriesSlug(contentId);
        const response = await this.client.get(`${this.apiUrl}/series/${slug}`);
        const jsonResponse = JSON.parse(response.data);
        const title = jsonResponse.title;
        const cover = jsonResponse.thumbnail;
        const $ = (0, cheerio_1.load)(jsonResponse.description);
        const summary = $("p").text();
        const creators = [jsonResponse.author, jsonResponse.studio];
        const status = Number(daisuke_1.PublicationStatus[jsonResponse.status.toUpperCase()]) ||
            daisuke_1.PublicationStatus.ONGOING;
        const isNSFW = jsonResponse.adult;
        const chapters = await this.getChapters(jsonResponse.id);
        const properties = [];
        if (jsonResponse.tags.length > 0)
            properties.push({
                id: "genres",
                title: "Genres",
                tags: jsonResponse.tags.map((tag) => ({
                    id: tag.id.toString(),
                    title: tag.name,
                })),
            });
        if (creators.length > 0)
            properties.push({
                id: "creators",
                title: "Credits",
                tags: creators.map((c, i) => ({
                    id: i.toString(),
                    title: c,
                    nsfw: false,
                    noninteractive: false,
                })),
            });
        return {
            title,
            cover,
            summary,
            creators,
            status,
            isNSFW,
            chapters,
            properties,
            recommendedPanelMode: daisuke_1.ReadingMode.WEBTOON,
            webUrl: `${this.baseUrl}/series/${contentId}`,
        };
    }
    async getChapters(contentId) {
        const response = await this.client.get(`${this.apiUrl}/chapter/query`, {
            params: {
                page: 1,
                perPage: 999,
                series_id: contentId,
            },
        });
        const parsedChapters = JSON.parse(response.data)?.data;
        const chapters = [];
        let i = 0;
        while (i < parsedChapters.length) {
            const chapter = parsedChapters[i];
            if (chapter.price === 0)
                chapters.push({
                    chapterId: chapter.chapter_slug,
                    title: chapter.chapter_title || chapter.chapter_name,
                    number: Number(chapter.chapter_name.match(/(\d+(\.\d+)?)/)?.[1]) ??
                        Number(chapter.chapter_title.match(/(\d+(\.\d+)?)/)?.[1]) ??
                        i - parsedChapters.length,
                    index: i,
                    language: "EN_US",
                    date: new Date(chapter.created_at),
                });
            i++;
        }
        return chapters;
    }
    async getChapterData(contentId, chapterId) {
        const slug = await this.getSeriesSlug(contentId);
        const response = await this.client.get(`${this.baseUrl}/series/${slug}/${chapterId}`);
        const $ = (0, cheerio_1.load)(response.data);
        const parsedPages = $("div.flex.flex-col>img").toArray();
        const pages = parsedPages.map((page) => {
            const url = $(page).attr("data-src")?.trim().length > 1
                ? $(page).attr("data-src")?.trim()
                : $(page).attr("src")?.trim();
            return {
                url,
            };
        });
        pages.pop();
        return { pages };
    }
    async getDirectoryConfig() {
        return {
            filters: [
                {
                    id: "genres",
                    title: "Genres",
                    type: daisuke_1.FilterType.MULTISELECT,
                    options: constants_1.GENRES,
                },
                {
                    id: "status",
                    title: "Status",
                    type: daisuke_1.FilterType.SELECT,
                    options: constants_1.STATUS,
                },
            ],
            sort: {
                options: constants_1.SORTS,
                canChangeOrder: false,
                default: {
                    id: "latest",
                },
            },
        };
    }
}
exports.Target = Target;
