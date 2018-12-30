import { ParcelOptions } from 'parcel-bundler';

export interface ServerlessInstance {
    cli: {
        log(str: string): void;
    };
    config: {
        servicePath: string;
    };
    service: {
        provider: {
            name: string;
        };
        functions: { [key: string]: ServerlessFunction };
        package: ServerlessPackage;
        getAllFunctions: () => string[];
        custom?: {
            parcel?: ParcelOptions;
        };
    };
    pluginManager: PluginManager;
}

export interface ServerlessOptions {
    function?: string;
    watch?: boolean;
    extraServicePath?: string;
}

export interface ServerlessFunction {
    handler: string;
    package: ServerlessPackage;
}

export interface ServerlessPackage {
    include: string[];
    exclude: string[];
    artifact?: string;
    individually?: boolean;
}

export interface PluginManager {
    spawn(command: string): Promise<void>;
}
