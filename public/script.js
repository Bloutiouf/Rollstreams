(function($) {
	var infoElement = $('#info');
	var listwrapElement = $('#listwrap');
	var streamsElement = $('#streams');
	var streamNamesElement = $('#stream-names');
	var titleElement = $('title');
	var windowElement = $(window);
	var timeoutId = null;
	
	var query = {
		count: streamsElement.children().length,
		chosen: [],
		previous: []
	};
	
	$('#layout').children().each(function() {
		var $this = $(this);
		if ($this.data('count') == query.count)
			$this.addClass('selected');
	});
	
	var currentNameIndex = 0;
	function updateName() {
		var streams = $('.stream');
		if (!streams.length)
			return;
			
		++currentNameIndex;
		if (currentNameIndex >= streams.length)
			currentNameIndex = 0;
			
		var title = $(streams[currentNameIndex]).data('title');
		infoElement.text(title);
		titleElement.text(title + ' - ' + titleSuffix);
	}
	setInterval(updateName, 5000);
	
	function addElement(stream, streamElement) {
		if (!streamElement) {
			streamElement = $('<div class="stream"></div>')
			streamsElement.append(streamElement);
		} else
			streamElement = $(streamElement);
		if (streamElement.data('url') != stream.url) {
			streamElement.html(stream.code);
			streamElement.data('url', stream.url);
			streamElement.data('title', stream.title);
		}
	}
	
	function showStreams() {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		
		$.getJSON('/get.json', query, function(streams) {
			streamsElement.children().slice(streams.length).remove();
			var elements = streamsElement.children();
			query.previous = [];
			$.each(streams, function(i, stream) {
				query.previous.push(stream.url);
				addElement(stream, elements[i]);
			});
			windowElement.resize();
			updateName();
			timeoutId = setTimeout(showStreams, interval);
		}).fail(function() {
			timeoutId = setTimeout(showStreams, interval);
		});
	}
	
	timeoutId = setTimeout(showStreams, interval);
	
	var alreadyClicked;
	infoElement.click(function(event) {
		event.preventDefault();
		infoElement.hide();
		$.getJSON('/streams.json', function(streams) {
			streamNamesElement.empty();
			$.each(streams, function() {
				var link = $('<a href="/?url=' + this.url + '"></a>');
				link.text(this.title);
				link.click(function(event) {
					event.preventDefault();
					query.chosen.push(this.url);
					showStreams();
					if (query.chosen.length >= query.count)
					{
						listwrapElement.hide();
						infoElement.show();
					}
				});
				streamNamesElement.append(link);
			});
			listwrapElement.show();
			query.chosen = [];
			alreadyClicked = false;
		}).fail(function() {
			infoElement.show();
		});
	});
	
	$('#close').click(function(event) {
		event.preventDefault();
		listwrapElement.hide();
		infoElement.show();
	});
	
	$('#lock').click(function(event) {
		event.preventDefault();
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		listwrapElement.hide();
		infoElement.show();
	});
	
	$('#layout > a').click(function(event) {
		event.preventDefault();
		$('#layout > a').removeClass('selected');
		$(event.delegateTarget).addClass('selected');
		query.count = $(event.delegateTarget).data('count');
		query.chosen = [];
		showStreams();
		alreadyClicked = true;
	});
	
	$('#random').click(function(event) {
		event.preventDefault();
		listwrapElement.hide();
		infoElement.show();
		if (!alreadyClicked)
			showStreams();
	});
	
	windowElement.resize(function() {
		var elements = streamsElement.children();
		var side = Math.ceil(Math.sqrt(elements.length));
		elements.each(function() {
			$(this).width(windowElement.width() / side).height(windowElement.height() / side);
		});
	}).resize();
})(jQuery);