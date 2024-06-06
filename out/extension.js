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
        else if (filePath.endsWith('.php') || filePath.endsWith('.js')) {
            const content = fs.readFileSync(filePath, 'utf8');
            report.push(...scanFile(content, filePath));
        }
    });
    return report;
}
function scanFile(content, filePath) {
    const report = [];
    const lines = content.split('\n');
    const includeSet = new Set();
    const patterns = [
        { regex: /include\s+["'](.+)["'];/g, name: 'include' },
        { regex: /console\.log\(.+\);/g, name: 'console.log' },
        { regex: /echo\s+.+;/g, name: 'echo' },
        { regex: /var_dump\(.+\);/g, name: 'var_dump' },
        { regex: /print_r\(.+\);/g, name: 'print_r' },
        { regex: /rp_pre\(.+\);/g, name: 'rp_pre' },
        { regex: /rp_echo\(.+\);/g, name: 'rp_echo' }
    ];
    lines.forEach((line, index) => {
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.regex.exec(line)) !== null) {
                if (pattern.name === 'include') {
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
    const doc = new pdfkit_1.default({ layout: 'landscape' });
    const filePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'report.pdf');
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(14).text('Scan Report\n\n\n', { align: 'center' });
    report.forEach(item => {
        doc.fontSize(10);
        doc.font('Helvetica-Bold').text('Arquivo: ', { continued: true });
        doc.font('Helvetica').text(item.file, { continued: true });
        doc.font('Helvetica-Bold').text(', Linha: ', { continued: true });
        doc.font('Helvetica').text(item.line.toString(), { continued: true });
        doc.font('Helvetica-Bold').text(', Ocorrencia: ', { continued: true });
        doc.font('Helvetica').text(item.occurrence);
        doc.moveTo(doc.page.margins.left, doc.y + 5)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y + 5)
            .stroke();
        doc.moveDown(1);
    });
    doc.end();
    vscode.window.showInformationMessage(`Report generated at ${filePath}`);
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map