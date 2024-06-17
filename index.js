import { fork } from 'child_process';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import fsPromises from 'fs/promises';
import yargs from 'yargs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let isRunning = false;

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  const args = process.argv.slice(2);
  const child = fork(file, args);
  
  child.on('message', data => {
    switch (data) {
      case 'reset':
        child.kill();
        isRunning = false;
        start(file);
        break;
      case 'uptime':
        child.send(process.uptime());
        break;
    }
  });

  child.on('exit', (code) => {
    isRunning = false;
    console.error('⚠️ ERROR ⚠️ >> ', code);
    start('main.js'); // Reinicia el script en caso de error

    if (code === 0) return;
    fsPromises.watchFile(file, () => {
      fsPromises.unwatchFile(file);
      start(file);
    });
  });

  const ramInGB = os.totalmem() / (1024 * 1024 * 1024);
  const freeRamInGB = os.freemem() / (1024 * 1024 * 1024);
  const packageJsonPath = path.join(path.dirname(new URL(import.meta.url).pathname), './package.json');

  try {
    const packageJsonData = await fsPromises.readFile(packageJsonPath, 'utf-8');
    const packageJsonObj = JSON.parse(packageJsonData);
    const currentTime = new Date().toLocaleString();
    let lineM = '⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》';

    console.log(chalk.yellow(`╭${lineM}
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')}${chalk.yellow(`🖥️ ${os.type()}, ${os.release()} - ${os.arch()}`)}
┊${chalk.blueBright('┊')}${chalk.yellow(`💾 Total RAM: ${ramInGB.toFixed(2)} GB`)}
┊${chalk.blueBright('┊')}${chalk.yellow(`💽 Free RAM: ${freeRamInGB.toFixed(2)} GB`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')} ${chalk.blue.bold(`🟢INFORMACIÓN🟢 :`)}
┊${chalk.blueBright('┊')} ${chalk.blueBright('┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} 
┊${chalk.blueBright('┊')}${chalk.cyan(`愛 Nombre: ${packageJsonObj.name}`)}
┊${chalk.blueBright('┊')}${chalk.cyan(`🃏 Versión: ${packageJsonObj.version}`)}
┊${chalk.blueBright('┊')}${chalk.cyan(`📌 Descripción: ${packageJsonObj.description}`)}
┊${chalk.blueBright('┊')}${chalk.cyan(`🥷 Project Author: ${packageJsonObj.author.name} (@vvruno_)`)}
┊${chalk.blueBright('┊')}${chalk.blueBright('┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} 
┊${chalk.blueBright('┊')}${chalk.yellow(`🃏 Colaboradores:`)}
┊${chalk.blueBright('┊')}${chalk.yellow(`• $$$ ($$$)`)}
┊${chalk.blueBright('┊')}${chalk.yellow(`• $$$ ($$$)`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} 
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')}${chalk.cyan(`⏰ Hora Actual :`)}
┊${chalk.blueBright('┊')}${chalk.cyan(`${currentTime}`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} 
╰${lineM}`));
    setInterval(() => {}, 1000);
  } catch (err) {
    console.error(chalk.red(`❌ No se pudo leer el archivo package.json: ${err}`));
  }

  let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
  if (!opts['test']) {
    if (!rl.listenerCount()) rl.on('line', line => {
      child.send(line.trim());
    });
  }
}

start('main.js');
