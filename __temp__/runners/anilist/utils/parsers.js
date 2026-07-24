"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaToFullTrackItem = exports.mediaToHighlight = void 0;
const _1 = require(".");
const utils_1 = require("./utils");
const media_1 = require("./media");
const mediaToHighlight = (m) => ({
    id: m.id.toString(),
    title: m.title.userPreferred,
    cover: m.coverImage.large,
    webUrl: (0, _1.parseWebUrl)(m.id),
    ...(m.mediaListEntry && {
        entry: {
            status: m.mediaListEntry.status,
            progress: {
                lastReadChapter: m.mediaListEntry.progress ?? 0,
                lastReadVolume: m.mediaListEntry.progressVolumes,
                maxAvailableChapter: m.chapters,
            },
        },
    }),
});
exports.mediaToHighlight = mediaToHighlight;
const mediaToFullTrackItem = (media) => ({
    id: media.id.toString(),
    title: media.title.userPreferred,
    cover: media.coverImage.large,
    webUrl: media.siteUrl ?? (0, _1.parseWebUrl)(media.id),
    ...(media.mediaListEntry && {
        entry: {
            status: media.mediaListEntry.status,
            progress: {
                lastReadChapter: media.mediaListEntry.progress ?? 0,
                lastReadVolume: media.mediaListEntry.progressVolumes,
                maxAvailableChapter: media.chapters,
            },
        },
    }),
    summary: media.description,
    bannerCover: media.bannerImage,
    isNSFW: media.isAdult,
    isFavorite: media.isFavourite,
    relatedTitles: media.relations?.nodes
        ?.filter((v) => v.type === "MANGA")
        .map(exports.mediaToHighlight),
    recommendedTitles: media.recommendations?.nodes?.map((v) => (0, exports.mediaToHighlight)(v.mediaRecommendation)),
    links: media.externalLinks?.map((v) => ({ title: v.site, url: v.url })),
    additionalTitles: media.synonyms,
    characters: media.characters?.nodes?.map((v) => ({
        name: v.name.userPreferred,
        image: v.image.medium,
        summary: v.description,
    })),
    status: (0, utils_1.convertStatus)(media.status ?? ""),
    info: [
        `${media.averageScore ?? 0}/100 Rating`,
        `${(media.favourites ?? 0).toLocaleString()} Favorites ❤`,
        `${media.popularity?.toLocaleString()} Users Tracking`,
        `${media.trending?.toLocaleString()} Reads This Hour`,
    ],
    properties: [
        {
            id: "genres",
            title: "Genres",
            tags: media.genres?.map((id) => ({ title: id, id })) ?? [],
        },
        ...Object.entries((0, media_1.groupTags)(media.tags ?? [])).map(([id, tags]) => {
            return {
                id,
                title: id.replace("-", ": ").replaceAll("-", " "),
                tags: tags.map((v) => ({ id: v.name, title: v.name })),
            };
        }),
    ],
});
exports.mediaToFullTrackItem = mediaToFullTrackItem;
