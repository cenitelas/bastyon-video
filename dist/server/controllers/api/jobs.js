"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsRouter = void 0;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const misc_1 = require("../../helpers/custom-validators/misc");
const job_queue_1 = require("../../lib/job-queue");
const middlewares_1 = require("../../middlewares");
const jobs_1 = require("../../middlewares/validators/jobs");
const jobsRouter = express_1.default.Router();
exports.jobsRouter = jobsRouter;
jobsRouter.get('/:state?', middlewares_1.openapiOperationDoc({ operationId: 'getJobs' }), middlewares_1.paginationValidatorBuilder(['jobs']), middlewares_1.jobsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, jobs_1.listJobsValidator, middlewares_1.asyncMiddleware(listJobs));
function listJobs(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const state = req.params.state;
        const asc = req.query.sort === 'createdAt';
        const jobType = req.query.jobType;
        const jobs = yield job_queue_1.JobQueue.Instance.listForApi({
            state,
            start: req.query.start,
            count: req.query.count,
            asc,
            jobType
        });
        const total = yield job_queue_1.JobQueue.Instance.count(state, jobType);
        const result = {
            total,
            data: yield Promise.all(jobs.map(j => formatJob(j, state)))
        };
        return res.json(result);
    });
}
function formatJob(job, state) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const error = misc_1.isArray(job.stacktrace) && job.stacktrace.length !== 0
            ? job.stacktrace[0]
            : null;
        return {
            id: job.id,
            state: state || (yield job.getState()),
            type: job.queue.name,
            data: job.data,
            progress: yield job.progress(),
            priority: job.opts.priority,
            error,
            createdAt: new Date(job.timestamp),
            finishedOn: new Date(job.finishedOn),
            processedOn: new Date(job.processedOn)
        };
    });
}
