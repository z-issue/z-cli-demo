// create的所有逻辑

// create功能是创建项目
// 拉取你自己的所有项目列出来 让用户选 安装哪个项目 projectName
// 选完后 再显示所有的版本号
// https://api.github.com/orgs/z-issue/repos 获取用户（组织）下的仓库
const axios = require('axios');
const ora = require('ora');
const inquirer = require('inquirer');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const metalSmith = require('metalsmith');
let { render } = require('consolidate').ejs;
let downLoadGitReop = require('download-git-repo');
let ncp = require('ncp');
const { downloadDirectory } = require('./constants');

render = promisify(render);
downLoadGitReop = promisify(downLoadGitReop);
ncp = promisify(ncp);
// 获取项目列表
const waitFnLoading = (fn, message) => async (...arg) => {
//   console.log('arg', arg, message);
  const spinner = new ora(message);
  spinner.start();
  const result = await fn(...arg);
  spinner.succeed();
  return result;
//   console.log(data);
  //   [
//     {
//       name: 'z-gulp',
//     },
//     {
//       name: 'z-template',
//     },
//   ];
};

const getGitTemplate = async (url, returnFileName) => {
  const result = await axios.get(url);
  return returnFileName ? result[returnFileName] : result;
};

const downLoad = async (repo, tag) => {
  let api = `z-issue/${repo}`;
  if (tag) {
    api += `#${tag}`;
  }
  const dest = `${downloadDirectory}/${repo}`;
  await downLoadGitReop(api, dest);
  return dest;
};

module.exports = async (projectName) => {
//   let repos = await waitFnLoading(() => getGitTemplate('https://api.github.com/orgs/z-issue/repos', 'data'), 'fetching template ...');
  let repos = await waitFnLoading(getGitTemplate, 'fetching template ...')('https://api.github.com/orgs/z-issue/repos', 'data');
  repos = repos.map((i) => i.name);
  //   console.log('repos', repos);

  // 获取之前 显示loading 关闭loading
  // 选择模板 inquirer
  const { repo } = await inquirer.prompt({
    name: 'repo', // 获取选择后的结果
    type: 'list',
    message: 'please choise a template to create project',
    choices: repos,
  });
  //   console.log('repos', repo);
  // 2 通过当前悬着的项目 拉取对应的版本
  // 获取对应的版本号 https://api.github.com/repos/z-issue/test-cli/tags
  let tags = await waitFnLoading(getGitTemplate, 'fetching template ...')(`https://api.github.com/repos/z-issue/${repo}/tags`, 'data');
  tags = tags.map((i) => i.name);
  //   console.log('tags', tags);
  const { tag } = await inquirer.prompt({
    name: 'tag', // 获取选择后的结果
    type: 'list',
    message: 'please choise a tags to create project',
    choices: tags,
  });
  // 3 把模板放到一个临时目标里 存好，以备后期使用
  const resultDest = await waitFnLoading(downLoad, 'download template...')(repo, tag);
  console.log('resultDest', resultDest); // 下载目录
  // 复杂的需要模板渲染 渲染后再拷贝
  // 把template 下的文件 拷贝到执行命令的目录下

  // 4 拷贝操作
  // 如果没有ask.js就是简单模板直接拷贝即可
  if (!fs.existsSync(path.join(resultDest, 'ask.js'))) {
    await ncp(resultDest, path.resolve(projectName));
  } else {
    // 复杂模板
    // 把git上的项目下载下来，如果有ask文件就是一个复杂的模板，我们需要用户选择，选择后编译模板
    // 1 让用户填信息
    console.log('复杂模板');
    await new Promise((resolve, reject) => {
      metalSmith(__dirname) // 如果传入路径 他默认会遍历当前路径下的src文件夹
        .source(resultDest)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          const question = require(path.join(resultDest, 'ask.js'));
          const answer = await inquirer.prompt(question);
          //   console.log('answer', answer);
          const meta = metal.metadata();
          Object.assign(meta, { ...answer, name: projectName });
          delete files['ask.js'];
          done();
        })
        .use((files, metal, done) => {
          console.log('metal', metal.metadata());
          const answer = metal.metadata();
          Reflect.ownKeys(files).forEach(async (file) => {
            let content = files[file].contents.toString();
            // 这里要处理 <%
            if (file.includes('js') || file.includes('json')) {
              content = await render(content, answer);
              files[file].contents = Buffer.from(content);
            }
          });
          done();
        })
        .build((err) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
      // 2 用用户填写的信息去渲染模板
    });
  }
};
