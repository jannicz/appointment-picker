module.exports = {
    entry: './example-react/index.js',
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            }
        ]
    },
    resolve: {
        extensions: ['*', '.js', '.jsx']
    },
    output: {
        path: __dirname + '/example-react',
        publicPath: '/example-react',
        filename: 'bundle.js'
    },
    devServer: {
        contentBase: './'
    }
};
