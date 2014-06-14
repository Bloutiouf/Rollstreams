var conf = require('./conf'),
	request = require('request-json');

var justinClient = request.newClient('http://api.justin.tv/api/');
var justinRegexp = /^http:\/\/(?:www\.)?justin\.tv\/([\w-]+)$/i;

var twitchClient = request.newClient('https://api.twitch.tv/kraken/');
var twitchRegexp = /^http:\/\/(?:www\.)?twitch\.tv\/([\w-]+)$/i;

var ustreamClient = request.newClient('http://api.ustream.tv/json/');
var ustreamRegexp = /^http:\/\/(?:www\.)ustream\.tv\/channel\/([\w-]+)$/i;

function getStreams(callback) {
	var streams = [];
	
	function updateStreams(callback) {
		var ustreams = [];
		
		function updateUStreams(index) {
			if (index >= ustreams.length) {
				if (callback)
					callback();
			} else {
				var channels = [];
				for (var i = index, n = Math.min(index + 10, ustreams.length); i < n; ++i)
					channels.push(ustreams[i].channel);
				ustreamClient.get('channel/' + channels.join(';') + '/getInfo', function(err, res, body) {
					if (err || !body.results) {
						if (callback)
							callback();
					} else {
						if (!body.results.length) {
							var stream = ustreams[index];
							var channel = body.results;
							stream.online = (channel.status === 'live');
							if (stream.online) {
								++streams.online;
								stream.name = stream.title || channel.title;
								stream.code = '<object type="application/x-shockwave-flash" height="100%" width="100%" data="http://static-cdn1.ustream.tv/swf/live/viewer:232.swf?vrsl=c:572&amp;amp;ulbr=100"><param name="wmode" value="opaque"><param name="allowfullscreen" value="true"><param name="bgcolor" value="#000000"><param name="allowscriptaccess" value="always"><param name="flashvars" value="cid=' + channel.id + '&amp;autoplay=true"></object>';
							}
						}
						else
							for (var i = index; i < n; ++i) {
								var stream = ustreams[i];
								var channel = body.results[i-index].result;
								stream.online = (channel.status === 'live');
								if (stream.online) {
									++streams.online;
									stream.name = stream.title || channel.title;
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
							stream.online = (body.description !== null);
							if (stream.online) {
								++streams.online;
								stream.name = stream.title || body.title;
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
								++streams.online;
								stream.name = stream.title || body.stream.channel.status;
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
				
				else if (stream.provider === 'html') {
					++streams.online;
					stream.online = true;
					stream.name = stream.title || stream.url;
					stream.code = stream.url;
					updateStream(index + 1);
				}
				
				else if (stream.provider === 'iframe') {
					++streams.online;
					stream.online = true;
					stream.name = stream.title || stream.url;
					stream.code = '<iframe src="' + stream.url.replace('"', '') + '" width="100%" height="100%"></iframe>';
					updateStream(index + 1);
				}
				
				else {
					stream.online = false;
					updateStream(index + 1);
				}
				
			} else {
				updateUStreams(0);
			}
		}
		
		function next(err, urls) {
			streams.length = 0;
			streams.online = 0;
			
			if (err) {
				if (callback)
					callback();
				return;
			}
			
			urls.forEach(function(stream) {
				var match;
				
				if (typeof stream === 'string')
					stream = {
						url: stream
					};
				
				if ((match = stream.url.match(justinRegexp))) {
					stream.provider = 'justin';
					stream.channel = match[1];
				}
				
				else if ((match = stream.url.match(twitchRegexp))) {
					stream.provider = 'twitch';
					stream.channel = match[1];
				}
				
				else if ((match = stream.url.match(ustreamRegexp))) {
					stream.provider = 'ustream';
					stream.channel = match[1];
				}
				
				else if (stream.url[0] === '<') {
					stream.provider = 'html';
				}
				
				else if (!conf.iframeWhenMatches || stream.url.indexOf(conf.iframeWhenMatches) > 0) {
					stream.provider = 'iframe';
				}
				
				else
					return;
				
				streams.push(stream);
			});
			
			if (streams.length > 0)
				updateStream(0);
			else if (callback)
				callback();
		}
		
		if (typeof conf.streams === 'function')
			conf.streams(next);
		else
			next(false, conf.streams);
	}

	setInterval(updateStreams, conf.updateInterval * 1000);
	
	updateStreams(function() {
		callback(streams);
	});
}

module.exports = getStreams;
