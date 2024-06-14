"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chardet = __importStar(require("chardet"));
const iconv = __importStar(require("iconv-lite"));
const pdfkit_1 = __importDefault(require("pdfkit"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('codescannerreport.scanFiles', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const rootPath = workspaceFolders[0].uri.fsPath;
            const report = scanDirectory(rootPath);
            generatePDFReport(report);
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
const ignoredDirectories = [
    'node_modules',
    'bower_components',
    'vendor',
    'dist',
    'build',
    'libs',
    'lib'
];
const ignoredFiles = [
    'pdf.js',
    'pdf.js.map',
    'pdf.worker.js',
    'pdf.worker.js.map',
    'plugins.bundle.js',
    'plugins.bundle.js.map',
    'scripts.bundle.js',
    'scripts.bundle.js.map',
    'apexcharts.js',
    'apexcharts.js.map',
    'bootstrap-tagsinput.js',
    'widgets.bundle.js',
    'paper-dashboard.js',
    'jquery.mask.js',
    'jquery.mask.min.js',
    'modal.min.js',
    'modal.js', ,
    'semantic.js',
    'semantic.min.js'
];
const ignoredFilePatterns = [
    /bootstrap.*\.js/,
    /bootstrap.*\.js\.map/
];
function scanDirectory(dir) {
    const report = [];
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!ignoredDirectories.includes(file)) {
                report.push(...scanDirectory(filePath));
            }
        }
        else {
            const fileName = path.basename(filePath);
            const isIgnoredFile = ignoredFiles.includes(fileName) ||
                ignoredFilePatterns.some(pattern => pattern.test(fileName));
            if (!isIgnoredFile && (filePath.endsWith('.php') || filePath.endsWith('.js'))) {
                const content = readFileContent(filePath);
                report.push(...scanFile(content, filePath));
            }
        }
    });
    return report;
}
function readFileContent(filePath) {
    const buffer = fs.readFileSync(filePath);
    const detectedEncoding = chardet.detect(buffer);
    const content = iconv.decode(buffer, detectedEncoding || 'utf-8');
    return content;
}
const patterns = [
    { regex: /include\s+["'](.+)["'];/gi, name: 'include' }, // Include
    { regex: /include_once\s+["'](.+)["'];/gi, name: 'include_once' }, // Include_once
    { regex: /console\.log\(.+\);/gi, name: 'console.log' }, // console.log
    {
        regex: /echo\s+((?!<.*?>)(?!<\?php.*?\?>)(?!\w+\s*\()(?!\bactive\b|\bchecked\b|\bselected\b|.*:\s*).)*;/gis,
        name: 'echo'
    }, // echo excluding specific patterns and contexts including HTML, PHP, functions, and CSS
    { regex: /var_dump\(.+\);/gi, name: 'var_dump' }, // var_dump
    { regex: /print_r\(.+\);/gi, name: 'print_r' }, // print_r
    { regex: /rp_pre\(.+\);/gi, name: 'rp_pre' }, // rp_pre
    { regex: /rp_echo\(.+\);/gi, name: 'rp_echo' }, // rp_echo
    { regex: /rp_pdo_select_table\s*\(.*?,.*?,.*?,.*?,\s*true\s*\)/gi, name: 'rp_pdo_select_table' }, // rp_pdo_select_table
    { regex: /rp_pdo_insert_table\s*\(.*?,.*?,\s*true\s*\)/gi, name: 'rp_pdo_insert_table' }, // rp_pdo_insert_table
    { regex: /rp_pdo_update_table\s*\(.*?,.*?,\s*true\s*\)/gi, name: 'rp_pdo_update_table' }, // rp_pdo_update_table
    { regex: /rp_pdo_delete_table\s*\(.*?,.*?,\s*true\s*\)/gi, name: 'rp_pdo_delete_table' } // rp_pdo_delete_table
];
function scanFile(content, filePath) {
    const report = [];
    const lines = content.split('\n');
    const includeSet = new Set(); // Usado para rastrear includes únicos
    const commentRegex = /^\s*(\/\/|#|\/\*|\*|\*\/)/; // Regex para identificar linhas comentadas
    lines.forEach((line, index) => {
        if (commentRegex.test(line)) {
            return;
        } // Ignorar linhas comentadas
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.regex.exec(line)) !== null) {
                if (pattern.name === 'include' || pattern.name === 'include_once') {
                    const includePath = match[1];
                    if (includeSet.has(includePath)) {
                        report.push({ file: filePath, line: index + 1, occurrence: `Include duplicado: ${line.trim()}` });
                    }
                    else {
                        includeSet.add(includePath);
                    }
                }
                else {
                    report.push({ file: filePath, line: index + 1, occurrence: line.trim() });
                }
            }
        });
    });
    return report;
}
function generatePDFReport(report) {
    const doc = new pdfkit_1.default();
    const filePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'report.pdf');
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(12).text('Scan Report\n\n\n', { align: 'center' });
    report.forEach(item => {
        doc.fontSize(10);
        doc.font('Helvetica-Bold').text('Arquivo: ', { continued: true });
        doc.font('Helvetica').text(item.file, { continued: true });
        doc.font('Helvetica-Bold').text(', Linha: ', { continued: true });
        doc.font('Helvetica').text(item.line.toString(), { continued: true });
        doc.font('Helvetica-Bold').text(', Ocorrência: ', { continued: true });
        doc.font('Helvetica').text(item.occurrence);
        doc.moveTo(doc.x, doc.y + 5).lineTo(doc.page.width - doc.page.margins.right, doc.y + 5).stroke();
        doc.moveDown();
    });
    doc.end();
    vscode.window.showInformationMessage(`Relatório gerado em ${filePath}`);
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map