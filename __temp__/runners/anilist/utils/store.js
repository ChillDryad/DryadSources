"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNSFWSetting = void 0;
const _1 = require(".");
const gql_1 = require("../gql");
const getNSFWSetting = async () => {
    const isAuthenticated = await (0, _1.authenticated)();
    if (!isAuthenticated)
        return false;
    let user;
    try {
        const response = await (0, _1.request)(gql_1.CurrentViewerQuery);
        user = response.data.Viewer;
    }
    catch {
        return false;
    }
    if (!user)
        return false;
    return user.options.displayAdultContent;
};
exports.getNSFWSetting = getNSFWSetting;
