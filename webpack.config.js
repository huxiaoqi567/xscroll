var webpack = require('webpack');
var fs = require('fs');

function getEntries() {
  let result = {
    index: './src/index.js'
  }

  let dirPath = `${__dirname}/src/plugins`;


  let dirs = fs.readdirSync(dirPath);
  dirs.forEach((dirName) => {
    let matched = dirName.match(/(.+)\.js/);
    if (matched && matched[1]) {
      result[`plugins/${matched[1]}`] = `${dirPath}/${matched[1]}.js`
    }
  });
  console.log(result)
  return result;
}




module.exports = {
  plugins: [
    // new webpack.optimize.CommonsChunkPlugin({
    //  name: 'common'
    // })
  ],
  entry: getEntries(),
  output: {
    path: __dirname + '/lib/',
    filename: '[name].js',
    libraryTarget:'umd'
  },
  devServer: {
    contentBase: "./demo",
    historyApiFallback: true,
    inline: true,
    publicPath: '/dist/'
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      // {
      //   test: /\.js$/,
      //   loader: 'jsx-loader?harmony'
      // },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader?limit=8192'
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015','stage-0']
        }
      }
    ]
  }
};
