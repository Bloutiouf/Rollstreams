(function($) {
	var infoElement = $('#info');
	var listwrapElement = $('#listwrap');
	var streamsElement = $('#streams');
	var streamNamesElement = $('#streamnames');
	var titleElement = $('title');
	var windowElement = $(window);
	var timeout = null;
	var chosenStreams = [];
	var previousStreams = [];
	
	var nStreams = streamsElement.children().length;
	if (nStreams === 1)
		$('.layout1').addClass('selected');
	else if (nStreams === 1)
		$('.layout2x2').addClass('selected');
	else if (nStreams === 9)
		$('.layout3x3').addClass('selected');
	
	var currentName = 0;
	function updateName() {
		var names = $('.stream');
		if (!names.length)
			return;
			
		++currentName;
		if (currentName >= names.length)
			currentName = 0;
			
		var name = $(names[currentName]).data('name');
		infoElement.text(name);
		titleElement.text(name + ' - ' + titleSuffix);
	}
	setInterval(updateName, 5000);
	
	function addElement(stream, streamElement) {
		if (!streamElement) {
			streamElement = $('<div class="stream"></div>')
			streamsElement.append(streamElement);
		} else
			streamElement = $(streamElement);
		if (streamElement.data('id') != stream.id) {
			streamElement.html(stream.code);
			streamElement.data('id', stream.id);
			streamElement.data('name', stream.name);
		}
	}
	
	function showStreams() {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
		
		$.getJSON('/get.json', {
			n: nStreams,
			chosen: chosenStreams,
			previous: previousStreams
		}, function(streams) {
			streamsElement.children().slice(streams.length).remove();
			var elements = streamsElement.children();
			previousStreams = [];
			$.each(streams, function(i, stream) {
				previousStreams.push(stream.id);
				addElement(stream, elements[i]);
			});
			windowElement.resize();
			updateName();
			timeout = setTimeout(showStreams, interval);
		}).fail(function() {
			timeout = setTimeout(showStreams, interval);
		});
	}
	
	timeout = setTimeout(showStreams, interval);
	
	var alreadyClicked;
	infoElement.click(function(event) {
		event.preventDefault();
		infoElement.hide();
		$.getJSON('/streams.json', function(streams) {
			streamNamesElement.empty();
			$.each(streams, function(index, stream) {
				if (stream) {
					var link = $('<a href="/?id=' + index + '"></a>');
					link.text(stream);
					link.click(function(event) {
						event.preventDefault();
						chosenStreams.push(index);
						showStreams();
						if (chosenStreams.length >= nStreams)
						{
							listwrapElement.hide();
							infoElement.show();
						}
					});
					streamNamesElement.append(link);
				}
			});
			listwrapElement.show();
			chosenStreams = [];
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
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
		listwrapElement.hide();
		infoElement.show();
	});
	
	$('#layout > a').click(function(event) {
		event.preventDefault();
		$('#layout > a').removeClass('selected');
		$(event.delegateTarget).addClass('selected');
		nStreams = $(event.delegateTarget).data('n');
		chosenStreams = [];
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