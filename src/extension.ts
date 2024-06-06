import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

export function activate(context: vscode.ExtensionContext) {
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

const ignoredDirectories = [
    'node_modules',
    'bower_components',
    'vendor',
    'dist',
    'build',
    'libs',
    'lib'
];

function scanDirectory(dir: string): { file: string, line: number, occurrence: string }[] {
    const report: { file: string; line: number; occurrence: string; }[] = [];
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!ignoredDirectories.includes(file)) {
                report.push(...scanDirectory(filePath));
            }
        } else if (filePath.endsWith('.php') || filePath.endsWith('.js')) {
            const content = fs.readFileSync(filePath, 'utf8');
            report.push(...scanFile(content, filePath));
        }
    });

    return report;
}

function scanFile(content: string, filePath: string): { file: string, line: number, occurrence: string }[] {
    const report: { file: string; line: number; occurrence: string; }[] = [];
    const lines = content.split('\n');
    const includeSet = new Set<string>(); 
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
                    } else {
                        includeSet.add(includePath);
                    }
                } else {
                    report.push({ file: filePath, line: index + 1, occurrence: line.trim() });
                }
            }
        });
    });

    return report;
}

function generatePDFReport(report: { file: string, line: number, occurrence: string }[]) {
    const doc = new PDFDocument({ layout: 'landscape' });  
    const filePath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'report.pdf');
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

export function deactivate() {}
