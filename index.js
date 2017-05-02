'use strict'
var Promise = require('bluebird');
var XMLManager = require('./XMLManager.js');

const cemeteries = {
	'ioannina': {
		'year': '2016',
		'regmatch': /^ioan/,
		'sections': [
			{
				'quad': /^[a-z]$/,
				'row': /^[a-z]$/
			}
		]
	},
	'lutowiska': {
		'year': '2014',
		'regmatch': /^lutowiska/
	},
	'korczyna': {
		'year': '2012',
		'regmatch': /^korc/
	},
	'yurburg': {
		'year': '2007',
		'regmatch': /^yurburg/,
		'sections': [
			{
				'section': /^[a-z]$/,
				'row': /^\d+$/
			},
			{
				'section': /^[a-z]$/
			}
		]
	},
	'sosnitsa': {
		'year': '2009',
		'regmatch': /^sosn/
	}
};

const globalStaticPages = [
	'support',
	'contact',
	'home',
	'about',
	'support-us'
];

var matchCemetery = (name) => {
	for (var cemetery in cemeteries) {
		if (cemeteries[cemetery].regmatch.test(name)) {
			return cemetery;
		}
	}

	return null;
};

var matchSection = (cemetery, arrName) => {
	if (typeof cemeteries[cemetery].sections === 'undefined' || cemeteries[cemetery].sections.length < 1)
		return [];

	for (var s = 0;s < cemeteries[cemetery].sections.length;s++) {
		var groups = [];

		for (var i = 0;i < arrName.length / 2;i++) {
			if (typeof cemeteries[cemetery].sections[s][arrName[2 * i]] !== 'undefined' && cemeteries[cemetery].sections[s][arrName[2 * i]].test(arrName[2 * i + 1]))
				groups.push(arrName[2 * i + 1]);
		}

		if (groups.length == Object.keys(cemeteries[cemetery].sections[s]).length)
			return groups
	}

	return [];
}

function DumpObjectIndented(uO, indent, max, depth) {
	const obj = {};
	Object.keys(uO).sort().forEach(function(key) {
	  obj[key] = uO[key];
	});

	var result = "";
	if (indent == null) indent = "";
	if (depth == null) depth = 1;
	if (max == null) max = -1;

	for (var property in obj) {
		var value = obj[property];

		if (typeof value == 'string') {
			value = "'" + value + "'";
		} else if (typeof value == 'object') {
			if (max != -1 && depth == max)
				value = Object.keys(value);

			if (value instanceof Array) {
				// Just let JS convert the Array to a string!
				value = value.sort((a,b) => {
					if (typeof a === 'number' && typeof b === 'number');
						return a-b;
				});
				value = "[ " + value + " ]";
			} else {
				// Recursive dump
				// (replace "  " by "\t" or something else if you prefer)
				var od = DumpObjectIndented(value, indent + "  ", max, depth + 1);
				// If you like { on the same line as the key
				//value = "{\n" + od + "\n" + indent + "}";
				// If you prefer { and } to be aligned
				value = "\n" + indent + "{\n" + od + "\n" + indent + "}";
			}
		}
		result += indent + "'" + property + "' : " + value + ",\n";
	}

	return result.replace(/,\n$/, "");
}

XMLManager.ImportXML().then((jsonData) => {
	var pagesRaw = jsonData.rss.channel[0].item;
	var numPages = pagesRaw.length;

	var uncaptured = [];

	var cPages = 0;

	var pages = {};

	for (var i = pagesRaw.length - 1; i >= 0; i--) {
		var arrName = pagesRaw[i]['wp:post_name'][0];
		arrName = arrName.split('-');

		var cemetery = matchCemetery(arrName[0]);

		 // Capture Squarespace Static URLS
		if (typeof pagesRaw[i]['wp:attachment_url'] !== 'undefined' && /^http:\/\/static1\.squarespace\.com\/static\//.test(pagesRaw[i]['wp:attachment_url'])) {
			cPages++;
			continue;
		// Capture Static Pages
		} else if (globalStaticPages.indexOf(pagesRaw[i]['wp:post_name'][0]) > -1) {
			cPages++;
			continue;
		// Capture Cemetery Items
		} else if (cemetery !== null) {
			// Capture Cemetery Landing Pages
			if (arrName.length == 2 && cemeteries[cemetery]['year'] == arrName[1]) {
				cPages++;
				continue;
			}

			var sectionGroups = matchSection(cemetery,arrName.slice(1));

			// Capture Cemetery Section Pages
			if (sectionGroups.length != 0 && sectionGroups.length == arrName.slice(1).length / 2) {
				cPages++;
				continue;
			}
		// Capture all that don't start with a cemetery. Add to 'Uncaptured' list.
		} else if (cemetery === null) {
			uncaptured[pagesRaw[i]['wp:post_name'][0]] = pagesRaw[i]['title'][0];
			continue;
		}
		
		var nuid = arrName[1].split('');

		if (isNaN(nuid[0]) && !isNaN(nuid[1])) {
			cPages++;
			if (typeof pages[cemetery] === 'undefined')
				pages[cemetery] = {};
			if (typeof pages[cemetery][nuid[0]] === 'undefined')
				pages[cemetery][nuid[0]] = {};
			pages[cemetery][nuid[0]][arrName[1].substring(1)] = pagesRaw[i]['content:encoded'];
		} else {
			uncaptured[pagesRaw[i]['wp:post_name'][0]] = pagesRaw[i]['title'][0];
		}
	}

	console.log(DumpObjectIndented(pages, "  ",2));

	console.log(DumpObjectIndented(uncaptured,"  "));

	console.log(cPages + " : " + (cPages + Object.keys(uncaptured).length) + " : " + numPages);
});

