Rollstreams
===========

Rollstreams is an application that automatically switches between live streams after a certain amount of time. Originally developed for the [Global Game Jam](http://globalgamejam.org/) 2014, it is intended to display live streams on a TV or a video projector without anyone taking care of it.

[See an online demo here!](http://rollstreams.bloutiouf.com/)

### Features

* Easy to configure, simple to use.
* Supports [Justin.tv](http://www.justin.tv/), [Twitch.tv](http://www.twitch.tv/), and [Ustream.tv](http://www.ustream.tv/).
* Can work without JavaScript on the client side.

### Installation

Requirement: [Node.js](http://nodejs.org/).

1. `git clone https://github.com/Bloutiouf/Rollstreams.git` or [download zip](https://github.com/Bloutiouf/Rollstreams/archive/master.zip)
2. `npm install` to install Node.js's dependencies
3. `cp conf.js{.template,}`
4. `vi _conf.js_` and configure
4. `node app.js` or use [forever](https://github.com/nodejitsu/forever), [nodemon](https://github.com/remy/nodemon)...
