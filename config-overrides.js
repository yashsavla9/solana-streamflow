const { ProvidePlugin } = require('webpack');

module.exports = function (config, env) {
    return {
        ...config,
        module: {
            ...config.module,
            rules: [
                ...config.module.rules,
                {
                    test: /\.m?[jt]sx?$/,
                    enforce: 'pre',
                    use: ['source-map-loader'],
                },
                {
                    test: /\.m?[jt]sx?$/,
                    resolve: {
                        fullySpecified: false,
                    },
                },
            ],
        },
        plugins: [
            ...config.plugins,
            new ProvidePlugin({
                process: 'process/browser',
            }),
            new ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
        ],
        resolve: {
            ...config.resolve,
            fallback: {
                assert: require.resolve('assert'),
                buffer: require.resolve('buffer'),
                crypto: require.resolve('crypto-browserify'),
                stream: require.resolve('stream-browserify'),
                path: require.resolve('path-browserify'),
                fs: false,
            },
        },
        ignoreWarnings: [/Failed to parse source map/],
    };
};
