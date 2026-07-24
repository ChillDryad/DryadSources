"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preferenceKeys = exports.parseWebUrl = exports.convertToFuzzyDate = exports.parseFuzzyDate = exports.parseID = exports.request = exports.AUTHENTICATED_CLIENT = exports.authenticated = exports.getParamFromURL = void 0;
const daisuke_1 = require("@suwatte/daisuke");
__exportStar(require("./form"), exports);
__exportStar(require("./mediaList"), exports);
__exportStar(require("./user"), exports);
/**
 * Parse Param from url, URL and URLSearchParam not available in JSCore environment
 */
function getParamFromURL(url, param) {
    const regex = new RegExp("[?&]" + param + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
exports.getParamFromURL = getParamFromURL;
/**
 * Checks if a user is authenticated
 */
async function authenticated() {
    console.log("authenticated fn");
    const token = await SecureStore.get("access_token");
    const expiry = await SecureStore.string("expires");
    console.log({ token, expiry });
    const now = new Date();
    if (!expiry)
        return false;
    const expiryDate = new Date(expiry);
    if (now > expiryDate) {
        // Token expired remove keys
        await SecureStore.remove("access_token");
        await SecureStore.remove("expires");
        await SecureStore.remove("handle");
        return false;
    }
    if (!token)
        return false;
    return true;
}
exports.authenticated = authenticated;
exports.AUTHENTICATED_CLIENT = new daisuke_1.NetworkClientBuilder()
    .addRequestInterceptor(async (req) => {
    req.headers = {
        ...(req.headers || {}),
        "Content-Type": "application/json",
        Accept: "application/json",
    };
    const isAuthenticated = await authenticated();
    if (!isAuthenticated)
        return req;
    const token = await SecureStore.string("access_token");
    req.headers = {
        ...(req.headers || {}),
        Authorization: `Bearer ${token}`,
    };
    return req;
})
    .build();
/**
 * Makes a request to the Anilist GraphQL API
 */
async function request(query, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
variables = {}) {
    const client = exports.AUTHENTICATED_CLIENT;
    const { data } = await client.post("https://graphql.anilist.co", {
        body: {
            query: query.trim(),
            variables,
        },
    });
    const object = JSON.parse(data);
    return object;
}
exports.request = request;
/**
 * Parses a string id into an integer id
 */
const parseID = (id) => {
    const intId = Number(id);
    if (isNaN(intId))
        throw new Error("Invalid Media ID");
    return intId;
};
exports.parseID = parseID;
/**
 * parses an anilist fuzzy date to a date
 */
const parseFuzzyDate = (date) => {
    if (!date.year) {
        return undefined;
    }
    return new Date(date.year, date.month - 1, date.day);
};
exports.parseFuzzyDate = parseFuzzyDate;
/**
 * converts a js date to an anilist fuzzy date
 */
const convertToFuzzyDate = (date) => {
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    };
};
exports.convertToFuzzyDate = convertToFuzzyDate;
const parseWebUrl = (id) => `https://anilist.co/manga/${id}`;
exports.parseWebUrl = parseWebUrl;
exports.preferenceKeys = {
    nsfw: "nsfw",
};
