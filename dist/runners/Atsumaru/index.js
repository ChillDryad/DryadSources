"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Target = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const constants_1 = require("./constants");
class Target {
    baseUrl = "https://atsu.moe";
    info = {
        id: "kusa.atsumaru",
        name: "Atsumaru",
        thumbnail: "atsumaru.png",
        version: 1.0,
        website: "https://atsu.moe",
        supportedLanguages: ["EN_US"],
        rating: daisuke_1.CatalogRating.MIXED,
        minSupportedAppVersion: "5.0",
    };
    client = new NetworkClient();
    async willRequestImage(url) {
        return {
            url,
            headers: { referer: `${this.baseUrl}/` },
        };
    }
    async getSectionsForPage(page) {
        if (page.id !== "home")
            throw new Error("Page not found");
        return [
            { id: "popular", title: "Trending", style: daisuke_1.SectionStyle.GALLERY },
            { id: "latest", title: "Recently Updated", style: daisuke_1.SectionStyle.GALLERY },
        ];
    }
    async resolvePageSection(link, sectionID) {
        if (link.id !== "home")
            throw new Error(`Unknown page: ${link.id}`);
        const endpointMap = {
            popular: "trending",
            latest: "recentlyUpdated",
        };
        const endpoint = endpointMap[sectionID];
        if (!endpoint)
            throw new Error(`Unknown section: ${sectionID}`);
        const url = `${this.baseUrl}/api/infinite/${endpoint}?page=0&types=Manga,Manwha,Manhua,OEL`;
        const response = await this.client.get(url);
        const data = JSON.parse(response.data);
        return { items: data.items.map(mangaToHighlight) };
    }
    async getDirectory(request) {
        const filters = request.filters ?? {};
        const types = filters.types ?? constants_1.ALL_TYPES;
        const status = filters.status;
        const genres = filters.genres;
        const showAdult = filters.adult ?? false;
        const officialTranslation = filters.official ?? false;
        const filter = {
            types,
            showAdult,
            officialTranslation,
            sortBy: request.sort?.id ?? "trending",
            ...(request.query ? { search: request.query } : {}),
            ...(status?.length ? { status } : {}),
            ...(genres?.length ? { genres } : {}),
        };
        const body = { page: request.page - 1, filter };
        const response = await this.client.post(`${this.baseUrl}/api/explore/filteredView`, { body, headers: { "Content-Type": "application/json" } });
        const raw = JSON.parse(response.data);
        // API returns either a search result shape { hits, found, requestParams }
        // or a browse shape { items } depending on the query
        if (raw.items) {
            const data = raw;
            return {
                results: data.items.map(mangaToHighlight),
                isLastPage: data.items.length === 0,
            };
        }
        const data = raw;
        return {
            results: data.hits.map((h) => mangaToHighlight(h.document)),
            isLastPage: (data.page + 1) * data.requestParams.perPage >= data.found,
        };
    }
    async getContent(contentId) {
        const url = `${this.baseUrl}/api/manga/page?id=${contentId}`;
        const response = await this.client.get(url);
        const data = JSON.parse(response.data);
        const manga = data.mangaPage;
        const scanlatorMap = {};
        for (const s of manga.scanlators ?? []) {
            scanlatorMap[s.id] = s.name;
        }
        const chapters = await this.fetchChapters(contentId, scanlatorMap);
        const properties = [];
        if (manga.tags?.length) {
            properties.push({
                id: "genres",
                title: "Genres",
                tags: manga.tags.map((t) => ({
                    id: t.name.toLowerCase().replace(/\s+/g, "-"),
                    title: t.name,
                    adultContent: false,
                })),
            });
        }
        if (manga.authors?.length) {
            properties.push({
                id: "creators",
                title: "Credits",
                tags: manga.authors.map((a) => ({
                    id: a.name.toLowerCase().replace(/\s+/g, "-"),
                    title: a.name,
                    noninteractive: true,
                    adultContent: false,
                })),
            });
        }
        return {
            title: manga.title,
            cover: normalizeImageUrl(manga.poster ?? manga.image ?? null, this.baseUrl),
            summary: manga.synopsis ?? undefined,
            status: convertStatus(manga.status),
            chapters,
            properties,
            webUrl: `${this.baseUrl}/read/${contentId}`,
            recommendedPanelMode: daisuke_1.ReadingMode.PAGED_MANGA,
        };
    }
    async getChapters(contentId) {
        const detailsResponse = await this.client.get(`${this.baseUrl}/api/manga/page?id=${contentId}`);
        const manga = JSON.parse(detailsResponse.data);
        const scanlatorMap = {};
        for (const s of manga.mangaPage.scanlators ?? []) {
            scanlatorMap[s.id] = s.name;
        }
        return this.fetchChapters(contentId, scanlatorMap);
    }
    async fetchChapters(contentId, scanlatorMap) {
        const url = `${this.baseUrl}/api/manga/allChapters?mangaId=${contentId}`;
        const response = await this.client.get(url);
        const data = JSON.parse(response.data);
        return data.chapters.map((ch, index) => chapterToChapter(ch, index, scanlatorMap));
    }
    async getChapterData(contentId, chapterId) {
        const url = `${this.baseUrl}/api/read/chapter?mangaId=${contentId}&chapterId=${chapterId}`;
        const response = await this.client.get(url);
        const data = JSON.parse(response.data);
        return {
            pages: data.readChapter.pages.map((p) => ({
                url: normalizeImageUrl(p.image, this.baseUrl),
            })),
        };
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
                    type: daisuke_1.FilterType.MULTISELECT,
                    options: constants_1.STATUSES,
                },
                {
                    id: "types",
                    title: "Type",
                    type: daisuke_1.FilterType.MULTISELECT,
                    options: constants_1.TYPES,
                },
                {
                    id: "adult",
                    title: "Show Adult Content",
                    type: daisuke_1.FilterType.TOGGLE,
                },
                {
                    id: "official",
                    title: "Official Translations Only",
                    type: daisuke_1.FilterType.TOGGLE,
                },
            ],
            sort: {
                options: constants_1.SORTS,
                canChangeOrder: false,
                default: { id: "trending" },
            },
        };
    }
}
exports.Target = Target;
function mangaToHighlight(manga) {
    return {
        id: manga.id,
        title: manga.title,
        cover: normalizeImageUrl(manga.poster ?? manga.image ?? null, "https://atsu.moe"),
    };
}
function extractImagePath(value) {
    if (!value)
        return null;
    if (typeof value === "string")
        return value;
    if (typeof value === "object") {
        const obj = value;
        const candidate = obj.lg ?? obj.md ?? obj.sm ?? obj.url ?? Object.values(obj)[0];
        if (typeof candidate === "string")
            return candidate;
    }
    return null;
}
function normalizeImageUrl(value, baseUrl) {
    const path = extractImagePath(value);
    if (!path)
        return undefined;
    let url;
    if (path.startsWith("http")) {
        url = path;
    }
    else if (path.startsWith("//")) {
        url = "https:" + path;
    }
    else {
        url = `${baseUrl}/static/${path.replace(/^\/?(static\/)?/, "")}`;
    }
    return url.replace(/^http:\/\//, "https://");
}
function convertStatus(status) {
    switch (status?.toLowerCase()) {
        case "ongoing":
            return daisuke_1.PublicationStatus.ONGOING;
        case "completed":
            return daisuke_1.PublicationStatus.COMPLETED;
        case "hiatus":
            return daisuke_1.PublicationStatus.HIATUS;
        case "canceled":
        case "cancelled":
            return daisuke_1.PublicationStatus.CANCELLED;
        default:
            return daisuke_1.PublicationStatus.ONGOING;
    }
}
function parseChapterDate(createdAt) {
    if (createdAt == null)
        return new Date(0);
    if (typeof createdAt === "number")
        return new Date(createdAt * 1000);
    return new Date(createdAt);
}
function chapterToChapter(ch, index, scanlatorMap) {
    const scanlatorName = ch.scanlationMangaId ? scanlatorMap[ch.scanlationMangaId] : undefined;
    return {
        chapterId: ch.id,
        number: ch.number,
        title: ch.title?.trim() || `Chapter ${ch.number}`,
        index,
        date: parseChapterDate(ch.createdAt),
        language: "EN_US",
        ...(scanlatorName
            ? { providers: [{ id: scanlatorName, name: scanlatorName, links: [] }] }
            : {}),
    };
}
