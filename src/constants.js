// 存放用户所需的常量
const { version } = require('../package.json');

// 存储模板的位置
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`;
// console.log('downloadDirectory', downloadDirectory, process.env);
module.exports = {
  version,
  downloadDirectory,
};
