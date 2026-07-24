"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getViewer = exports.getScoreFormat = void 0;
const _1 = require(".");
const gql_1 = require("../gql");
/**
 * Get's the scoring format for the current authenticated user
 */
const getScoreFormat = async () => {
    if (!(0, _1.authenticated)())
        throw new Error("Not Signed in.");
    const response = await (0, _1.request)(gql_1.CurrentViewerScoreFormatQuery);
    return response.data.Viewer.mediaListOptions.scoreFormat;
};
exports.getScoreFormat = getScoreFormat;
const getViewer = async () => {
    const response = await (0, _1.request)(gql_1.CurrentViewerQuery);
    return response.data.Viewer;
};
exports.getViewer = getViewer;
