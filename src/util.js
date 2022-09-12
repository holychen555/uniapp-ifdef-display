const vscode = require('vscode');
const XRegExp = require("xregexp");
const window = vscode.window;
const workspace = vscode.workspace;
const htmlRule = {
	start: "[ \t]*<!--[ \t]*#(ifndef|ifdef|if)[ \t]+(.*?)[ \t]*(?:-->|!>)(?:[ \t]*\n+)?",
	end: "[ \t]*<!(?:--)?[ \t]*#endif[ \t]*(?:-->|!>)(?:[ \t]*\n)?",
};
const scriptOrStyleRule = {
	start: "[ \t]*(?://|/\\*)[ \t]*#(ifndef|ifdef|if)[ \t]+([^\n*]*)(?:\\*(?:\\*|/))?(?:[ \t]*\n+)?",
	end: "[ \t]*(?://|/\\*)[ \t]*#endif[ \t]*(?:\\*(?:\\*|/))?(?:[ \t]*\n)?",
};

const updateHasIfDef = function (globalState) {
    let activeEditor = window.activeTextEditor;
    if (!activeEditor || !activeEditor.document) {
        return;
    }
    let text = activeEditor.document.getText();
    if(/#ifdef|#ifndef/.test(text)) {
        globalState.update("hasIfDef", true);
        vscode.commands.executeCommand('setContext', 'hasIfDef', true);
    } else {
        globalState.update("hasIfDef", false);
        vscode.commands.executeCommand('setContext', 'hasIfDef', false);
    }
}

const getConfig = function(key) {
    let settings = workspace.getConfiguration('ifdefdisplay');
    return settings.get(key);
}

const setConfig = function(key, value) {
    let settings = workspace.getConfiguration('ifdefdisplay');
    return settings.update(key, value, true);
}

const showQuickPick = async function() {
    const result = await window.showQuickPick(['MP-WEIXIN','MP-BAIDU','MP-TOUTIAO','MP-ALIPAY','MP-KUAISHOU','MP','MP-LARK','MP-QQ','MP-JD','MP-360','QUICKAPP-WEBVIEW','QUICKAPP-WEBVIEW-UNION','QUICKAPP-WEBVIEW-HUAWEI','VUE3', 'APP-PLUS', 'APP-NVUE','H5'], {
		placeHolder: '请选择%PLATFORM%',
        canPickMany: true
	});
    setConfig("platformArr", result);
}

const updateStatusItemBar = function(statusItemBar, globalState) {
    let hasIfDef = globalState.get("hasIfDef", false);
    if(getConfig('isEnable') && hasIfDef) {
        let platformArr = getConfig("platformArr");
        if(platformArr.length == 0) {
            statusItemBar.hide();
            return;
        }
        statusItemBar.text = "当前%PLATFORM%：" + platformArr.join(" ");
        statusItemBar.show();
    } else {
        statusItemBar.hide();
    }
}

const getFoldingRangeList = function(document, rule) {
    let foldingRangeArr = [];
    let content = document.getText();
    function getFolding(content, startOrigin = 0) {
        let matches = XRegExp.matchRecursive(
            content,
            rule.start,
            rule.end,
            "gmi",
            {
                valueNames: [null, "left", "match", "right"],
            }
        );
        let start;
        matches.forEach(function (match) {
            switch (match.name) {
                case "left":
                    start = document.positionAt(match.start + startOrigin);
                    break;
                case "match":
                    match.start = match.start + startOrigin;
                    match.end = match.end + startOrigin;
                    getFolding(match.value, match.start);
                    break;
                case "right":
                    let end = document.positionAt(match.start + startOrigin);
                    foldingRangeArr.push(new vscode.FoldingRange(start.line, end.line));
                    break;
            }
        });
    }
    getFolding(content, 0);
    return foldingRangeArr;
}

module.exports = {
    htmlRule,
    scriptOrStyleRule,
    updateHasIfDef,
    getConfig,
    showQuickPick,
    updateStatusItemBar,
    getFoldingRangeList
};
