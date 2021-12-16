"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = tslib_1.__importStar(require("chai"));
const extra_utils_1 = require("@shared/extra-utils");
const models_1 = require("@shared/models");
const expect = chai.expect;
describe('Test misc endpoints', function () {
    let server;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            server = yield extra_utils_1.createSingleServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
        });
    });
    describe('Test a well known endpoints', function () {
        it('Should get security.txt', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/security.txt',
                    expectedStatus: models_1.HttpStatusCode.OK_200
                });
                expect(res.text).to.contain('security issue');
            });
        });
        it('Should get nodeinfo', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/nodeinfo',
                    expectedStatus: models_1.HttpStatusCode.OK_200
                });
                expect(res.body.links).to.be.an('array');
                expect(res.body.links).to.have.lengthOf(1);
                expect(res.body.links[0].rel).to.equal('http://nodeinfo.diaspora.software/ns/schema/2.0');
            });
        });
        it('Should get dnt policy text', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/dnt-policy.txt',
                    expectedStatus: models_1.HttpStatusCode.OK_200
                });
                expect(res.text).to.contain('http://www.w3.org/TR/tracking-dnt');
            });
        });
        it('Should get dnt policy', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/dnt',
                    expectedStatus: models_1.HttpStatusCode.OK_200
                });
                expect(res.body.tracking).to.equal('N');
            });
        });
        it('Should get change-password location', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/change-password',
                    expectedStatus: models_1.HttpStatusCode.FOUND_302
                });
                expect(res.header.location).to.equal('/my-account/settings');
            });
        });
        it('Should test webfinger', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const resource = 'acct:peertube@' + server.host;
                const accountUrl = server.url + '/accounts/peertube';
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/webfinger?resource=' + resource,
                    expectedStatus: models_1.HttpStatusCode.OK_200
                });
                const data = res.body;
                expect(data.subject).to.equal(resource);
                expect(data.aliases).to.contain(accountUrl);
                const self = data.links.find(l => l.rel === 'self');
                expect(self).to.exist;
                expect(self.type).to.equal('application/activity+json');
                expect(self.href).to.equal(accountUrl);
                const remoteInteract = data.links.find(l => l.rel === 'http://ostatus.org/schema/1.0/subscribe');
                expect(remoteInteract).to.exist;
                expect(remoteInteract.template).to.equal(server.url + '/remote-interaction?uri={uri}');
            });
        });
    });
    describe('Test classic static endpoints', function () {
        it('Should get robots.txt', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/robots.txt',
                    expectedStatus: models_1.HttpStatusCode.OK_200
                });
                expect(res.text).to.contain('User-agent');
            });
        });
        it('Should get security.txt', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/security.txt',
                    expectedStatus: models_1.HttpStatusCode.MOVED_PERMANENTLY_301
                });
            });
        });
        it('Should get nodeinfo', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/nodeinfo/2.0.json',
                    expectedStatus: models_1.HttpStatusCode.OK_200
                });
                expect(res.body.software.name).to.equal('peertube');
                expect(res.body.usage.users.activeMonth).to.equal(1);
                expect(res.body.usage.users.activeHalfyear).to.equal(1);
            });
        });
    });
    describe('Test bots endpoints', function () {
        it('Should get the empty sitemap', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/sitemap.xml',
                    expectedStatus: models_1.HttpStatusCode.OK_200
                });
                expect(res.text).to.contain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
                expect(res.text).to.contain('<url><loc>http://localhost:' + server.port + '/about/instance</loc></url>');
            });
        });
        it('Should get the empty cached sitemap', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/sitemap.xml',
                    expectedStatus: models_1.HttpStatusCode.OK_200
                });
                expect(res.text).to.contain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
                expect(res.text).to.contain('<url><loc>http://localhost:' + server.port + '/about/instance</loc></url>');
            });
        });
        it('Should add videos, channel and accounts and get sitemap', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(35000);
                yield server.videos.upload({ attributes: { name: 'video 1', nsfw: false } });
                yield server.videos.upload({ attributes: { name: 'video 2', nsfw: false } });
                yield server.videos.upload({ attributes: { name: 'video 3', privacy: 3 } });
                yield server.channels.create({ attributes: { name: 'channel1', displayName: 'channel 1' } });
                yield server.channels.create({ attributes: { name: 'channel2', displayName: 'channel 2' } });
                yield server.users.create({ username: 'user1', password: 'password' });
                yield server.users.create({ username: 'user2', password: 'password' });
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/sitemap.xml?t=1',
                    expectedStatus: models_1.HttpStatusCode.OK_200
                });
                expect(res.text).to.contain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
                expect(res.text).to.contain('<url><loc>http://localhost:' + server.port + '/about/instance</loc></url>');
                expect(res.text).to.contain('<video:title>video 1</video:title>');
                expect(res.text).to.contain('<video:title>video 2</video:title>');
                expect(res.text).to.not.contain('<video:title>video 3</video:title>');
                expect(res.text).to.contain('<url><loc>http://localhost:' + server.port + '/video-channels/channel1</loc></url>');
                expect(res.text).to.contain('<url><loc>http://localhost:' + server.port + '/video-channels/channel2</loc></url>');
                expect(res.text).to.contain('<url><loc>http://localhost:' + server.port + '/accounts/user1</loc></url>');
                expect(res.text).to.contain('<url><loc>http://localhost:' + server.port + '/accounts/user2</loc></url>');
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
