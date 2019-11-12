$( document ).ready(function() {
	chrome.storage.sync.get({
		disable: false,
		autoFilter: false,
		autoShowGrade: false,
		lock: false,
		}, function(items){
			var disable = items.disable;
			var autoFilter = items.autoFilter;
			var lock = items.lock;
			var autoShowGrade = items.autoShowGrade;
			$('input[name=autoFilter]').prop('checked', autoFilter);
			$('input[name=lock]').prop('checked', lock);
			$('input[name=disable]').prop('checked', disable);
			$('input[name=autoShowGrade]').prop('checked', autoShowGrade);
			
	});
	$( document ).on( "change", "input[name=autoFilter], input[name=lock], input[name=autoShowGrade], input[name=disable]", function() {
	  autoFilter = $("input[name=autoFilter]").is(':checked');
	  lock = $("input[name=lock]").is(':checked');
	  autoShowGrade = $("input[name=autoShowGrade]").is(':checked');
	  disable = $("input[name=disable]").is(':checked');
		chrome.storage.sync.set({
	    autoFilter: autoFilter,
	    lock: lock,
	    autoShowGrade: autoShowGrade,
	    disable: disable
	  }, function() {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			  chrome.tabs.sendMessage(tabs[0].id, {autoFilter: autoFilter, lock: lock, autoShowGrade: autoShowGrade, disable: disable}, function(response) {
			  });
			});
	  });
	});
});