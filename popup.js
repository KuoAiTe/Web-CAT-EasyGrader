$( document ).ready(function() {
	chrome.storage.sync.get({
		showUI: true,
		disable: false,
		}, function(items){
			var showUI = items.showUI;
			var disable = items.disable;
			$('input[name=showUI]').prop('checked', showUI);
			$('input[name=disable]').prop('checked', disable);
			
	});
	$( document ).on( "change", "input[name=showUI]", function() {
	  showUI = $(this).is(':checked');
		chrome.storage.sync.set({
	    showUI: showUI
	  }, function() {});
	});
	$( document ).on( "change", "input[name=disable]", function() {
	  disable = $(this).is(':checked');
		chrome.storage.sync.set({
	    disable: disable
	  }, function() {});
	});
});