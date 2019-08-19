#!/usr/bin/env node

const path = require('path');
const os = require('os');
const program = require('commander');
const packageInfo = require('./package.json');
const mkdirp = require('mkdirp');
const Generator = require('./lib/generator');

const red = text => `\x1b[31m${text}\x1b[0m`;
const magenta = text => `\x1b[35m${text}\x1b[0m`;
const yellow = text => `\x1b[33m${text}\x1b[0m`;
const green = text => `\x1b[32m${text}\x1b[0m`;

let asyncapiFile;
let template;

const parseOutput = dir => path.resolve(dir);
const parseJSON = value => {
  try {
    return JSON.parse(value);
  } catch (e) {
    console.log(yellow(`Warning: values of --params will not be available in the templates, there was a error parsing: ${value}`));
    console.log(magenta(e.message));
    return {};
  }
};

const showErrorAndExit = err => {
  console.error(red('Something went wrong:'));
  console.error(red(err.stack || err.message));
  process.exit(1);
};

program
  .version(packageInfo.version)
  .arguments('<asyncapi> <template>')
  .action((asyncAPIPath, tmpl) => {
    asyncapiFile = path.resolve(asyncAPIPath);
    template = tmpl;
  })
  .option('-o, --output <outputDir>', 'directory where to put the generated files (defaults to current directory)', parseOutput, process.cwd())
  .option('-t, --templates <templateDir>', 'directory where templates are located (defaults to internal templates directory)', null, path.resolve(__dirname, 'templates'))
  .option('--params <templateParams>', 'json object with additional params to pass to templates', parseJSON)
  .parse(process.argv);

if (!asyncapiFile) {
  console.error(red('> Path to AsyncAPI file not provided.'));
  program.help(); // This exits the process
}

mkdirp(program.output, err => {
  if (err) return showErrorAndExit(err);

  const generator = new Generator(template, program.output || path.resolve(os.tmpdir(), 'asyncapi-generator'), {
    templatesDir: program.templates,
  });

  generator.generateFromFile(asyncapiFile)
    .then(() => {
      console.log(green('Done! ✨'));
      console.log(yellow('Check out your shiny new generated files at ') + magenta(program.output) + yellow('.'));
    })
    .catch(showErrorAndExit);
});

process.on('unhandledRejection', showErrorAndExit);
