import * as core from '@actions/core';
import * as path from 'path';
import * as fs from 'fs';


function findInDir(dir: fs.PathLike, filter: RegExp, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file: string) => {
    const filePath = path.join(dir.toString(), file);
    const fileStat = fs.lstatSync(filePath);

    if (fileStat.isDirectory()) {
      const name = path.basename(filePath)
      if (name != 'node_modules') {
        findInDir(filePath, filter, fileList);
      }
    } else if (filter.test(filePath)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function checkFile(filename: fs.PathLike): number[] {
  const buffer = fs.readFileSync(filename)
  const string = buffer.toString('utf8')

  let violations: number[] = []

  const lines = string.split(/\n/)
  let line = 1
  for (const lineString of lines) {
    const index = lineString.indexOf('\r')
    if (index != -1) {
      violations.push(line)
    }
    line++
  }
  return violations
}

async function run() {
  try {
    let detectedErrorsCount = 0
    let directory = core.getInput('path')
    if (directory == '') {
      directory = '.'
    }

    const allFiles = findInDir(directory, /(\.cs|\.go|\.ts|\.js)$/)
    for (const f of allFiles) {
      const violations = checkFile(f)
      if (violations.length) {
        detectedErrorsCount++
        const firstViolation = violations[0]
        console.log(`::error file=${f},line=${firstViolation}::Detected CR at lines ${violations}`)
      }
    }

    if (detectedErrorsCount > 0) {
      core.setFailed(`found ${detectedErrorsCount} file(s) containing CR`);
    } else {
      core.info(`all files are ok`)
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
