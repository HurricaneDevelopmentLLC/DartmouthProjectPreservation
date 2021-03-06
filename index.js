'use strict'
var Promise = require('bluebird');
var XMLManager = require('./XMLManager.js');
var html = require('html');

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
		'regmatch': /^korc/,
		'sections': [
			{
				'row': /^[a-z]$/
			}
		],
		'statics': [
			'korczyna-row-tables',
			'korczyna-media'
		]
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
			,
			{
				'adj': /^\d+$/
			}
		],
		'statics': [
			'yurburg-adjacent-cemetery',
			'yurburg-maps',
			'yurburg-maps-a-b-c-d',
			'yurburg-maps-e-f',
			'yurburg-maps-g-h',
			'yurburg-photos'
		]
	},
	'sosnitsa': {
		'year': '2009',
		'regmatch': /^sosn/
	},
	'prishtina': {
		'year': '2011',
		'regmatch': /^prishtina/
	},
	'sanok': {
		'year': '2010',
		'regmatch': /^sanok/
	},
	'druzhkapol': {
		'year': '2006',
		'regmatch': /^druzhkapol/
	},
	'lunna': {
		'year': '2005',
		'regmatch': /^lunna/
	},
	'kamenka': {
		'year': '2004',
		'regmatch': /^kamenka/
	},
	'indura': {
		'year': '2003',
		'regmatch': /^indura/
	},
	'sopotskin': {
		'year': '2002',
		'regmatch': /^sopotskin/
	},
	'ustryzyki': {
		'year': '2013',
		'regmatch': /^ustryzyki/
	}
};

const globalStaticPages = [
	'support',
	'contact',
	'home',
	'about',
	'support-us',
	'our-journey'
];

const simplePages = false;

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

var nameFromArray = (arr) => {
	var name ='';

	for (var comp in arr)
		if (comp !== '')
			name += comp;

	return name.substring(0,name.length - 1);
}

XMLManager.ImportXML().then((jsonData) => {
	var pagesRaw = jsonData.rss.channel[0].item;
	var numPages = pagesRaw.length;

	var getPageFromTitle = (name) => {
		for (var i = pagesRaw.length - 1; i >= 0; i--) {
			if (pagesRaw[i]['wp:post_name'] == name) {
				return pagesRaw[i];
			}
		}
	};

	var generateNewHTMLContent = (obj) => {
		for (var child in obj) {
			if (typeof obj[child] === 'object') {
				if (child === 'subpages') {
					var secMasPg = getPageFromTitle(obj.sectionMasterPageName);
					secMasPg = (typeof secMasPg === 'object') ? secMasPg['content:encoded'][0] : '';
					secMasPg = secMasPg.replace(/\[caption( \w+=("|')\S*("|'))*\](<a[\sa-zA-Z0-9="'\/\-]*>)(<img[\sa-zA-Z0-9="'\/\-\:\.\?\_,&+]*>)<\/a>([\sa-zA-Z0-9\.,&+]*)\[\/caption\]/g,'$4<div class="img">$5</div><div class="caption">$6</div></a>');
					secMasPg = secMasPg.replace(/<a href=('|")\/([a-zA-Z0-9\-]+)\1 ?>/g,'<a href=$1#$2$1>');

					// No Images
					secMasPg = secMasPg.replace(/<p class="text-align-center">(&nbsp;|<br>)?(<a href="#">[a-zA-Z0-9\s]+<\/a>)?(&nbsp;|<br>)?<\/p>/ig,'');
					secMasPg = secMasPg.replace(/<p class="text-align-center">(<a href="#">&nbsp;<\/a>|<br>|&nbsp;)?<a href="(#korczyna-([a-zA-Z0-9]+))">[a-zA-Z0-9\s]+<\/a>(<a href="#">&nbsp;<\/a>|<br>)?(&nbsp;)?<\/p>/ig,'<a href="$2"><div class="noimg-item"><span class="noimg">No Image</span><span class="noimg-title">' + '$3'.toUpperCase() + '</span></div></a>');

					obj.newHTMLContent += '<div id="section-header">' + secMasPg + '</div><div id="section-pages">';

					for (var page in obj.subpages) {
						obj.newHTMLContent += "\n<!-- START PAGE " + page + " -->\n\n<div class='seperator' id='" + obj.subpages[page].pageid + "'></div><div class='page'>";
						obj.newHTMLContent += getPageFromTitle(obj.subpages[page].pageid)['content:encoded'];
						obj.newHTMLContent += "</div>\n\n<!-- STOP PAGE " + page + " -->";
					}

					obj.newHTMLContent += '</div>';
				} else {
					generateNewHTMLContent(obj[child]);
				}
			}
		}
	};


	var generateXML = (objOriginal) => {
		var generateXMLRecurs = (obj) => {
			for (var child in obj) {
				if (typeof obj[child] === 'object') {
					
					if (child === 'subpages' && /yurburg-adjacent-cemetery*/.test(obj.sectionMasterPageName)) {
						//console.log(obj.sectionMasterPageName);

						var newName = "";
						var arr = obj.sectionMasterPageName.split('-');
						for (var i = 0; i < arr.length; i++)
							newName += arr[i].substring(0, 1).toUpperCase() + arr[i].substring(1) + " ";
						newName = newName.substring(0, newName.length - 1);
						
						importXML += "\t<item>\n";
						importXML += "\t\t<link>/" + obj.sectionMasterPageName + "/</link>\n";
						importXML += "\t\t<title>" + newName + "</title>\n";
						importXML += "\t\t<content:encoded>\n";
						importXML += "<![CDATA[" + obj.newHTMLContent + "]]>";
						importXML += "\t\t</content:encoded>\n";
						importXML += "\t\t<wp:post_name>" + obj.sectionMasterPageName + "</wp:post_name>\n";
						importXML += "\t\t<wp:post_type>page</wp:post_type>\n";
						importXML += "\t\t<wp:status>publish</wp:status>\n";
						importXML += "\t</item>\n";
					} else {
						generateXMLRecurs(obj[child]);
					}
				}
			}
		}

		var importXML = "";
		importXML += '<?xml version="1.0" encoding="UTF-8"?><rss xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/"><channel>';
		generateXMLRecurs(objOriginal);
		importXML += "</channel></rss>";
		return importXML;
	}
	

	var uncaptured = [];

	var cPages = 0;

	var pages = {};

	for (var i = pagesRaw.length - 1; i >= 0; i--) {
		var name = pagesRaw[i]['wp:post_name'][0];
		var arrName = name;
		arrName = arrName.split('-');

		var cemetery = matchCemetery(arrName[0]);

		 // Capture Squarespace Static URLS
		if (typeof pagesRaw[i]['wp:attachment_url'] !== 'undefined' && /^http:\/\/static1\.squarespace\.com\/static\//.test(pagesRaw[i]['wp:attachment_url'])) {
			cPages++;
			continue;
		// Capture Static Pages
		} else if (globalStaticPages.indexOf(name) > -1) {
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

			// Capture Cemetery Specific Static Pages
			if (typeof cemeteries[cemetery].statics !== 'undefined' && cemeteries[cemetery].statics.indexOf(name) > -1) {
				cPages++;
				continue;
			}

		// Capture all that don't start with a cemetery. Add to 'Uncaptured' list.
		} else if (cemetery === null) {
			uncaptured[name] = pagesRaw[i]['title'][0];
			continue;
		}

		cPages++;
		if (typeof pages[cemetery] === 'undefined')
			pages[cemetery] = {};

		/* Manage specific cemeteries */
		// Manage Ioannina
		if (cemetery === 'ioannina') {
			if (/^[a-z]+/.test(arrName[1])) {
				var matches = arrName[1].match(/^([a-z]+)(\d+)$/) || [];
				if (typeof pages[cemetery]['quad'] === 'undefined')
					pages[cemetery]['quad'] = {};
				if (typeof pages[cemetery]['quad']['a'] === 'undefined')
					pages[cemetery]['quad']['a'] = {};
				if (typeof pages[cemetery]['quad']['a']['row'] === 'undefined')
					pages[cemetery]['quad']['a']['row'] = {};
				if (typeof pages[cemetery]['quad']['a']['row'][matches[1]] === 'undefined') {
					if (!simplePages) {
						pages[cemetery]['quad']['a']['row'][matches[1]] = {};
						pages[cemetery]['quad']['a']['row'][matches[1]].subpages = {};
						pages[cemetery]['quad']['a']['row'][matches[1]].newHTMLContent = '';
						pages[cemetery]['quad']['a']['row'][matches[1]].sectionMasterPageName = 'ioannina-quad-a-row-' + matches[1];
					} else {
						pages[cemetery]['quad']['a']['row'][matches[1]] = [];
					}
				}

				if (!simplePages)
					pages[cemetery]['quad']['a']['row'][matches[1]].subpages[matches[2]] = {
						aid: arrName[2] || '',
						pageid: name
					};
				else
					pages[cemetery]['quad']['a']['row'][matches[1]].push(matches[2]);
			} else {
				uncaptured.push(name);
			}
		// Manage Korczyna
		} else if (cemetery == 'korczyna') {
			if (/^[a-z]+\d+[a-z]?$/.test(arrName[1])) {
				var matches = arrName[1].match(/^([a-z]+)(\d+[a-z]?)$/) || [];
				if (typeof pages[cemetery]['row'] === 'undefined')
					pages[cemetery]['row'] = {};
				if (typeof pages[cemetery]['row'][matches[1]] === 'undefined') {
					if (!simplePages) {
						pages[cemetery]['row'][matches[1]] = {};
						pages[cemetery]['row'][matches[1]].subpages = {};
						pages[cemetery]['row'][matches[1]].newHTMLContent = '';
						pages[cemetery]['row'][matches[1]].sectionMasterPageName = 'korczyna-row-' + matches[1];
					} else {
						pages[cemetery]['row'][matches[1]] = [];
					}
				}

				if (!simplePages)
					pages[cemetery]['row'][matches[1]].subpages[matches[2]] = {
						pageid: name
					};
				else
					pages[cemetery]['row'][matches[1]].push(matches[2]);
				
			} else {
				uncaptured.push(name);
			}
		// Manage Yurburg
		} else if (cemetery == 'yurburg') {
			if (/^[a-z]+\d+[a-z]?$/.test(arrName[1])) {
				var matches = arrName[1].match(/^([a-z]+)(\d+[a-z]?)$/) || [];
				var row = pagesRaw[i]['content:encoded'][0].match(/>.*Row (\d*).*</) || [];
				if (typeof pages[cemetery]['section'] === 'undefined')
					pages[cemetery]['section'] = {};
				if (typeof pages[cemetery]['section'][matches[1]] === 'undefined')
					pages[cemetery]['section'][matches[1]] = {};
				if (typeof pages[cemetery]['section'][matches[1]]['row'] === 'undefined')
					pages[cemetery]['section'][matches[1]]['row'] = {};
				if (typeof pages[cemetery]['section'][matches[1]]['row'][row[1]] === 'undefined') {
					if (!simplePages) {
						pages[cemetery]['section'][matches[1]]['row'][row[1]] = {};
						pages[cemetery]['section'][matches[1]]['row'][row[1]].subpages = {};
						pages[cemetery]['section'][matches[1]]['row'][row[1]].newHTMLContent = '';
						pages[cemetery]['section'][matches[1]]['row'][row[1]].sectionMasterPageName = 'yurburg-section-' + matches[1] + '-row-' + row[1];
					} else {
						pages[cemetery]['section'][matches[1]]['row'][row[1]] = [];
					}
				}

				if (!simplePages)
					pages[cemetery]['section'][matches[1]]['row'][row[1]].subpages[matches[2]] = {
						pageid: name
					};
				else
					pages[cemetery]['section'][matches[1]]['row'][row[1]].push(matches[2]);
			} else {
				uncaptured.push(name);
			}
		}
	}

	 generateNewHTMLContent(pages);

	if (false) {
		generateXML(pages);
		console.log(DumpObjectIndented(pages, "  ",5));
	} else {
		console.log(generateXML(pages));
	}
});

var DumpObjectIndented = (uO, indent, max, depth) => {
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