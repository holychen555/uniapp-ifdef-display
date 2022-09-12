const XRegExp = require("xregexp");

function replaceRecursive(rv, rule, processor) {
	if (!rule.start || !rule.end) {
		throw new Error("Recursive rule must have start and end.");
	}

	let startRegex = new RegExp(rule.start, "mi");
	let endRegex = new RegExp(rule.end, "mi");
	function matchReplacePass(content, startOrigin = 0) {
		let matches = XRegExp.matchRecursive(
			content,
			rule.start,
			rule.end,
			"gmi",
			{
				valueNames: ["between", "left", "match", "right"],
			}
		);

		let matchGroup = {
			left: null,
			match: null,
			right: null,
		};

		return matches.reduce(function (builder, match) {
			switch (match.name) {
				case "between":
					builder += match.value;
					break;
				case "left":
					matchGroup.left = startRegex.exec(match.value);
					break;
				case "match":
                    match.start = match.start + startOrigin;
                    match.end = match.end + startOrigin;
					matchGroup.match = match;
					break;
				case "right":
					matchGroup.right = endRegex.exec(match.value);
					builder += processor(
						matchGroup.left,
						matchGroup.right,
						matchGroup.match,
						matchReplacePass
					);
					break;
			}
			return builder;
		}, "");
	}

	return matchReplacePass(rv);
}

function testPasses(obj, propPath) {
	let res = false, match;
	let reg = /[A-Z\d]+(?:-[A-Z\d]+|)/g;
	let platformSet = new Set();
	while ((match = reg.exec(propPath))) {
		platformSet.add(match[0]);
	}
	Object.entries(obj).forEach(([platform, value]) => {
		if (value && platformSet.has(platform)) {
			res = true;
			return;
		}
	});
	return res;
}

function preprocess(content, rule, context) {
	const matchArr = [];
	const processor = function (startMatches, endMatches, include, recurse) {
		let variant = startMatches[1];
		let test = (startMatches[2] || "").trim();
		let pass = testPasses(context, test);
		switch (variant) {
			case "ifdef":
				if (pass) {
					return recurse(include.value, include.start);
				} else {
                    if (include.value.indexOf("#if") < 0) {
						matchArr.push(include);
					}
					return "\n\n";
				}
			case "ifndef":
				if (!pass) {
					return recurse(include.value, include.start);
				} else {
                    if (include.value.indexOf("#if") < 0) {
						matchArr.push(include);
					} else {
                        return recurse(include.value, include.start);
                    }
					return "\n\n";
				}
			default:
				throw new Error("Unknown if variant " + variant + ".");
		}
	};
	const res = replaceRecursive(content, rule, processor);
	return {
		text: res,
		matchArr: matchArr,
	};
}

module.exports = {
	preprocess,
};
