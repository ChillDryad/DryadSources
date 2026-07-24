"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubmitEntryForm = exports.buildEntryForm = void 0;
const daisuke_1 = require("@suwatte/daisuke");
const mediaList_1 = require("./mediaList");
const _1 = require(".");
const gql_1 = require("../gql");
const daisuke_2 = require("@suwatte/daisuke");
const StarSystem = new Array(6).fill(0).map((_, idx) => ({
    id: `${idx * 20}`,
    title: idx !== 0 ? "⭐".repeat(idx) : "-",
}));
const FaceSystem = [
    {
        id: "0",
        title: "-",
    },
    {
        id: "35",
        title: "🙁👎",
    },
    {
        id: "60",
        title: "😐",
    },
    {
        id: "85",
        title: "😃👍",
    },
];
/**
 * Builds the Entry Edit Form for the given title using the media list entry
 */
const buildEntryForm = async (id) => {
    const { mediaListEntry: entry, chapters, volumes, } = await (0, mediaList_1.getMediaListEntry)(id);
    if (!entry)
        throw new Error(`Not Tracking ${id}`);
    return (0, daisuke_2.Generate)({
        sections: [
            // Score
            (0, daisuke_2.Generate)({
                children: [await ScoreComponent(entry.score)],
            }),
            // Progress
            (0, daisuke_2.Generate)({
                header: "Reading Progress",
                children: [
                    (0, daisuke_1.UIStepper)({
                        id: "progress",
                        title: "Chapter",
                        value: entry.progress,
                        upperBound: chapters,
                        allowDecimal: true,
                    }),
                    (0, daisuke_1.UIStepper)({
                        id: "progressVolumes",
                        title: "Volume",
                        value: entry.progressVolumes ?? 0,
                        upperBound: volumes,
                    }),
                ],
            }),
            // Repeats
            {
                children: [
                    (0, daisuke_1.UIStepper)({
                        id: "repeat",
                        title: "Total rereads",
                        value: entry.repeat,
                    }),
                ],
            },
            // Dates
            {
                children: [
                    (0, daisuke_1.UIDatePicker)({
                        id: "startedAt",
                        title: "Start Date",
                        optional: "true",
                        value: entry.startedAt && (0, _1.parseFuzzyDate)(entry.startedAt),
                    }),
                    (0, daisuke_1.UIDatePicker)({
                        id: "completedAt",
                        title: "Completion Date",
                        optional: "true",
                        value: entry.completedAt && (0, _1.parseFuzzyDate)(entry.completedAt),
                    }),
                ],
            },
            // Notes
            {
                header: "Notes",
                children: [
                    (0, daisuke_1.UITextField)({
                        id: "notes",
                        title: "Notes",
                        optional: "true",
                        value: entry.notes,
                    }),
                ],
            },
            {
                children: [
                    (0, daisuke_1.UIMultiPicker)({
                        id: "customLists",
                        title: "Custom Lists",
                        options: entry.customLists?.map((v) => ({
                            id: v.name,
                            title: v.name,
                        })),
                        value: entry.customLists
                            ?.filter((v) => v.enabled)
                            .map((v) => v.name),
                    }),
                    (0, daisuke_1.UIToggle)({
                        id: "hiddenFromStatusLists",
                        title: "Hide From Status List",
                        value: entry.hiddenFromStatusLists,
                    }),
                    (0, daisuke_1.UIToggle)({
                        id: "private",
                        title: "Private Entry",
                        value: entry.private,
                    }),
                ],
            },
        ],
    });
};
exports.buildEntryForm = buildEntryForm;
const ScoreComponent = async (score) => {
    const title = "Score";
    const scoreFormat = await (0, _1.getScoreFormat)();
    const numSystemScore = (score) => {
        if (score === 0)
            return 0;
        switch (scoreFormat) {
            case "POINT_10_DECIMAL":
                return Math.round(score / 10);
            case "POINT_10":
                return Math.trunc(score / 10);
            default:
                return score;
        }
    };
    switch (scoreFormat) {
        case "POINT_5":
        case "POINT_3": {
            const options = scoreFormat === "POINT_3" ? FaceSystem : StarSystem;
            return (0, daisuke_1.UIPicker)({
                id: "score",
                title,
                value: score ? getClosestKey(score, options) : options?.[0].id,
                options,
            });
        }
        default: {
            return (0, daisuke_1.UIStepper)({
                id: "score",
                title,
                value: score ? numSystemScore(score) : 0,
                allowDecimal: scoreFormat === "POINT_10_DECIMAL" ? true : undefined,
                upperBound: scoreFormat === "POINT_100" ? 100 : 10,
            });
        }
    }
};
/**
 * Updates a media entry on anilist using the provided form
 */
const handleSubmitEntryForm = async (id, form) => {
    const mediaId = (0, _1.parseID)(id);
    // Dates
    const startedAt = form.startedAt === null
        ? null
        : form.startedAt
            ? (0, _1.convertToFuzzyDate)(new Date(form.startedAt))
            : undefined;
    const completedAt = form.completedAt === null
        ? null
        : form.completedAt
            ? (0, _1.convertToFuzzyDate)(new Date(form.completedAt))
            : undefined;
    // Score
    const calc = (score) => Math.trunc((0, _1.parseID)(score));
    const scoreFormat = await (0, _1.getScoreFormat)();
    const calcNum = (score) => {
        if (scoreFormat !== "POINT_100") {
            return Math.trunc(score * 10);
        }
        return Math.trunc(score);
    };
    const score = form.score
        ? typeof form.score === "string"
            ? calc(form.score)
            : calcNum(form.score)
        : undefined;
    // Request
    const variables = {
        mediaId,
        ...form,
        // Fix Dates
        startedAt,
        completedAt,
        // Fix Score which can either be a string or a number depending on the user's scoring format
        score,
    };
    await (0, _1.request)(gql_1.MediaListEntryMutation, variables);
};
exports.handleSubmitEntryForm = handleSubmitEntryForm;
const getClosestKey = (num, options) => {
    let closestKey = options[0].id;
    let closestDiff = Math.abs(num - Number(options[0].id));
    for (let i = 1; i < options.length; i++) {
        const diff = Math.abs(num - Number(options[i].id));
        if (diff < closestDiff) {
            closestDiff = diff;
            closestKey = options[i].id;
        }
    }
    return closestKey;
};
