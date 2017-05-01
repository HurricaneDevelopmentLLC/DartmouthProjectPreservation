'use strict';
var Promise = require('bluebird');
var fs = require('fs');
var xml2js = require('xml2js');

const DefaultXMLFilename = "SquarespaceWordpressXML.xml";

var parser = new xml2js.Parser();

module.exports = {
	ImportXML: (filename) => new Promise((resolve,reject) => {
		if (!filename)
			filename = DefaultXMLFilename;

		fs.readFile(filename, (err,data) => {
			parser.parseString(data,(err,jsonData) => {
				resolve(jsonData);
			})
		});
	}),
	ExportXML: (filename) => {

	}
};