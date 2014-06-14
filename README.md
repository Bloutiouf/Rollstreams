# Rollstreams

Rollstreams is an application that automatically switches between live streams after a certain amount of time. Originally developed for the [Global Game Jam](http://globalgamejam.org/) 2014, it is intended to display live streams on a TV or a video projector without anyone taking care of it.

[See an online demo here!](http://rollstreams.bloutiouf.com/)

## Features

* Easy to configure, simple to use.
* Supports [Justin.tv](http://www.justin.tv/), [Twitch.tv](http://www.twitch.tv/), and [Ustream.tv](http://www.ustream.tv/). Otherwise, uses iframe or custom HTML code.
* Can work without JavaScript on the client side.

## Installation

Requirement: [Node.js](http://nodejs.org/).

1. `git clone https://github.com/Bloutiouf/Rollstreams.git` or [download zip](https://github.com/Bloutiouf/Rollstreams/archive/master.zip)
2. `npm install` to install Node.js's dependencies
3. `cp conf.js{.template,}`
4. `vi conf.js` and configure
5. `node app.js` or use [forever](https://github.com/nodejitsu/forever), [nodemon](https://github.com/remy/nodemon)...

## Streams

To provide a known list of urls, simply provide them as an array of string. You can also give

+ any HTML code starting with `<`
+ any url which will be embedded in a `iframe` (if `conf.iframeWhenMatches` is set to a string, only when the url matches this string)
+ an object with following fields:
	+ `title`: if set, overrides the channel's name. This is especially recommended for HTML codes and iframes because they don't have a name.
	+ `url`: url / HTML code as explained above

For instance, this is the array provided in the template:

	streams: [
		'http://www.ustream.tv/channel/live-iss-stream',
		'http://www.twitch.tv/riotgames',
		'http://www.justin.tv/clubzonefm',
		{
			title: 'Mont Blanc',
			url: 'http://m.webcam-hd.com/les-saisies/hauteluce-mtblanc'
		}
	]

It is also possible to set `streams` to a function, allowing you to asynchronously get the streams. This function has a `callback` function as argument, which takes an error object as first argument, and the array of urls as second argument (explanations above apply as well).

For instance, this is the `streams` function used for the [Global Game Jam](http://globalgamejam.org/):

	var parseString = require('xml2js').parseString;
	...
	
	streams: function(callback) {
		request('http://globalgamejam.org/video-streams/now/feed', function (err, response, body) {
			if (error || response.statusCode != 200) {
				console.log(error);
				callback(true);
			} else {
				parseString(body, function (err, root) {
					if (err || !root || !root.nodes || !root.nodes.node) {
						console.log(err);
						callback(true);
					} else {
						var urls = [];
						root.nodes.node.forEach(function(node) {
							if (node['Live-stream-link']) {
								var url = {
									url: String(node['Live-stream-link']),
									title: String(node.Title)
								}
								
								urls.push(url);
							}
						});
						callback(false, urls);
					}
				});
			}
		});
	}

## License

[MIT License](http://opensource.org/licenses/MIT)