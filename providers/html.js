module.exports = function() {
	this.register = function(stream) {
		if (stream.url[0] === '<') {
			stream.online = true;
			stream.title = stream.title || stream.url;
			stream.code = stream.url;
			return stream;
		}
	};
	
	this.update = function(callback) {
		return callback();
	};
};
