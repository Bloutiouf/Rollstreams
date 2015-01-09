var basicAuth = require('basic-auth'),
	bodyParser = require('body-parser'),
	express = require('express'),
	getStreams = require('./getStreams'),
	nib = require('nib'),
	path = require('path'),
	stylus = require('stylus');

module.exports = function(config, callback) {
	getStreams(config, function(err, client) {
		if (err) return callback(err);
		
		var app = module.exports = express();

		app.set('port', config.express.port);
		app.set('views', path.join(__dirname, 'views'));
		app.set('view engine', 'jade');

		app.use(stylus.middleware({
			dest: path.join(__dirname, 'generated'),
			src: path.join(__dirname, 'public'),
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

		app.get('/', function(req, res) {
			var streams = client.pick(req.query);
			if (streams.length)
				res.render('index', {
					interval: config.intervals.switch,
					lock: req.query.hasOwnProperty('id'),
					streams: streams,
					titleSuffix: config.express.title || ''
				});
			else
				res.render('offline', {
					interval: config.intervals.switch,
					title: config.express.title || ''
				});
		});
		
		app.get('/get.json', function(req, res) {
			var streams = client.pick(req.query);
			res.json(streams);
		});

		app.get('/streams', function(req, res) {
			res.render('streams', {
				streams: client.streams,
				title: config.express.title
			});
		});

		app.get('/streams.json', function(req, res) {
			res.json(client.streams);
		});
		
		if (client.admin) {
			var adminRouter = express.Router();
			
			adminRouter.use(function(req, res, next) {
				if (!config.admin.users) {
					req.rights = ['add', 'remove'];
					return next();
				}
				
				function authenticate() {
					res.set('WWW-Authenticate', 'Basic realm="Admin - ' + config.express.title + '"');
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
				
				var valid = Array.isArray(config.admin.users) ? config.admin.users.some(check) : check(config.admin.users);
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
					client.add(req.body, function(err) {
						if (err)
							return res.send(500);
						
						res.redirect(config.admin.path);
					});
				else
					res.send(401);
			});
			
			adminRouter.get('/:index', function(req, res) {
				if (req.rights.indexOf('remove') !== -1)
					client.remove(req.params.index, function(err) {
						if (err)
							return res.send(500);
						
						res.redirect(config.admin.path);
					});
				else
					res.send(401);
			});
			
			adminRouter.use(function(req, res) {
				res.render('admin', {
					canAdd: req.rights.indexOf('add') !== -1,
					canRemove: req.rights.indexOf('remove') !== -1,
					streams: streams,
					title: 'Admin - ' + config.express.title
				});
			});
			
			app.use(config.admin.path, adminRouter);
		}
		
		return callback(null, app);
	});
};

if (require.main === module) {
	var config = require('config-path')(__dirname + "/config.yml");
	module.exports(config, function(err, app) {
		if (err) throw err;
		app.listen(app.get('port'), function(){
			console.log('Rollstreams server listening on port %d in %s mode', app.get('port'), app.get('env'));
		});
	});
}
