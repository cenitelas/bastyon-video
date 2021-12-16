"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const database_1 = require("../../server/initializers/database");
const commander_1 = require("commander");
const plugin_manager_1 = require("../../server/lib/plugins/plugin-manager");
const path_1 = require("path");
commander_1.program
    .option('-n, --npm-name [npmName]', 'Plugin to install')
    .option('-v, --plugin-version [pluginVersion]', 'Plugin version to install')
    .option('-p, --plugin-path [pluginPath]', 'Path of the plugin you want to install')
    .parse(process.argv);
const options = commander_1.program.opts();
if (!options.npmName && !options.pluginPath) {
    console.error('You need to specify a plugin name with the desired version, or a plugin path.');
    process.exit(-1);
}
if (options.pluginPath && !path_1.isAbsolute(options.pluginPath)) {
    console.error('Plugin path should be absolute.');
    process.exit(-1);
}
run()
    .then(() => process.exit(0))
    .catch(err => {
    console.error(err);
    process.exit(-1);
});
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield database_1.initDatabaseModels(true);
        const toInstall = options.npmName || options.pluginPath;
        yield plugin_manager_1.PluginManager.Instance.install(toInstall, options.pluginVersion, !!options.pluginPath);
    });
}
