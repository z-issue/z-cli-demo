const program = require('commander');
const path = require('path');

const commandList = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: [
      'z-cli create <project name>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'z-cli config set <k> <v>',
      'z-cli config get <k>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: [

    ],
  },
};

Reflect.ownKeys(commandList).forEach((action) => {
  program
    .command(action) // 配置命令的名字
    .alias(commandList[action].alias) // 命令的别名
    .description(commandList[action].description) // 命令对应的描述
    .action(() => { // 执行该命令的具体操作
      if (action === '*') {
        console.log(commandList[action].description);
        return;
      }
      require(path.resolve(__dirname, action))(...process.argv.slice(3));
      console.log(action);
    });
});

program.on('--help', () => {
  Reflect.ownKeys(commandList).forEach((action) => {
    commandList[action].examples.forEach((example) => {
      console.log(example);
    });
  });
});

// program
//   .command('create') // 配置命令的名字
//   .alias('c') // 命令的别名
//   .description('create a project') // 命令对应的描述
//   .action(() => { // 执行该命令的具体操作
//     console.log('create');
//   });
// console.log('process', process.argv);
// 解析用户传输过来的参数
program.parse(process.argv);
