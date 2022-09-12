const vscode = require('vscode');
const util = require('./util');
const { preprocess } = require("./preprocess");
const window = vscode.window;
const workspace = vscode.workspace;
const { htmlRule, scriptOrStyleRule } = require('./util.js');

function activate(context) {
    let { subscriptions, globalState } = context;
    let timeout = null;
    let activeEditor = window.activeTextEditor;
    let decoration, folding;
    
    const statusBarItem = window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000000);
    subscriptions.push(statusBarItem);

    subscriptions.push(vscode.commands.registerCommand('ifdefdisplay.showQuickPick', async function () {
        util.showQuickPick();
    }));

    if (activeEditor) {
        init();
    }

    window.onDidChangeActiveTextEditor(function (editor) {
        activeEditor = editor;
        if (editor) {
            init();
        }
    }, null, subscriptions);

    workspace.onDidChangeTextDocument(function (event) {
        if (activeEditor && event.document === activeEditor.document) {
            init();
        }
    }, null, subscriptions);

    workspace.onDidChangeConfiguration(function () {
        init();
    }, null, subscriptions);

    function init() {
        timeout && clearTimeout(timeout);
        timeout = setTimeout(function() {
            util.updateHasIfDef(globalState);
            if (!util.getConfig('isEnable')) return;
            util.updateStatusItemBar(statusBarItem, globalState);
            updateFolding();
            updateDecorations();
        }, 0);
    };

    function updateDecorations() {
        try {
            decoration && decoration.dispose();
            if (!util.getConfig('isEnable')) return;
            let platformArr = util.getConfig('platformArr') || [];
            if(platformArr.length == 0) {
                return;
            }
            if (!activeEditor || !activeEditor.document) {
                return;
            }
            let content = activeEditor.document.getText();
            let context = {};
            let decorationType = {
                text: "platform",
                dark: {
                    color: util.getConfig("darkColor") || "#333"
                },
                light: {
                    color: util.getConfig("lightColor") || "#ddd"
                },
                backgroundColor: 'transparent',
                overviewRulerLane: vscode.OverviewRulerLane.Right
            };
            decoration = window.createTextEditorDecorationType(decorationType);
            
            platformArr.forEach(platform => {
                context[platform] = true;
            })
            let htmlMatch = preprocess(content, htmlRule, context);
            let scriptMatch = preprocess(content, scriptOrStyleRule, context);
            let rangeArr = [];
            htmlMatch.matchArr.forEach(match => {
                let startPos = activeEditor.document.positionAt(match.start);
                let endPos = activeEditor.document.positionAt(match.end);
                rangeArr.push({
                    range: new vscode.Range(startPos, endPos)
                });
            })
            scriptMatch.matchArr.forEach(match => {
                let startPos = activeEditor.document.positionAt(match.start);
                let endPos = activeEditor.document.positionAt(match.end);
                rangeArr.push({
                    range: new vscode.Range(startPos, endPos)
                });
            })
            activeEditor.setDecorations(decoration, rangeArr);
        } catch(e) {
            console.log(e.name + ': ' + e.message)
        }
        
    }

    function updateFolding() {
        folding && folding.dispose();
        if (!util.getConfig('isEnable')) return;
        let foldingRangeProvider =  {
            provideFoldingRanges() {
                let foldingRangeArr = [];
                const document = window.activeTextEditor.document;
                foldingRangeArr = foldingRangeArr.concat(util.getFoldingRangeList(document, htmlRule));
                foldingRangeArr = foldingRangeArr.concat(util.getFoldingRangeList(document, scriptOrStyleRule));
                return foldingRangeArr
            }
        }
        folding = vscode.languages.registerFoldingRangeProvider({ pattern: '**', scheme: 'file' }, foldingRangeProvider)
        subscriptions.push(folding);
    }

}

exports.activate = activate;
