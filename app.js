var basicAuth = require('basic-auth'),
	bodyParser = require('body-parser'),
	conf = require('./conf'),
	express = require('express'),
	getStreams = require('./getStreams'),
	nib = require('nib'),
	path = require('path'),
	stylus = require('stylus');

var app = module.exports = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(stylus.middleware({
	dest: path.join(__dirname, 'generated'),
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
app.use(express.static(path.join(__dirname, 'generated')));

getStreams(function(streams) {
	function pickStreams(options, callback) {
		var id, stream;
		options = options || {};
		
		var nStreams = options.n;
		if (isNaN(nStreams))
			nStreams = conf.defaultStreamCount;
		else
			nStreams = Math.floor(nStreams);
			
		var chosenStreams = options.chosen;
		if (typeof chosenStreams !== 'object') {
			if (options.hasOwnProperty('id'))
				chosenStreams = [options.id];
			else
				chosenStreams = [];
		}
		
		var previousStreams = options.previous;
		if (typeof previousStreams !== 'object')
			previousStreams = [];
		
		var availableStreamCount = streams.online;
		var availableStreams = streams.slice(0); // clone
		
		chosenStreams.forEach(function(id) {
			availableStreams[id] = null;
		});
		
		if (previousStreams.length + nStreams - chosenStreams.length <= streams.online)
			previousStreams.forEach(function(id) {
				var stream = availableStreams[id];
				if (stream && stream.online) {
					availableStreams[id] = null;
					--availableStreamCount;
				}
			});
		
		if (nStreams > availableStreamCount)
			nStreams = availableStreamCount;
			
		while (chosenStreams.length < nStreams) {
			id = Math.floor(Math.random() * streams.length);
			var stream = availableStreams[id];
			if (stream && stream.online) {
				chosenStreams.push(id);
				availableStreams[id] = null;
			}
		}
		
		var results = [];
		chosenStreams.forEach(function(id) {
			var stream = streams[id];
			if (stream)
				results.push({
					id: id,
					name: stream.name,
					code: stream.code
				});
		});
		callback(results);
	}
	
	app.get('/', function(req, res) {
		pickStreams(req.query, function(streams) {
			if (streams.length)
				res.render('index', {
					interval: conf.interval,
					lock: req.query.hasOwnProperty('id'),
					streams: streams,
					titleSuffix: conf.siteName || ''
				});
			else
				res.render('offline', {
					interval: conf.interval,
					title: conf.siteName
				});
		});
	});
	
	app.get('/get.json', function(req, res) {
		res.header('Content-type', 'application/json');
		pickStreams(req.query, function(streams) {
			res.send(JSON.stringify(streams));
		});
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
	
	if (typeof conf.streams === 'string') {
		var adminRouter = express.Router();
		
		adminRouter.use(function(req, res, next) {
			if (!conf.adminUser) {
				req.rights = ['add', 'remove'];
				return next();
			}
			
			function authenticate() {
				res.set('WWW-Authenticate', 'Basic realm="Admin - ' + conf.siteName + '"');
				res.send(401);
			}
			
			var user = basicAuth(req);
			if (!user)
				return authenticate();
			
			function check(desc) {
				if (user.name === desc.name && user.pass === desc.pass) {
					req.rights = desc.rights;
					return true;
				}
			}
			
			var valid = Array.isArray(conf.adminUser) ? conf.adminUser.some(check) : check(conf.adminUser);
			if (valid)
				next();
			else
				authenticate();
		});
		
		adminRouter.use(bodyParser.urlencoded({
			extended: false
		}));
		
		adminRouter.post('/', function(req, res) {
			if (req.rights.indexOf('add') !== -1)
				streams.add(req.body, function(err) {
					if (err)
						return res.send(500);
					
					res.redirect(conf.adminPath);
				});
			else
				res.send(401);
		});
		
		adminRouter.get('/:index', function(req, res) {
			if (req.rights.indexOf('remove') !== -1)
				streams.remove(req.params.index, function(err) {
					if (err)
						return res.send(500);
					
					res.redirect(conf.adminPath);
				});
			else
				res.send(401);
		});
		
		adminRouter.use(function(req, res) {
			res.render('admin', {
				canAdd: req.rights.indexOf('add') !== -1,
				canRemove: req.rights.indexOf('remove') !== -1,
				streams: streams,
				title: 'Admin - ' + conf.siteName
			});
		});
		
		app.use(conf.adminPath, adminRouter);
	}
	
	if (require.main === module)
		app.listen(app.get('port'), function(){
			console.log('Rollstreams server listening on port %d in %s mode', app.get('port'), app.get('env'));
		});
});
