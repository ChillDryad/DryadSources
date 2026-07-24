"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedTrackerImplementation = void 0;
const media_1 = require("../utils/media");
const utils_1 = require("../utils");
const utils_2 = require("../utils/utils");
exports.AdvancedTrackerImplementation = {
    getFullInformation: async function (id) {
        return (0, media_1.getFullMedia)(id);
    },
    getDirectory: async function (request) {
        if (request.context) {
            if (request.context.list) {
                return (0, utils_1.getMediaListCollection)(request.context.list);
            }
            if (request.context.discover) {
                return (0, media_1.getHomePageViewMore)(request.context.discover, request.page);
            }
        }
        const results = await (0, media_1.fullSearch)(request);
        return {
            isLastPage: results.length < 30,
            results,
        };
    },
    getDirectoryConfig: async function (key) {
        if (key == "viewMore")
            return {
                searchable: false,
            };
        if (key === "userList")
            return {
                searchable: false,
                sort: {
                    options: (0, utils_2.getSortOptions)(),
                    default: {
                        id: "POPULARITY",
                        ascending: false,
                    },
                    canChangeOrder: true,
                },
            };
        return {
            filters: await (0, media_1.buildGenres)(),
            sort: {
                options: (0, utils_2.getSortOptions)(),
                default: {
                    id: "POPULARITY",
                    ascending: false,
                },
                canChangeOrder: true,
            },
        };
    },
    toggleFavorite: function (_state) {
        throw new Error("Function not implemented.");
    },
};
