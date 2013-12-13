var conf = require('./conf'),
	request = require('request-json');

var justinClient = request.newClient('http://api.justin.tv/api/');
var justinRegexp = /http:\/\/www\.justin\.tv\/(.+)/;

var twitchClient = request.newClient('https://api.twitch.tv/kraken/');
var twitchRegexp = /http:\/\/www\.twitch\.tv\/(.+)/;

var ustreamClient = request.newClient('http://api.ustream.tv/json/');
var ustreamRegexp = /http:\/\/www\.ustream\.tv\/channel\/(.+)/;

function updateStreams(streams, callback) {
	var onlineStreams = 0;
	var ustreams = [];
	
	function updateUStreams(index) {
		if (index >= ustreams.length) {
			if (callback)
				callback(onlineStreams);
		} else {
			var channels = [];
			for (var i = index, n = Math.min(index + 10, ustreams.length); i < n; ++i)
				channels.push(ustreams[i].channel);
			ustreamClient.get('channel/' + channels.join(';') + '/getInfo?key=' + conf.ustreamKey, function(err, res, body) {
				if (err)
					callback(onlineStreams);
				else {
					if (!body.results.length) {
						var stream = ustreams[index];
						var channel = body.results;
						stream.online = (channel.status === 'live');
						if (stream.online) {
							++onlineStreams;
							stream.name = channel.title;
							stream.code = '<object type="application/x-shockwave-flash" height="100%" width="100%" data="http://static-cdn1.ustream.tv/swf/live/viewer:232.swf?vrsl=c:572&amp;amp;ulbr=100"><param name="wmode" value="opaque"><param name="allowfullscreen" value="true"><param name="bgcolor" value="#000000"><param name="allowscriptaccess" value="always"><param name="flashvars" value="cid=' + channel.id + '&amp;autoplay=true"></object>';
						}
					}
					else
						for (var i = index; i < n; ++i) {
							var stream = ustreams[i];
							var channel = body.results[i-index].result;
							stream.online = (channel.status === 'live');
							if (stream.online) {
								++onlineStreams;
								stream.name = channel.title;
								stream.code = '<object type="application/x-shockwave-flash" height="100%" width="100%" data="http://static-cdn1.ustream.tv/swf/live/viewer:232.swf?vrsl=c:572&amp;amp;ulbr=100"><param name="wmode" value="opaque"><param name="allowfullscreen" value="true"><param name="bgcolor" value="#000000"><param name="allowscriptaccess" value="always"><param name="flashvars" value="cid=' + channel.id + '&amp;autoplay=true"></object>';
							}
						}
					updateUStreams(index + 10);
				}
			});
		}
	}
	
	function updateStream(index) {
		var stream = streams[index];
		if (stream) {
		
			if (stream.provider === 'justin') {
				justinClient.get('channel/show/' + stream.channel + '.json', function(err, res, body) {
					if (err)
						stream.online = false;
					else {
						stream.online = (body.status !== null);
						if (stream.online) {
							++onlineStreams;
							stream.name = body.title;
							stream.code = '<object type="application/x-shockwave-flash" height="100%" width="100%" data="http://www.justin.tv/swflibs/JustinPlayer.swf"><param name="allowNetworking" value="all"><param name="allowScriptAccess" value="always"><param name="allowFullScreen" value="true"><param name="wmode" value="opaque"><param name="flashvars" value="publisherGuard=null&amp;hide_chat=true&amp;searchquery=null&amp;backgroundImageUrl=http://www-cdn.jtvnw.net/static/images/404_user_70x70.png&amp;channel=' + stream.channel + '&amp;hostname=www.justin.tv&amp;auto_play=true&amp;pro=false"></object>';
						}
					}
					updateStream(index + 1);
				});
			}
			
			else if (stream.provider === 'twitch') {
				twitchClient.get('streams/' + stream.channel, function(err, res, body) {
					if (err)
						stream.online = false;
					else {
						stream.online = (body.stream !== null);
						if (stream.online) {
							++onlineStreams;
							stream.name = body.stream.channel.status;
							stream.code = '<object type="application/x-shockwave-flash" height="100%" width="100%" data="http://www.twitch.tv/widgets/live_embed_player.swf?channel=' + stream.channel + '" bgcolor="#000000"><param name="allowFullScreen" value="true"/><param name="allowScriptAccess" value="always"/><param name="allowNetworking" value="all"/><param name="wmode" value="opaque"/><param name="movie" value="http://www.twitch.tv/widgets/live_embed_player.swf"/><param name="flashvars" value="hostname=www.twitch.tv&channel=' + stream.channel + '&auto_play=true"/></object>';
						}
					}
					updateStream(index + 1);
				});
			}
			
			else if (stream.provider === 'ustream') {
				ustreams.push(stream);
				updateStream(index + 1);
			}
			
			else
				throw new Error('Provider not handled: ' + stream.provider);
		} else {
			updateUStreams(0);
		}
	}

	if (streams.length > 0)
		updateStream(0);
	else
		callback(0);
}

function initStreams(streamUrls, callback) {
	var streams = streamUrls.map(function(url) {
		var match;
		
		if ((match = url.match(justinRegexp))) {
			var channel = match[1];
			return {
				provider: 'justin',
				channel: channel
			};
		}
		
		else if ((match = url.match(twitchRegexp))) {
			var channel = match[1];
			return {
				provider: 'twitch',
				channel: channel
			};
		}
		
		else if ((match = url.match(ustreamRegexp))) {
			var channel = match[1];
			return {
				provider: 'ustream',
				channel: channel
			};
		}
	});
	
	updateStreams(streams, function(online) {
		callback(streams, online);
	});
}

module.exports = {
	updateStreams: updateStreams,
	initStreams: initStreams
};
