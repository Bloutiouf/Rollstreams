var async = require('async'),
	request = require('request-json');

var match;
var regexp = /^http:\/\/(?:www\.)ustream\.tv\/channel\/([\w-]+)$/i;

module.exports = function() {
	var self = this;
	var client = request.newClient('http://api.ustream.tv/json/');
	var streams = [];
	
	this.register = function(stream) {
		if ((match = stream.url.match(regexp))) {
			streams.push(stream);
			stream.channel = match[1];
			stream.unregister = function() {
				var index = streams.indexOf(stream);
				streams.splice(index, 1);
			};
			return stream;
		}
	};
	
	this.update = function(callback) {
		function updateStream(stream, channel) {
			stream.online = (channel.status === 'live');
			if (stream.online) {
				stream.title = stream.title || channel.title;
				stream.code = '<object type="application/x-shockwave-flash" height="100%" width="100%" data="http://static-cdn1.ustream.tv/swf/live/viewer:232.swf?vrsl=c:572&amp;amp;ulbr=100"><param name="wmode" value="opaque"><param name="allowfullscreen" value="true"><param name="bgcolor" value="#000000"><param name="allowscriptaccess" value="always"><param name="flashvars" value="cid=' + channel.id + '&amp;autoplay=true"></object>';
			}
		}
		
		var batches = [];
		
		var index = 0;
		while (index < streams.length) {
			var batch = streams.slice(index, index + 10)
			batches.push(batch);
			index += 10;
		}
		
		return async.each(batches, function(batch, callback) {
			client.get('channel/' + batch.map(function(stream) {
				return stream.channel;
			}).join(';') + '/getInfo', function(err, res, body) {
				if (err || !body.results) {
					batch.forEach(function(stream) {
						stream.online = false;
					});
					return callback(err || new Error("No results"));
				}
				
				if (!Array.isArray(body.results)) {
					var stream = batch[0];
					var channel = body.results;
					updateStream(stream, channel);
				}
				else
					batch.forEach(function(stream, i) {
						var channel = body.results[i].result;
						updateStream(stream, channel);
					});
				return callback();
			});
		}, callback);
	};
};
