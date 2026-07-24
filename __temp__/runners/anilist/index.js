"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Target = void 0;
const tracker_1 = require("./impl/tracker");
const auth_1 = require("./impl/auth");
const pageLink_1 = require("./impl/pageLink");
const advancedTracker_1 = require("./impl/advancedTracker");
const info = {
    id: "kusa.anilist",
    name: "Anilist",
    version: 1.7,
    website: "https://anilist.co",
    thumbnail: "anilist.png",
};
const config = {
    linkKeys: ["anilist", "al", "anilist.co"],
};
exports.Target = {
    info,
    config,
    ...advancedTracker_1.AdvancedTrackerImplementation,
    ...tracker_1.TrackerImplementation,
    ...auth_1.OAuthImplementation,
    ...pageLink_1.LinkProvider,
    ...pageLink_1.LinkResolver,
};
