"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGenres = exports.groupTags = exports.fullSearch = exports.getFullMedia = exports.getHomePageViewMore = exports.getHomePage = exports.simpleSearch = exports.getSearchResults = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const _1 = require(".");
const gql_1 = require("../gql");
const parsers_1 = require("./parsers");
const utils_1 = require("./utils");
const store_1 = require("./store");
const getSearchResults = async (titles) => {
    for (const title of titles) {
        const results = await (0, exports.simpleSearch)(title);
        if (results.length == 0)
            continue;
        return results;
    }
    return [];
};
exports.getSearchResults = getSearchResults;
const simpleSearch = async (search) => {
    const adult = await (0, store_1.getNSFWSetting)();
    console.log({ adult });
    const { data: { Page }, } = await (0, _1.request)(gql_1.SimpleSearchQuery, {
        search,
    });
    console.log(Page);
    const media = Page?.media;
    if (!media)
        return [];
    return media.map(parsers_1.mediaToHighlight);
};
exports.simpleSearch = simpleSearch;
const TITLES = {
    trending: "Trending Titles",
    popular: "Popular Titles",
    manhwa: "Top Manhwa",
    manga: "Top Manga",
    top: "Top 100",
};
const getHomePage = async () => {
    const { data } = await (0, _1.request)(gql_1.HomePageQuery);
    return Object.keys(data).map((id) => ({
        id,
        title: TITLES[id],
        items: data[id].media.map(parsers_1.mediaToHighlight),
        viewMoreLink: {
            request: { context: { discover: id }, page: 1, configID: "viewMore" },
        },
    }));
};
exports.getHomePage = getHomePage;
const getHomePageViewMore = async (key, page) => {
    const { data } = await (0, _1.request)((0, gql_1.HomePageViewMoreQuery)(key), {
        page,
    });
    const results = data[key].media.map(parsers_1.mediaToHighlight);
    return {
        isLastPage: results.length < 30,
        results,
    };
};
exports.getHomePageViewMore = getHomePageViewMore;
const getFullMedia = async (id) => {
    const { data: { Media: media }, } = await (0, _1.request)(gql_1.FullMediaQuery, {
        id: (0, _1.parseID)(id),
    });
    return (0, parsers_1.mediaToFullTrackItem)(media);
};
exports.getFullMedia = getFullMedia;
const fullSearch = async (query) => {
    const sort = query.sort
        ? [(0, utils_1.getSortKey)(query.sort.id, query.sort.ascending ?? false), "SCORE_DESC"]
        : ["POPULARITY_DESC", "SCORE_DESC"];
    const variables = {
        page: query.page,
        search: query.query,
        sort,
        ...(query.filters && (0, utils_1.convertSTTFilter)(query.filters)),
        // ...(!query.filters && { excludedGenres: ["Hentai"] }),
        // ...!query.filters,
        ...(query.tag && {
            ...(query.tag.propertyId === "genres" && { genres: [query.tag.tagId] }),
            ...(query.tag.propertyId !== "genres" && { tags: [query.tag.tagId] }),
        }),
    };
    const { data: { Page }, } = await (0, _1.request)(gql_1.FullSearchQuery, variables);
    const media = Page?.media;
    if (!media)
        return [];
    const results = media.map(parsers_1.mediaToHighlight);
    return results;
};
exports.fullSearch = fullSearch;
const groupTags = (tags) => tags.reduce((r, a) => {
    r[a.category] = r[a.category] || [];
    if (!a.isAdult)
        r[a.category].push(a);
    return r;
}, Object.create(null));
exports.groupTags = groupTags;
const buildGenres = async () => {
    const { data: { genres, tags }, } = await (0, _1.request)(gql_1.GenresQuery);
    const genreFilter = {
        id: "genres",
        title: "Genres",
        type: daisuke_1.FilterType.EXCLUDABLE_MULTISELECT,
        options: genres
            .map((v) => ({ id: v, title: v }))
            .filter((v) => v.id !== "Hentai"),
    };
    const tagFilters = [];
    // reference:  https://stackoverflow.com/a/40774906
    const groupedTags = (0, exports.groupTags)(tags);
    for (const key in groupedTags) {
        const tags = groupedTags[key];
        const options = tags.map((v) => ({ id: v.name, title: v.name }));
        if (options.length == 0) {
            continue;
        }
        tagFilters.push({
            id: key,
            title: key.replaceAll("-", " "),
            type: daisuke_1.FilterType.EXCLUDABLE_MULTISELECT,
            options,
        });
    }
    return [genreFilter, ...tagFilters];
};
exports.buildGenres = buildGenres;
