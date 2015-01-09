# Rollstreams

Rollstreams is an application that automatically switches between live streams after a certain amount of time. Originally developed for the [Global Game Jam](http://globalgamejam.org/) 2014, it is intended to display live streams on a TV or a video projector without anyone taking care of it.

[See an online demo here!](http://rollstreams.bloutiouf.com/)

## Features

* Easy to configure, simple to use.
* Supports [Twitch.tv](http://www.twitch.tv/), and [Ustream.tv](http://www.ustream.tv/). Otherwise, uses iframe or custom HTML code.
* Can work without JavaScript on the client side.

## Installation

Requirement: [Node.js](http://nodejs.org/).

1. `git clone https://github.com/Bloutiouf/Rollstreams.git` or [download zip](https://github.com/Bloutiouf/Rollstreams/archive/master.zip)
2. `npm install` to install Node.js's dependencies
3. `vi config.yml` and configure
4. `node app.js` or use [PM2](https://github.com/Unitech/PM2), [nodemon](https://github.com/remy/nodemon)...

## Providers

The config contains a list of enabled providers. The available providers are:

+ html
+ iframe
+ twitch
+ ustream

## Streams

### As an array

To provide a known list of urls, simply provide them as an array of string. You can also give

+ any HTML code starting with `<`, if the html provider is enabled
+ any url which will be embedded in a `iframe`, if the iframe provider is enabled, and if `config.iframe.matches` is set to a string, only when the url matches this string
+ an object with following fields:
	+ `title`: if set, overrides the channel's name. This is especially recommended for HTML codes and iframes because they don't have a name.
	+ `url`: url / HTML code as explained above

For instance, this is the array provided in the template:

	  streams:
	    - http://www.ustream.tv/channel/live-iss-stream
	    - http://www.twitch.tv/riotgames
	    - http://www.twitch.tv/beyondthesummit
	    - http://www.twitch.tv/spooner96
	    - title: Mont Blanc
	      url: http://m.webcam-hd.com/les-saisies/hauteluce-mtblanc

### As a function

It is also possible to set `streams` to a string *not ending with .json* which is the path to a Node.js module that will be `require`d. This allows you to asynchronously get the streams. This module shall export a function, which takes a `callback` function as argument. This callback takes an error object as first argument, and the array of urls as second argument (explanations above apply as well).

For instance, this is the `streams` module used for the [Global Game Jam](http://globalgamejam.org/):

	var request = require('request');
	
	module.exports = function(callback) {
		request('http://globalgamejam.org/video-streams/now/feed', function (err, response, body) {
			if (err || response.statusCode != 200)
				return callback(err || body || response.statusCode);
			
			var urls = [];
			var regexp = /^"(.*)",".*",".*","(http.*)"$/gim;
			regexp.lastIndex = 49;
			var match;
			while ((match = regexp.exec(body)) !== null)
			{
				urls.push({
					title: match[1],
					url: match[2]
				});
			}
			return callback(null, urls);
		});
	};

### As a file containing a JSON array

Finally it is possible to set `streams` to a string *ending with .json* which is a path to a file. This file is JSON encoded and contains an array of urls as specified above.

In this case, an administration back-office is available where it is possible to add or remove streams. The file is overwritten on each change. The file doesn't have to exist at the beginning, which is the same as an empty array.

Therefore, the file is merely a database and you shouldn't set its content by hand.

## License

Copyright (c) 2015 Jonathan Giroux

[MIT License](http://opensource.org/licenses/MIT)
