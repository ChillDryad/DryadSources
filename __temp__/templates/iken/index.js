"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IkenTemplate = void 0;
class IkenTemplate {
    constructor(params) {
    }
    async getDirectory(request) {
        return { results: [], isLastPage: true };
    }
    async getContent(contentId) {
        return { title: "foo", cover: "bar" };
    }
    async getChapters(contentId) {
        return [];
    }
    async getChapterData(_contentId, chapterId) {
        return {};
    }
    getTags() {
        throw new Error("Method not implemented.");
    }
    // async getPreferenceMenu(): Promise<Form> {
    //   return this.controller.getPreferences()
    // }
    async getDirectoryConfig(_configID) {
        return {
        // filters: this.controller.getFilters(),
        // sort: {
        //   options: SORTERS,
        //   canChangeOrder: true,
        // },
        };
    }
}
exports.IkenTemplate = IkenTemplate;
