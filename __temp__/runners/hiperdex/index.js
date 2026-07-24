"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Target = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const tachiyomi_1 = require("../../templates/tachiyomi");
const tachidara_1 = require("../../templates/tachidara");
const info = {
    id: "kusa.hiperdex",
    name: "Hiperdex",
    thumbnail: "hiperdex.png",
    version: 0.4,
    rating: daisuke_1.CatalogRating.NSFW,
    website: "https://hipertoon.com/",
};
class Hiperdex extends tachidara_1.TachiDaraTemplate {
    baseUrl = "https://hipertoon.com/";
    lang = "en";
    name = info.name;
    searchPage(page) {
        return page == 1 ? "" : `page/${page}/`;
    }
    useNewChapterEndpoint = true;
}
exports.Target = new tachiyomi_1.TachiBuilder(info, Hiperdex);
