var async = require('async'),
	fs = require('fs'),
	path = require('path');

module.exports = function(config, callback) {
	function registerUrls(urls) {
		function updateStreams(callback) {
			if (timeoutId !== null)
				clearTimeout(timeoutId);
			
			return async.each(providers, function(provider, callback) {
				return provider.update(callback);
			}, function(err) {
				client.streams = streams.filter(function(stream) {
					return stream.online;
				});
				timeoutId = setTimeout(updateStreams, config.intervals.update * 1000);
				
				if (callback) return callback(err);
			});
		}
		
		function registerUrl(url) {
			var match;
			
			if (typeof url === 'string')
				var stream = {
					url: url
				};
			else {
				stream = {};
				for (var property in url)
					stream[property] = url[property];
			}
			
			providers.some(function(provider) {
				return provider.register(stream);
			});
			
			return stream;
		}
		
		function saveUrls(callback) {
			return fs.writeFile(streamsPath, JSON.stringify(urls), function(err) {
				if (err) return callback(err);
				return updateStreams(callback);
			});
		}
		
		var timeoutId;
		
		var streams = urls.map(registerUrl);
		
		var streamByUrl = {};
		streams.forEach(function(stream) {
			streamByUrl[stream.url] = stream;
		});
		
		var client = {
			pick: function(options) {
				var id, stream;
				options = options || {};
				
				var availableStreams = client.streams.slice();
				
				var count = options.count;
				if (isNaN(count))
					count = config.defaultStreamCount;
				else
					count = Math.floor(count);
					
				var chosenStreams = [];
				if (Array.isArray(options.chosen))
					options.chosen.forEach(function(url) {
						availableStreams = availableStreams.filter(function(stream) {
							if (stream.url === url) {
								chosenStreams.push(stream);
								return false;
							}
							return true;
						});
					});
				
				var previousStreamUrls = options.previous;
				if (Array.isArray(previousStreamUrls))
					while (previousStreamUrls.length > 0 && chosenStreams.length + availableStreams.length > count) {
						var url = previousStreamUrls.pop();
						availableStreams = availableStreams.filter(function(stream) {
							return (stream.url !== url);
						});
					}
				
				while (chosenStreams.length < count && availableStreams.length > 0) {
					var index = Math.floor(Math.random() * availableStreams.length);
					var stream = availableStreams.splice(index, 1)[0];
					chosenStreams.push(stream);
				}
				
				return chosenStreams;
			}			
		};
		
		if (streamsPath) {
			client.admin = true;
			client.add = function(url, callback) {
				urls.push(url);
				streams.push(registerUrl(url));
				return saveUrls(callback);
			};
			client.remove = function(index, callback) {
				var url = urls.splice(index, 1)[0];
				var stream = streams.splice(index, 1)[0];
				if (stream.unregister)
					stream.unregister();
				return saveUrls(callback);
			};
		}
		
		return updateStreams(function(err) {
			if (err) return callback(err);
			return callback(null, client);
		});
	}
	
	var providers = config.providers.map(function(provider) {
		var Provider = require('./providers/' + provider);
		return new Provider(config);
	});
	
	if (typeof config.streams === 'string') {
		if (config.streams.toLowerCase().indexOf('.json', config.streams.length - 5) !== -1) {
			var streamsPath = config.streams;
			return fs.readFile(streamsPath, function(err, data) {
				if (err) return callback(err);
				try {
					var urls = JSON.parse(data)
				} catch(err) {
					return callback(err);
				}
				return registerUrls(urls);
			});
		} else
			return require(config.streams)(function(err, urls) {
				if (err) return callback(err);
				return registerUrls(urls);
			});
	}
	
	return registerUrls(config.streams);
};
