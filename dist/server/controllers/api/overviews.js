"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overviewsRouter = void 0;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const memoizee_1 = tslib_1.__importDefault(require("memoizee"));
const logger_1 = require("@server/helpers/logger");
const hooks_1 = require("@server/lib/plugins/hooks");
const video_1 = require("@server/models/video/video");
const express_utils_1 = require("../../helpers/express-utils");
const constants_1 = require("../../initializers/constants");
const middlewares_1 = require("../../middlewares");
const tag_1 = require("../../models/video/tag");
const overviewsRouter = express_1.default.Router();
exports.overviewsRouter = overviewsRouter;
overviewsRouter.get('/videos', middlewares_1.videosOverviewValidator, middlewares_1.optionalAuthenticate, middlewares_1.asyncMiddleware(getVideosOverview));
const buildSamples = memoizee_1.default(function () {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const [categories, channels, tags] = yield Promise.all([
            video_1.VideoModel.getRandomFieldSamples('category', constants_1.OVERVIEWS.VIDEOS.SAMPLE_THRESHOLD, constants_1.OVERVIEWS.VIDEOS.SAMPLES_COUNT),
            video_1.VideoModel.getRandomFieldSamples('channelId', constants_1.OVERVIEWS.VIDEOS.SAMPLE_THRESHOLD, constants_1.OVERVIEWS.VIDEOS.SAMPLES_COUNT),
            tag_1.TagModel.getRandomSamples(constants_1.OVERVIEWS.VIDEOS.SAMPLE_THRESHOLD, constants_1.OVERVIEWS.VIDEOS.SAMPLES_COUNT)
        ]);
        const result = { categories, channels, tags };
        logger_1.logger.debug('Building samples for overview endpoint.', { result });
        return result;
    });
}, { maxAge: constants_1.MEMOIZE_TTL.OVERVIEWS_SAMPLE });
function getVideosOverview(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const attributes = yield buildSamples();
        const page = req.query.page || 1;
        const index = page - 1;
        const categories = [];
        const channels = [];
        const tags = [];
        yield Promise.all([
            getVideosByCategory(attributes.categories, index, res, categories),
            getVideosByChannel(attributes.channels, index, res, channels),
            getVideosByTag(attributes.tags, index, res, tags)
        ]);
        const result = {
            categories,
            channels,
            tags
        };
        return res.json(result);
    });
}
function getVideosByTag(tagsSample, index, res, acc) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (tagsSample.length <= index)
            return;
        const tag = tagsSample[index];
        const videos = yield getVideos(res, { tagsOneOf: [tag] });
        if (videos.length === 0)
            return;
        acc.push({
            tag,
            videos
        });
    });
}
function getVideosByCategory(categoriesSample, index, res, acc) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (categoriesSample.length <= index)
            return;
        const category = categoriesSample[index];
        const videos = yield getVideos(res, { categoryOneOf: [category] });
        if (videos.length === 0)
            return;
        acc.push({
            category: videos[0].category,
            videos
        });
    });
}
function getVideosByChannel(channelsSample, index, res, acc) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (channelsSample.length <= index)
            return;
        const channelId = channelsSample[index];
        const videos = yield getVideos(res, { videoChannelId: channelId });
        if (videos.length === 0)
            return;
        acc.push({
            channel: videos[0].channel,
            videos
        });
    });
}
function getVideos(res, where) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const query = yield hooks_1.Hooks.wrapObject(Object.assign({ start: 0, count: 12, sort: '-createdAt', includeLocalVideos: true, nsfw: express_utils_1.buildNSFWFilter(res), user: res.locals.oauth ? res.locals.oauth.token.User : undefined, withFiles: false, countVideos: false }, where), 'filter:api.overviews.videos.list.params');
        const { data } = yield hooks_1.Hooks.wrapPromiseFun(video_1.VideoModel.listForApi, query, 'filter:api.overviews.videos.list.result');
        return data.map(d => d.toFormattedJSON());
    });
}
