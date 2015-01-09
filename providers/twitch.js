var async = require('async'),
	request = require('request-json');

var match;
var regexp = /^http:\/\/(?:www\.)?twitch\.tv\/([\w-]+)$/i;

module.exports = function() {
	var client = request.newClient('https://api.twitch.tv/kraken/');
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
		return async.each(streams, function(stream, callback) {
			client.get('streams/' + stream.channel, function(err, res, body) {
				if (err) {
					stream.online = false;
					return callback(err);
				}
				
				stream.online = (body.stream !== null);
				if (stream.online) {
					stream.title = stream.title || body.stream.channel.status;
					stream.code = '<object type="application/x-shockwave-flash" height="100%" width="100%" data="http://www.twitch.tv/widgets/live_embed_player.swf?channel=' + stream.channel + '" bgcolor="#000000"><param name="allowFullScreen" value="true"/><param name="allowScriptAccess" value="always"/><param name="allowNetworking" value="all"/><param name="wmode" value="opaque"/><param name="movie" value="http://www.twitch.tv/widgets/live_embed_player.swf"/><param name="flashvars" value="hostname=www.twitch.tv&channel=' + stream.channel + '&auto_play=true"/></object>';
				}
				return callback();
			});
		}, callback);
	};
};
