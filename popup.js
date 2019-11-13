$( document ).ready(function() {
	chrome.storage.sync.get({
		disable: false,
		autoFilter: false,
		autoShowGrade: false,
		lock: false,
		lineNumber: false,
		}, function(items){
			var disable = items.disable;
			var autoFilter = items.autoFilter;
			var lock = items.lock;
			var autoShowGrade = items.autoShowGrade;
			var lineNumber = items.lineNumber;
			$('input[name=autoFilter]').prop('checked', autoFilter);
			$('input[name=lock]').prop('checked', lock);
			$('input[name=disable]').prop('checked', disable);
			$('input[name=autoShowGrade]').prop('checked', autoShowGrade);
			$('input[name=lineNumber]').prop('checked', lineNumber);
			
	});
	$( document ).on( "change", "input[name=autoFilter], input[name=lock], input[name=autoShowGrade], input[name=disable], input[name=lineNumber]", function() {
	  autoFilter = $("input[name=autoFilter]").is(':checked');
	  lock = $("input[name=lock]").is(':checked');
	  autoShowGrade = $("input[name=autoShowGrade]").is(':checked');
	  disable = $("input[name=disable]").is(':checked');
	  lineNumber = $("input[name=lineNumber]").is(':checked');
		chrome.storage.sync.set({
	    autoFilter: autoFilter,
	    lock: lock,
	    autoShowGrade: autoShowGrade,
	    disable: disable,
	    lineNumber: lineNumber
	  }, function() {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			  chrome.tabs.sendMessage(tabs[0].id, {autoFilter: autoFilter, lock: lock, autoShowGrade: autoShowGrade, disable: disable, lineNumber: lineNumber}, function(response) {
			  });
			});
	  });
	});
});