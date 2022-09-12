const assert = require("assert");
const fs = require("fs");
const vscode = require('vscode');
const { join, basename } = require("path");
const { preprocess } = require("../../src/preprocess.js");
const { getFoldingRangeList, htmlRule, scriptOrStyleRule } = require("../../src/util.js");

function testFileDecorations(filepath, done) {
    let filename = basename(filepath);
    let extName = /[^\.]\w*$/.exec(filename);
    let testFileData = fs.readFileSync(filepath, "utf8");
    let data1 = preprocess(testFileData, extName == 'html' ? htmlRule : scriptOrStyleRule, { "MP-WEIXIN": true });
    let data2 = preprocess(testFileData, extName == 'html' ? htmlRule : scriptOrStyleRule, { "MP-BAIDU": true });
    let data3 = preprocess(testFileData, extName == 'html' ? htmlRule : scriptOrStyleRule, { "MP-WEIXIN": true, "MP-BAIDU": true });
    let result1 = data1.text.replace(/(\s|[\r\n])/g,"");
    let result2 = data2.text.replace(/(\s|[\r\n])/g,"");
    let result3 = data3.text.replace(/(\s|[\r\n])/g,"");
    assert.strictEqual(result1, "1245");
    assert.strictEqual(result2, "1346");
    assert.strictEqual(result3, "123456");
    done();
}

async function testFileRanges(filepath, done) {
    let uri = vscode.Uri.file(filepath);
    await vscode.commands.executeCommand('vscode.open', uri);
    let document = vscode.window.activeTextEditor.document;
    let filename = basename(filepath);
    let extName = /[^\.]\w*$/.exec(filename);
    let rangeList = getFoldingRangeList(document, extName == 'html' ? htmlRule : scriptOrStyleRule);
    rangeList = rangeList.map(item => {return {start: item.start,end: item.end}})
    assert.deepStrictEqual(rangeList, [
        { start: 2, end: 4 },
        { start: 5, end: 7 },
        { start: 0, end: 8 },
        { start: 11, end: 13 },
        { start: 14, end: 16 },
        { start: 9, end: 17 }
      ])
    done();
}

suite("Extension Test Suite", () => {
	let extensionTestPath = join(__dirname, "files");
	if (fs.existsSync(extensionTestPath)) {
		let files = fs.readdirSync(extensionTestPath);
        files.forEach((filename) => {
            test("Test " + filename + " decorations", function (done) {
                testFileDecorations(join(extensionTestPath, filename), done);
            });
            test("Test " + filename + " folding ranges", function (done) {
                testFileRanges(join(extensionTestPath, filename), done);
            });
        });
	}
});
