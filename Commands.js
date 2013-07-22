//REQUIRES
var minimist = require('minimist');
var Analytics = require('./analytics');
var mtd = require('mt-downloader');
var f = require('./Formaters');
var Package = require('./Package.json');
var _ = require('underscore');
var Db = require('./Db');

var log = console.log;

//OBJECTS
var analytics = new Analytics();
var store = new Db('config.db');

var Commands = function() {};

var _auto_name = function(url, callback) {

	var _name = function(url) {
		return _.reduce(['&', '/', '='], function(memo, item) {
			var _url = decodeURI(memo).split(item);
			return _url[_url.length - 1];
		}, url);
	};

	var name = _name(url);
	store.get('wd', function(val) {
		callback(val + name);
	});

};

var _show_help = function() {
	console.log('To know more visit [https://github.com/tusharmath/mtd-console]');
};

var _set_wd = function(args) {
	store.save('wd', args['set-wd'], function() {
		console.log('Working directory updated:', args['set-wd']);
	});
};

var _clear_wd = function() {
	store.remove('wd', function() {
		console.log('Working directory cleared.');
	});
};

var _wd = function() {
	store.get('wd', function(value) {
		if (value) console.log('Working directory:', value);
		console.log('Set working directory using [--set-wd]');
	});
};

var _start_download = function(args) {

	args.onStart = function(data) {

		console.log('Size:', f.byteFormater(data.size));
		analytics.start(data.threads);

	};

	args.onEnd = function(err, data) {
		analytics.stop();
		if (err) console.error(err);
		else console.log('Downloaded');
	};
	if (args['auto-name'] === true) {
		_auto_name(args.url, function(file) {
			args.file = file;
			var downloader = new mtd(file, args.url, args);
			downloader.start();
			console.log('File:', args.file);
		});
	} else store.get('wd', function(value) {
		args.file = value + args.file;
		var downloader = new mtd(args.file, args.url, args);
		downloader.start();
		console.log('File:', args.file);
	});


};

var _show_version = function() {
	log('Version:', Package.version);
};

var _get_action = function(args) {
	if (args['url'] || args['file']) return _start_download;
	if (args['set-wd']) return _set_wd;
	if (args['clear-wd']) return _clear_wd;
	if (args['wd']) return _wd;
	if (args['version']) return _show_version;
	if (args['help']) return _show_help;
	return _show_help;
};

Commands.prototype.execute = function(argv) {
	this.args = minimist(argv.slice(2));
	var action = _get_action(this.args);
	action(this.args);
};

module.exports = Commands;