"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const parser_1 = require("./parser");
const constants_1 = require("./constants");
class Controller {
    BASE = "https://nhentai.net";
    client = new NetworkClient();
    parser = new parser_1.Parser();
    getFilters() {
        return [
            {
                id: "tags",
                title: "Tags",
                type: daisuke_1.FilterType.SELECT,
                options: constants_1.TAGS,
            },
        ];
    }
    async getSearchResults(query) {
        const params = {};
        params.q = query.query;
        params.page = query.page ?? 1;
        let url = this.BASE;
        if (query.query)
            url = `${url}/search/`;
        else if (query.filters?.tags !== undefined)
            url = `${url}/tag/${query.filters.tags.replaceAll(" ", "-")}`;
        if (query?.tag)
            url = `${url}/tag/${query.tag.tagId}`;
        const response = await this.client.get(url, {
            params,
        });
        const results = this.parser.parsePagedResponse(response.data);
        return { results, isLastPage: results.length > 60 };
    }
    async getContent(id) {
        const response = await this.client.get(`${this.BASE}/g/${id}`);
        return this.parser.parseContent(response.data, id);
    }
    async getChapters(id) {
        return [
            {
                chapterId: id.split("/")[0],
                number: 1,
                index: 1,
                date: new Date(),
                language: "en",
            },
        ];
    }
    async getChapterData(chapterId) {
        const response = await this.client.get(`${this.BASE}/g/${chapterId}`);
        return { pages: this.parser.parsePages(response.data) };
    }
}
exports.Controller = Controller;
