import Bundler, { ParcelOptions, ParcelBundle } from 'parcel-bundler';
import fs from 'fs-extra';
import path from 'path';
import { ServerlessOptions, ServerlessInstance } from './types';

const serverlessFolder = '.serverless';
const buildFolder = '.build';

class ServerlessPluginParcel {
    hooks: { [key: string]: Function };
    options: ServerlessOptions;
    sls: ServerlessInstance;
    private originalServicePath: string = '';
    private buildPath: string = '';
    private isWatching = false;
    private invokeBundle: ParcelBundle | void = undefined;

    constructor(serverless: ServerlessInstance, options: ServerlessOptions) {
        this.sls = serverless;
        this.options = options;

        this.hooks = {
            'before:run:run': async () => {
                await this.bundle();
            },
            'before:offline:start': async () => {
                await this.bundle();
            },
            'before:offline:start:init': async () => {
                await this.bundle();
            },
            'before:package:createDeploymentArtifacts': this.bundle.bind(this),
            'after:package:createDeploymentArtifacts': this.cleanup.bind(this),
            'before:deploy:function:packageFunction': this.bundle.bind(this),
            'after:deploy:function:packageFunction': this.cleanup.bind(this),
            'before:invoke:local:invoke': async () => {
                await this.bundle();

                if (this.invokeBundle) {
                    // invalidate require cache
                    delete require.cache[
                        require.resolve(this.invokeBundle.name)
                    ];
                }
            },
            'after:invoke:local:invoke': () => {
                if (this.options.watch) {
                    this.sls.cli.log('Waiting for changes ...');
                }
            }
        };
    }

    get functions() {
        return this.options.function
            ? {
                  [this.options.function]: this.sls.service.functions[
                      this.options.function
                  ]
              }
            : this.sls.service.functions;
    }

    get entries() {
        return Object.keys(this.functions).map(key => {
            const { handler } = this.functions[key];
            const method = path.extname(handler);

            return handler.replace(method, '.[jt]s');
        });
    }

    async bundle(): Promise<void> {
        this.sls.cli.log('Compiling with Parcel...');

        const { custom } = this.sls.service;
        const options = (custom && custom.parcel) || {};

        if (!this.originalServicePath) {
            // Save original service path and functions
            this.originalServicePath = this.sls.config.servicePath;
            this.buildFolder = options.buildFolder || buildFolder;
            this.buildPath = path.join(this.originalServicePath, this.buildFolder);
            // Fake service path so that serverless will know what to zip
            this.sls.config.servicePath = this.buildPath;
        }

        // early exist if bundle is already initialized
        if (this.isWatching) {
            return;
        }

        const defaults: ParcelOptions = {
            target: 'node',
            cache: false,
            watch: this.options.watch || false
        };
        const config = {
            ...defaults,
            ...options
        };

        if (this.options.watch) {
            this.isWatching = true;
        }

        if (this.entries.length === 1) {
            // watch single function
            const entry = this.entries[0];

            const bundler = new Bundler(entry, {
                ...config,
                outDir: path.relative(
                    this.originalServicePath,
                    path.join(this.buildPath, path.dirname(entry))
                )
            });

            this.invokeBundle = await bundler.bundle();

            if (this.isWatching) {
                (bundler as any).on('buildEnd', () => {
                    this.sls.pluginManager.spawn('invoke:local');
                });
            }
        } else {
            for (const entry of this.entries) {
                const bundler = new Bundler(entry, {
                    ...config,
                    outDir: path.relative(
                        this.originalServicePath,
                        path.join(this.buildPath, path.dirname(entry))
                    )
                });

                await bundler.bundle();
            }
        }
    }

    async moveArtifacts(): Promise<void> {
        await fs.copy(
            path.join(this.originalServicePath, this.buildFolder, serverlessFolder),
            path.join(this.originalServicePath, serverlessFolder)
        );

        if (this.options.function) {
            const fn = this.sls.service.functions[this.options.function];

            if (fn.package.artifact) {
                fn.package.artifact = path.join(
                    this.originalServicePath,
                    serverlessFolder,
                    path.basename(fn.package.artifact)
                );
            }
            return;
        }

        if (this.sls.service.package.individually) {
            const functionNames = this.sls.service.getAllFunctions();
            functionNames.forEach(name => {
                const fn = this.sls.service.functions[name];

                if (fn.package.artifact) {
                    fn.package.artifact = path.join(
                        this.originalServicePath,
                        serverlessFolder,
                        path.basename(fn.package.artifact)
                    );
                }
            });
            return;
        }

        if (this.sls.service.package.artifact) {
            this.sls.service.package.artifact = path.join(
                this.originalServicePath,
                serverlessFolder,
                path.basename(this.sls.service.package.artifact)
            );
        }
    }

    async cleanup(): Promise<void> {
        await this.moveArtifacts();

        // set the service path back
        this.sls.config.servicePath = this.originalServicePath;
        // remove the build folder
        fs.removeSync(this.buildPath);
    }
}

module.exports = ServerlessPluginParcel;
