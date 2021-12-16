"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchingRouter = void 0;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const http_error_codes_1 = require("../../../../shared/models/http/http-error-codes");
const middlewares_1 = require("../../../middlewares");
const user_video_history_1 = require("../../../models/user/user-video-history");
const watchingRouter = express_1.default.Router();
exports.watchingRouter = watchingRouter;
watchingRouter.put('/:videoId/watching', middlewares_1.openapiOperationDoc({ operationId: 'setProgress' }), middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videoWatchingValidator), middlewares_1.asyncRetryTransactionMiddleware(userWatchVideo));
function userWatchVideo(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const body = req.body;
        const { id: videoId } = res.locals.videoId;
        yield user_video_history_1.UserVideoHistoryModel.upsert({
            videoId,
            userId: user.id,
            currentTime: body.currentTime
        });
        return res.type('json')
            .status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204)
            .end();
    });
}
