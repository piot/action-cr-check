"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function findInDir(dir, filter, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir.toString(), file);
        const fileStat = fs.lstatSync(filePath);
        if (fileStat.isDirectory()) {
            const name = path.basename(filePath);
            if (name != 'node_modules') {
                findInDir(filePath, filter, fileList);
            }
        }
        else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });
    return fileList;
}
function checkFile(filename) {
    const buffer = fs.readFileSync(filename);
    const string = buffer.toString('utf8');
    let violations = [];
    const lines = string.split(/\n/);
    let line = 1;
    for (const lineString of lines) {
        const index = lineString.indexOf('\r');
        if (index != -1) {
            violations.push(line);
        }
        line++;
    }
    return violations;
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let detectedErrorsCount = 0;
            let directory = core.getInput('path');
            if (directory == '') {
                directory = '.';
            }
            const allFiles = findInDir(directory, /(\.cs|\.go|\.ts|\.js)$/);
            for (const f of allFiles) {
                const violations = checkFile(f);
                if (violations.length) {
                    detectedErrorsCount++;
                    const firstViolation = violations[0];
                    console.log(`::error file=${f},line=${firstViolation}::Detected CR at lines ${violations}`);
                }
            }
            if (detectedErrorsCount > 0) {
                core.setFailed(`found ${detectedErrorsCount} file(s) containing CR`);
            }
            else {
                core.info(`all files are ok`);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
