"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMediaListCollection = exports.parseTrackItem = exports.getMediaListEntry = void 0;
const _1 = require(".");
const gql_1 = require("../gql");
/**
 * Gets the media list entry for a given title
 */
const getMediaListEntry = async (id) => {
    const data = await (0, _1.request)(gql_1.MediaListEntryQuery, {
        id: (0, _1.parseID)(id),
    });
    return data.data.Media;
};
exports.getMediaListEntry = getMediaListEntry;
const parseTrackItem = async (id) => {
    const { mediaListEntry: entry, title: { userPreferred: title }, coverImage: { large: cover }, chapters, } = await (0, exports.getMediaListEntry)(id);
    return {
        id,
        title,
        cover,
        webUrl: `https://anilist.co/manga/${id}`,
        ...(entry && {
            entry: {
                status: entry.status,
                progress: {
                    maxAvailableChapter: chapters,
                    lastReadChapter: entry.progress,
                    lastReadVolume: entry.progressVolumes,
                },
            },
        }),
    };
};
exports.parseTrackItem = parseTrackItem;
const getMediaListCollection = async (name) => {
    const userName = await SecureStore.get("user");
    if (!userName)
        throw new Error("failed to get username");
    const { data: { MediaListCollection: { lists }, }, } = await (0, _1.request)(gql_1.MediaListCollectionQuery, {
        userName,
    });
    const target = lists.find((v) => v.name === name);
    if (!target)
        throw new Error("list not found.");
    const results = target.entries.map((v) => ({
        id: `${v.media.id}`,
        title: v.media.title.userPreferred,
        cover: v.media.coverImage.large,
        webUrl: (0, _1.parseWebUrl)(v.media.id),
        entry: {
            status: v.status,
            progress: {
                lastReadChapter: v.progress,
                lastReadVolume: v.progressVolume,
            },
        },
    }));
    return {
        isLastPage: true,
        results,
    };
};
exports.getMediaListCollection = getMediaListCollection;
