"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoChannelRouter = void 0;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const query_1 = require("@server/helpers/query");
const hooks_1 = require("@server/lib/plugins/hooks");
const application_1 = require("@server/models/application/application");
const http_error_codes_1 = require("../../../shared/models/http/http-error-codes");
const audit_logger_1 = require("../../helpers/audit-logger");
const database_utils_1 = require("../../helpers/database-utils");
const express_utils_1 = require("../../helpers/express-utils");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("../../helpers/utils");
const config_1 = require("../../initializers/config");
const constants_1 = require("../../initializers/constants");
const database_1 = require("../../initializers/database");
const send_1 = require("../../lib/activitypub/send");
const job_queue_1 = require("../../lib/job-queue");
const local_actor_1 = require("../../lib/local-actor");
const video_channel_1 = require("../../lib/video-channel");
const middlewares_1 = require("../../middlewares");
const validators_1 = require("../../middlewares/validators");
const actor_image_1 = require("../../middlewares/validators/actor-image");
const video_playlists_1 = require("../../middlewares/validators/videos/video-playlists");
const account_1 = require("../../models/account/account");
const video_1 = require("../../models/video/video");
const video_channel_2 = require("../../models/video/video-channel");
const video_playlist_1 = require("../../models/video/video-playlist");
const auditLogger = audit_logger_1.auditLoggerFactory('channels');
const reqAvatarFile = express_utils_1.createReqFiles(['avatarfile'], constants_1.MIMETYPES.IMAGE.MIMETYPE_EXT, { avatarfile: config_1.CONFIG.STORAGE.TMP_DIR });
const reqBannerFile = express_utils_1.createReqFiles(['bannerfile'], constants_1.MIMETYPES.IMAGE.MIMETYPE_EXT, { bannerfile: config_1.CONFIG.STORAGE.TMP_DIR });
const videoChannelRouter = express_1.default.Router();
exports.videoChannelRouter = videoChannelRouter;
videoChannelRouter.get('/', middlewares_1.paginationValidator, middlewares_1.videoChannelsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, validators_1.videoChannelsListValidator, middlewares_1.asyncMiddleware(listVideoChannels));
videoChannelRouter.post('/', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videoChannelsAddValidator), middlewares_1.asyncRetryTransactionMiddleware(addVideoChannel));
videoChannelRouter.post('/:nameWithHost/avatar/pick', middlewares_1.authenticate, reqAvatarFile, middlewares_1.asyncMiddleware(middlewares_1.videoChannelsUpdateValidator), actor_image_1.updateAvatarValidator, middlewares_1.asyncMiddleware(updateVideoChannelAvatar));
videoChannelRouter.post('/:nameWithHost/banner/pick', middlewares_1.authenticate, reqBannerFile, middlewares_1.asyncMiddleware(middlewares_1.videoChannelsUpdateValidator), actor_image_1.updateBannerValidator, middlewares_1.asyncMiddleware(updateVideoChannelBanner));
videoChannelRouter.delete('/:nameWithHost/avatar', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videoChannelsUpdateValidator), middlewares_1.asyncMiddleware(deleteVideoChannelAvatar));
videoChannelRouter.delete('/:nameWithHost/banner', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videoChannelsUpdateValidator), middlewares_1.asyncMiddleware(deleteVideoChannelBanner));
videoChannelRouter.put('/:nameWithHost', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videoChannelsUpdateValidator), middlewares_1.asyncRetryTransactionMiddleware(updateVideoChannel));
videoChannelRouter.delete('/:nameWithHost', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videoChannelsRemoveValidator), middlewares_1.asyncRetryTransactionMiddleware(removeVideoChannel));
videoChannelRouter.get('/:nameWithHost', middlewares_1.asyncMiddleware(validators_1.videoChannelsNameWithHostValidator), getVideoChannel);
videoChannelRouter.get('/:nameWithHost/video-playlists', middlewares_1.asyncMiddleware(validators_1.videoChannelsNameWithHostValidator), middlewares_1.paginationValidator, middlewares_1.videoPlaylistsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, video_playlists_1.commonVideoPlaylistFiltersValidator, middlewares_1.asyncMiddleware(listVideoChannelPlaylists));
videoChannelRouter.get('/:nameWithHost/videos', middlewares_1.asyncMiddleware(validators_1.videoChannelsNameWithHostValidator), middlewares_1.paginationValidator, validators_1.videosSortValidator, middlewares_1.setDefaultVideosSort, middlewares_1.setDefaultPagination, middlewares_1.optionalAuthenticate, middlewares_1.commonVideosFiltersValidator, middlewares_1.asyncMiddleware(listVideoChannelVideos));
function listVideoChannels(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverActor = yield application_1.getServerActor();
        const resultList = yield video_channel_2.VideoChannelModel.listForApi({
            actorId: serverActor.id,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function updateVideoChannelBanner(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const bannerPhysicalFile = req.files['bannerfile'][0];
        const videoChannel = res.locals.videoChannel;
        const oldVideoChannelAuditKeys = new audit_logger_1.VideoChannelAuditView(videoChannel.toFormattedJSON());
        const banner = yield local_actor_1.updateLocalActorImageFile(videoChannel, bannerPhysicalFile, 2);
        auditLogger.update(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoChannelAuditView(videoChannel.toFormattedJSON()), oldVideoChannelAuditKeys);
        return res.json({ banner: banner.toFormattedJSON() });
    });
}
function updateVideoChannelAvatar(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const avatarPhysicalFile = req.files['avatarfile'][0];
        const videoChannel = res.locals.videoChannel;
        const oldVideoChannelAuditKeys = new audit_logger_1.VideoChannelAuditView(videoChannel.toFormattedJSON());
        const avatar = yield local_actor_1.updateLocalActorImageFile(videoChannel, avatarPhysicalFile, 1);
        auditLogger.update(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoChannelAuditView(videoChannel.toFormattedJSON()), oldVideoChannelAuditKeys);
        return res.json({ avatar: avatar.toFormattedJSON() });
    });
}
function deleteVideoChannelAvatar(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannel = res.locals.videoChannel;
        yield local_actor_1.deleteLocalActorImageFile(videoChannel, 1);
        return res.status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204).end();
    });
}
function deleteVideoChannelBanner(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannel = res.locals.videoChannel;
        yield local_actor_1.deleteLocalActorImageFile(videoChannel, 2);
        return res.status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204).end();
    });
}
function addVideoChannel(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannelInfo = req.body;
        const videoChannelCreated = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const account = yield account_1.AccountModel.load(res.locals.oauth.token.User.Account.id, t);
            return video_channel_1.createLocalVideoChannel(videoChannelInfo, account, t);
        }));
        const payload = { actorId: videoChannelCreated.actorId };
        yield job_queue_1.JobQueue.Instance.createJobWithPromise({ type: 'actor-keys', payload });
        auditLogger.create(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoChannelAuditView(videoChannelCreated.toFormattedJSON()));
        logger_1.logger.info('Video channel %s created.', videoChannelCreated.Actor.url);
        return res.json({
            videoChannel: {
                id: videoChannelCreated.id
            }
        });
    });
}
function updateVideoChannel(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannelInstance = res.locals.videoChannel;
        const videoChannelFieldsSave = videoChannelInstance.toJSON();
        const oldVideoChannelAuditKeys = new audit_logger_1.VideoChannelAuditView(videoChannelInstance.toFormattedJSON());
        const videoChannelInfoToUpdate = req.body;
        let doBulkVideoUpdate = false;
        try {
            yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (videoChannelInfoToUpdate.displayName !== undefined)
                    videoChannelInstance.name = videoChannelInfoToUpdate.displayName;
                if (videoChannelInfoToUpdate.description !== undefined)
                    videoChannelInstance.description = videoChannelInfoToUpdate.description;
                if (videoChannelInfoToUpdate.support !== undefined) {
                    const oldSupportField = videoChannelInstance.support;
                    videoChannelInstance.support = videoChannelInfoToUpdate.support;
                    if (videoChannelInfoToUpdate.bulkVideosSupportUpdate === true && oldSupportField !== videoChannelInfoToUpdate.support) {
                        doBulkVideoUpdate = true;
                        yield video_1.VideoModel.bulkUpdateSupportField(videoChannelInstance, t);
                    }
                }
                const videoChannelInstanceUpdated = yield videoChannelInstance.save({ transaction: t });
                yield send_1.sendUpdateActor(videoChannelInstanceUpdated, t);
                auditLogger.update(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoChannelAuditView(videoChannelInstanceUpdated.toFormattedJSON()), oldVideoChannelAuditKeys);
                logger_1.logger.info('Video channel %s updated.', videoChannelInstance.Actor.url);
            }));
        }
        catch (err) {
            logger_1.logger.debug('Cannot update the video channel.', { err });
            database_utils_1.resetSequelizeInstance(videoChannelInstance, videoChannelFieldsSave);
            throw err;
        }
        res.type('json').status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204).end();
        if (doBulkVideoUpdate) {
            yield video_channel_1.federateAllVideosOfChannel(videoChannelInstance);
        }
    });
}
function removeVideoChannel(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannelInstance = res.locals.videoChannel;
        yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield video_playlist_1.VideoPlaylistModel.resetPlaylistsOfChannel(videoChannelInstance.id, t);
            yield videoChannelInstance.destroy({ transaction: t });
            auditLogger.delete(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoChannelAuditView(videoChannelInstance.toFormattedJSON()));
            logger_1.logger.info('Video channel %s deleted.', videoChannelInstance.Actor.url);
        }));
        return res.type('json').status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204).end();
    });
}
function getVideoChannel(req, res) {
    const videoChannel = res.locals.videoChannel;
    if (videoChannel.isOutdated()) {
        job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-refresher', payload: { type: 'actor', url: videoChannel.Actor.url } });
    }
    return res.json(videoChannel.toFormattedJSON());
}
function listVideoChannelPlaylists(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverActor = yield application_1.getServerActor();
        const resultList = yield video_playlist_1.VideoPlaylistModel.listForApi({
            followerActorId: serverActor.id,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            videoChannelId: res.locals.videoChannel.id,
            type: req.query.playlistType
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function listVideoChannelVideos(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannelInstance = res.locals.videoChannel;
        const followerActorId = express_utils_1.isUserAbleToSearchRemoteURI(res) ? null : undefined;
        const countVideos = express_utils_1.getCountVideos(req);
        const query = query_1.pickCommonVideoQuery(req.query);
        const apiOptions = yield hooks_1.Hooks.wrapObject(Object.assign(Object.assign({}, query), { followerActorId, includeLocalVideos: true, nsfw: express_utils_1.buildNSFWFilter(res, query.nsfw), withFiles: false, videoChannelId: videoChannelInstance.id, user: res.locals.oauth ? res.locals.oauth.token.User : undefined, countVideos }), 'filter:api.video-channels.videos.list.params');
        const resultList = yield hooks_1.Hooks.wrapPromiseFun(video_1.VideoModel.listForApi, apiOptions, 'filter:api.video-channels.videos.list.result');
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
