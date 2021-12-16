"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSignupAllowedForCurrentIP = exports.isSignupAllowed = void 0;
const tslib_1 = require("tslib");
const ipaddr_js_1 = require("ipaddr.js");
const config_1 = require("../initializers/config");
const user_1 = require("../models/user/user");
const isCidr = require('is-cidr');
function isSignupAllowed() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (config_1.CONFIG.SIGNUP.ENABLED === false) {
            return { allowed: false };
        }
        if (config_1.CONFIG.SIGNUP.LIMIT === -1) {
            return { allowed: true };
        }
        const totalUsers = yield user_1.UserModel.countTotal();
        return { allowed: totalUsers < config_1.CONFIG.SIGNUP.LIMIT };
    });
}
exports.isSignupAllowed = isSignupAllowed;
function isSignupAllowedForCurrentIP(ip) {
    if (!ip)
        return false;
    const addr = ipaddr_js_1.parse(ip);
    const excludeList = ['blacklist'];
    let matched = '';
    if (config_1.CONFIG.SIGNUP.FILTERS.CIDR.WHITELIST.filter(cidr => isCidr(cidr)).length > 0) {
        excludeList.push('unknown');
    }
    if (addr.kind() === 'ipv4') {
        const addrV4 = ipaddr_js_1.IPv4.parse(ip);
        const rangeList = {
            whitelist: config_1.CONFIG.SIGNUP.FILTERS.CIDR.WHITELIST.filter(cidr => isCidr.v4(cidr))
                .map(cidr => ipaddr_js_1.IPv4.parseCIDR(cidr)),
            blacklist: config_1.CONFIG.SIGNUP.FILTERS.CIDR.BLACKLIST.filter(cidr => isCidr.v4(cidr))
                .map(cidr => ipaddr_js_1.IPv4.parseCIDR(cidr))
        };
        matched = ipaddr_js_1.subnetMatch(addrV4, rangeList, 'unknown');
    }
    else if (addr.kind() === 'ipv6') {
        const addrV6 = ipaddr_js_1.IPv6.parse(ip);
        const rangeList = {
            whitelist: config_1.CONFIG.SIGNUP.FILTERS.CIDR.WHITELIST.filter(cidr => isCidr.v6(cidr))
                .map(cidr => ipaddr_js_1.IPv6.parseCIDR(cidr)),
            blacklist: config_1.CONFIG.SIGNUP.FILTERS.CIDR.BLACKLIST.filter(cidr => isCidr.v6(cidr))
                .map(cidr => ipaddr_js_1.IPv6.parseCIDR(cidr))
        };
        matched = ipaddr_js_1.subnetMatch(addrV6, rangeList, 'unknown');
    }
    return !excludeList.includes(matched);
}
exports.isSignupAllowedForCurrentIP = isSignupAllowedForCurrentIP;
