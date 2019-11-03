# serverless-plugin-parcel

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com) [![npm version](https://badge.fury.io/js/serverless-plugin-parcel.svg)](https://badge.fury.io/js/serverless-plugin-parcel)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fthreadheap%2Fserverless-plugin-parcel.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fthreadheap%2Fserverless-plugin-parcel?ref=badge_shield)

Serverless plugin for zero-config ES6/7 and Typescript support

This project is mostly a fork of [serverless-plugin-typescript](https://github.com/prisma/serverless-plugin-typescript) and was heavily inspired by that.

## Features

-   Zero-config: Works out of the box without the need to install any other compiler or plugins
-   Supports `sls package`, `sls deploy` and `sls deploy function`
-   Supports `sls invoke local`
-   Integrates nicely with [`serverless-offline`](https://github.com/dherault/serverless-offline)

## Install

```sh
yarn add -D parcel-bundler serverless-plugin-parcel
```

or

```sh
npm install -D parcel-bundler serverless-plugin-parcel
```

Add the following plugin to your `serverless.yml`:

```yaml
plugins:
    - serverless-plugin-parcel
```

## Configure

By default, no configuration required, but you can change Parcel behavior by creating
custom `.babelrc` file and in custom `parcel` section in `serverless.yaml` config:

```yml
custom:
    parcel:
        target: node
        cache: false
```

Check [parceljs](https://parceljs.org/) documentation for the full list of available options.

See [example folder](example) for a minimal example.

### Automatic compilation

The normal Serverless deploy procedure will automatically compile with Parcel:

-   Create the Serverless project with `serverless create -t aws-nodejs`
-   Install Serverless Parcel Plugin as above
-   Deploy with `serverless deploy`

### Usage with serverless-offline

The plugin integrates very well with [serverless-offline](https://github.com/dherault/serverless-offline) to
simulate AWS Lambda and AWS API Gateway locally.

Add the plugins to your `serverless.yml` file and make sure that `serverless-plugin-parcel`
precedes `serverless-offline` as the order is important:

```yaml
plugins: ...
    - serverless-plugin-parcel
    ...
    - serverless-offline
    ...
```

Run `serverless offline` or `serverless offline start` to start the Lambda/API simulation.

In comparison to `serverless offline`, the `start` command will fire an `init` and a `end` lifecycle hook which is needed for `serverless-offline` and e.g. `serverless-dynamodb-local` to switch off resources (see below)

#### serverless-dynamodb-local

Configure your service the same as mentioned above, but additionally add the `serverless-dynamodb-local`
plugin as follows:

```yaml
plugins:
    - serverless-plugin-parcel
    - serverless-dynamodb-local
    - serverless-offline
```

Run `serverless offline start`.

### Run a function locally

To run your compiled functions locally you can:

```bash
$ serverless invoke local --function <function-name>
```

Options are:

-   `--function` or `-f` (required) is the name of the function to run
-   `--path` or `-p` (optional) path to JSON or YAML file holding input data
-   `--data` or `-d` (optional) input data

### Enabling source-maps

You can easily enable support for source-maps (making stacktraces easier to read) by installing and using the following plugin:

```bash
yarn add -D source-map-support
```

```ts
// inside of your function
import 'source-map-support/register';
```

or using [babel plugin](https://github.com/chocolateboy/babel-plugin-source-map-support):

```bash
yarn add source-map-support
yarn add -D babel-plugin-source-map-support
```

in `.babelrc`:
```json
{
    "plugins": [
        "source-map-support"
    ]
    ...
}
```

## Alternatives

[serverless-parcel](https://github.com/johnagan/serverless-parcel)

## Author

[Pavel Vlasov](https://github.com/pavelvlasov)


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fthreadheap%2Fserverless-plugin-parcel.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fthreadheap%2Fserverless-plugin-parcel?ref=badge_large)