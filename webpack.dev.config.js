const fs = require('fs');
const port = 8087;

function getEntries(dirPath) {
  let result = {};
  let dirs = fs.readdirSync(dirPath);
  dirs.forEach((dirName) => {
    let matched = dirName.match(/(.+)\.js/);
    if(fs.statSync(`${dirPath}/${dirName}`).isDirectory()){
      let res = getEntries(`${dirPath}/${dirName}`);
      Object.keys(res).forEach((name)=>{
        result[name] = res[name];
      })
    }

    if (matched && matched[1]) {
      result[`${dirPath.replace(__dirname + '/','')}/${matched[1]}`] = `${dirPath}/${matched[1]}.js`
    }
  });
  console.log(result)
  return result;
}



module.exports = {
  plugins: [],
  entry: getEntries(`${__dirname}/demo`),
  output: {
    path: __dirname + '/dist/',
    filename: '[name].js'
  },
  devServer: {
    contentBase: "./demo",
    historyApiFallback: true,
    inline: true,
    host: '0.0.0.0',
    publicPath: '/dist/',
    port: port
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader?limit=8192'
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'stage-0']
        }
      }
    ]
  }
};
