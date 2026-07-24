"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkProvider = exports.LinkResolver = void 0;
const utils_1 = require("../utils");
const media_1 = require("../utils/media");
exports.LinkResolver = {
    getSectionsForPage: function ({ id }) {
        switch (id) {
            case "home": {
                return (0, media_1.getHomePage)();
            }
        }
        throw new Error(`link not resolved [${id}]`);
    },
    resolvePageSection: function (_link, _sectionID) {
        throw new Error("non resolving provider.");
    },
};
exports.LinkProvider = {
    getLibraryPageLinks: async function () {
        const isAuthenticated = await (0, utils_1.authenticated)();
        if (!isAuthenticated)
            return [];
        const { mediaListOptions: { mangaList: { sectionOrder: lists }, }, } = await (0, utils_1.getViewer)();
        return lists.map((list) => ({
            title: list,
            link: {
                request: {
                    page: 1,
                    context: {
                        list,
                    },
                    configKey: "userList",
                },
            },
        }));
    },
    getBrowsePageLinks: async function () {
        return [
            {
                title: "Discover",
                link: {
                    page: { id: "home" },
                },
            },
            {
                title: "All Manga",
                link: {
                    request: { page: 1 },
                },
            },
        ];
    },
};
