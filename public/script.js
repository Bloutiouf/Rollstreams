(function($) {
	var infoElement = $('#info');
	var listwrapElement = $('#listwrap');
	var streamElement = $('#stream');
	var streamsElement = $('#streams');
	var titleElement = $('title');
	var windowElement = $(window);
	var timeout = null;
	
	function updateElements(stream) {
		if (stream) {
			infoElement.text(stream.name);
			titleElement.text(stream.name + ' - ' + titleSuffix);
			if (streamElement.data('id') != stream.id) {
				streamElement.html(stream.code);
				streamElement.data('id', stream.id);
			}
		}
	}
	
	function showRandomStream() {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
		
		$.getJSON('/stream.json?except=' + streamElement.data('id'), function(stream) {
			updateElements(stream);
			timeout = setTimeout(showRandomStream, interval);
		}).fail(function() {
			timeout = setTimeout(showRandomStream, interval);
		});
	}
	
	function showStream(id) {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
		
		$.getJSON('/stream.json?id=' + id, function(stream) {
			updateElements(stream);
		});
	}
	
	if (streamElement.data('id') !== undefined) {
		timeout = setTimeout(showRandomStream, interval);
	} else
		showRandomStream();
	
	infoElement.click(function(event) {
		event.preventDefault();
		infoElement.hide();
		$.getJSON('/streams.json', function(streams) {
			streamsElement.empty();
			$.each(streams, function(index, stream) {
				if (stream) {
					var link = $('<a href="/?id=' + index + '"></a>');
					link.text(stream);
					link.click(function(event) {
						event.preventDefault();
						listwrapElement.hide();
						infoElement.show();
						showStream(index, true);
					});
					streamsElement.append(link);
				}
			});
			listwrapElement.show();
		}).fail(function() {
			infoElement.show();
		});
	});
	
	$('#random').click(function(event) {
		event.preventDefault();
		listwrapElement.hide();
		infoElement.show();
		showRandomStream();
	});
	
	$('#close').click(function(event) {
		event.preventDefault();
		listwrapElement.hide();
		infoElement.show();
	});
	
	$('#lock').click(function(event) {
		event.preventDefault();
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
		listwrapElement.hide();
		infoElement.show();
	});
	
	windowElement.resize(function() {
		streamElement.width(windowElement.width()).height(windowElement.height());
	}).resize();
})(jQuery);