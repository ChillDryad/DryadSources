"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Target = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const controller_1 = require("./controller");
class Target {
    info = {
        id: "net.nhentai",
        name: "nHentai",
        version: 0.12,
        website: "https://nhentai.net",
        supportedLanguages: ["EN_GB", "JA", "ZH"],
        thumbnail: "nhentai.png",
        rating: daisuke_1.CatalogRating.NSFW,
    };
    controller = new controller_1.Controller();
    getContent(contentId) {
        return this.controller.getContent(contentId);
    }
    getChapters(contentId) {
        return this.controller.getChapters(contentId);
    }
    getChapterData(_contentId, chapterId) {
        return this.controller.getChapterData(chapterId);
    }
    getDirectory(request) {
        return this.controller.getSearchResults(request);
    }
    async getDirectoryConfig() {
        return {
            filters: this.controller.getFilters(),
        };
    }
}
exports.Target = Target;
