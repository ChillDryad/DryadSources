"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthImplementation = exports.AuthImplementation = void 0;
const utils_1 = require("../utils");
const gql_1 = require("../gql");
exports.AuthImplementation = {
    async getAuthenticatedUser() {
        const isAuthenticated = await (0, utils_1.authenticated)();
        if (!isAuthenticated)
            return null;
        const response = await (0, utils_1.request)(gql_1.CurrentViewerQuery);
        const { name: handle, avatar: { large: avatar }, bannerImage, } = response.data.Viewer;
        await SecureStore.set("user", handle);
        return {
            handle,
            avatar,
            bannerImage,
        };
    },
    async handleUserSignOut() {
        await SecureStore.remove("access_token");
        await SecureStore.remove("expires");
        await SecureStore.remove("handle");
        await SecureStore.remove("user");
    },
};
exports.OAuthImplementation = {
    ...exports.AuthImplementation,
    async getOAuthRequestURL() {
        return {
            url: "https://anilist.co/api/v2/oauth/authorize",
            params: {
                client_id: "8119",
                response_type: "token",
            },
        };
    },
    async handleOAuthCallback(response) {
        console.log("oauth callback");
        const fragment = `?${response.split("#")[1]}`;
        const accessToken = (0, utils_1.getParamFromURL)(fragment, "access_token");
        const expiresIn = (0, utils_1.getParamFromURL)(fragment, "expires_in");
        if (!accessToken)
            throw new Error("Failed");
        // Set Access Token to Key Chain
        await SecureStore.set("access_token", accessToken);
        // Set Expiry
        if (!expiresIn)
            return;
        const secondsFromNow = parseInt(expiresIn);
        if (!secondsFromNow)
            return;
        const date = new Date();
        date.setSeconds(date.getSeconds() + secondsFromNow);
        await SecureStore.set("expires", date);
    },
};
