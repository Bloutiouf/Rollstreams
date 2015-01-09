module.exports = function(config) {
	var matches = config.iframe.matches;
	
	this.register = function(stream) {
		if (!matches || stream.url.indexOf(matches) > 0) {
			stream.online = true;
			stream.title = stream.title || stream.url;
			stream.code = '<iframe src="' + stream.url.replace('"', '') + '" width="100%" height="100%"></iframe>';
			return stream;
		}
	};
	
	this.update = function(callback) {
		return callback();
	};
};
