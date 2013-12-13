var conf = require('./conf'),
	express = require('express'),
	http = require('http'),
	lib = require('./lib'),
	nib = require('nib'),
	path = require('path'),
	stylus = require('stylus');

var app = module.exports = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(stylus.middleware({
	src: __dirname + '/public',
	compile: function(str, path) {
		return stylus(str)
			.set('filename', path)
			.set('compress', true)
			.use(nib())
			.import('nib');
	}
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.favicon());

if (app.get('env') == 'development')
	app.use(express.logger('dev'));
	
app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(app.router);

if (app.get('env') == 'development')
	app.use(express.errorHandler());

lib.initStreams(conf.streams, function(streams, online) {
	var onlineStreams = online;
	
	setInterval(function() {
		lib.updateStreams(streams, function(online) {
			onlineStreams = online;
		});
	}, conf.updateInterval * 1000);
	
	function getStream(options, callback) {
		var id, stream;
		options = options || {};
		if (!options.hasOwnProperty('id')) {
			do {
				id = Math.floor(Math.random() * streams.length);
				stream = streams[id];
			} while (!stream || !stream.online || (onlineStreams > 1 && options.hasOwnProperty('except') && id == options.except));
		} else {
			id = options.id;
			stream = streams[id];
		}
		
		callback(stream && {
			id: id,
			name: stream.name,
			code: stream.code
		});
	}
	
	app.get('/', function(req, res) {
		getStream(req.query, function(stream) {
			res.render('index', {
				code: stream.code,
				id: stream.id,
				interval: conf.interval,
				lock: req.query.hasOwnProperty('id'),
				name: stream.name,
				title: stream.name + (conf.siteName ? (' - ' + conf.siteName) : ''),
				titleSuffix: conf.siteName || ''
			});
		});
	});
	
	app.get('/stream.json', function(req, res) {
		res.header('Content-type', 'application/json');
		if (onlineStreams > 0) {
			var stream = getStream(req.query, function(stream) {
				res.send(JSON.stringify(stream));
			});
		} else
			res.send(null);
	});

	app.get('/streams', function(req, res) {
		res.render('streams', {
			streams: streams,
			title: conf.siteName
		});
	});

	app.get('/streams.json', function(req, res) {
		res.header('Content-type', 'application/json');
		res.send(streams.map(function(stream) {
			if (stream.online)
				return stream.name;
			return null;
		}));
	});

	http.createServer(app).listen(app.get('port'), function(){
		console.log('Rollstreams server listening on port %d in %s mode', app.get('port'), app.get('env'));
	});
});
