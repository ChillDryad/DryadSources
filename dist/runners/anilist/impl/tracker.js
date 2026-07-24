"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackerImplementation = void 0;
const form_1 = require("../utils/form");
const utils_1 = require("../utils");
const media_1 = require("../utils/media");
const gql_1 = require("../gql");
exports.TrackerImplementation = {
    async didUpdateLastReadChapter(id, progress) {
        const variables = {
            mediaId: (0, utils_1.parseID)(id),
            progress: progress.chapter ? Math.trunc(progress.chapter) : undefined,
            progressVolumes: progress.volume
                ? Math.trunc(progress.volume)
                : undefined,
        };
        await (0, utils_1.request)(gql_1.MediaListEntryMutation, variables);
    },
    getResultsForTitles: function (titles) {
        return (0, media_1.getSearchResults)(titles);
    },
    getTrackItem: function (id) {
        return (0, utils_1.parseTrackItem)(id);
    },
    beginTracking: async function (id, status) {
        const variables = {
            mediaId: (0, utils_1.parseID)(id),
            status,
        };
        await (0, utils_1.request)(gql_1.MediaListEntryMutation, variables);
    },
    getEntryForm: async function (id) {
        return (0, form_1.buildEntryForm)(id);
    },
    didSubmitEntryForm: function (id, form) {
        return (0, form_1.handleSubmitEntryForm)(id, form);
    },
    didUpdateStatus: async function (id, status) {
        const variables = {
            mediaId: (0, utils_1.parseID)(id),
            status,
        };
        await (0, utils_1.request)(gql_1.MediaListEntryMutation, variables);
    },
};
