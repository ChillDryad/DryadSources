"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertStatus = exports.convertSTTFilter = exports.getSortKey = exports.getSortOptions = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const sortKeys = [
    "Popularity",
    "Trending",
    "Favourites",
    "Score",
    "Search Match",
    "Chapters",
];
const getSortOptions = () => {
    return sortKeys.map((id) => ({
        title: id,
        id: id.replace(" ", "_").toUpperCase(),
    }));
};
exports.getSortOptions = getSortOptions;
const getSortKey = (key, ascending) => ascending ? key : `${key}_DESC`;
exports.getSortKey = getSortKey;
const convertSTTFilter = (filters) => {
    const object = {};
    for (const key in filters) {
        const { included, excluded } = filters[key];
        switch (key) {
            case "genres": {
                if (included && included.length != 0)
                    object.genres = filters[key].included;
                if (excluded && excluded.length != 0)
                    object.excludedGenres = [...filters[key].excluded, "Hentai"];
                break;
            }
            default: {
                object.tags = object.tags || [];
                object.tags.push(...included);
                object.excludedTags = object.excludedTags || [];
                object.excludedTags.push(...excluded);
                break;
            }
        }
    }
    return object;
};
exports.convertSTTFilter = convertSTTFilter;
const convertStatus = (key) => {
    switch (key) {
        case "FINISHED":
            return daisuke_1.PublicationStatus.COMPLETED;
        case "RELEASING":
            return daisuke_1.PublicationStatus.ONGOING;
        case "HIATUS":
            return daisuke_1.PublicationStatus.HIATUS;
    }
    return;
};
exports.convertStatus = convertStatus;
