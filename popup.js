$( document ).ready(function() {
	chrome.storage.sync.get({
		disable: false,
		autoFilter: false,
		autoShowGrade: false,
		lock: false,
		lineNumber: false,
		selectedSection: "",
		courseSection: []
		}, function(items){
			let disable = items.disable;
			let autoFilter = items.autoFilter;
			let lock = items.lock;
			let autoShowGrade = items.autoShowGrade;
			let lineNumber = items.lineNumber;
			let courseSection = new Set();
			let selectedSection = items.selectedSection;
		  items.courseSection.reduce((s, e) => s.add(e), courseSection);
			courseSection = Array.from(courseSection).sort();
      courseSection.forEach(function (value1,value2,set) {
				$('#section').append("<option>" + value1 + "</option>");
      });
			//console.log(courseSection);
			$('input[name=autoFilter]').prop('checked', autoFilter);
			$('input[name=lock]').prop('checked', lock);
			$('input[name=disable]').prop('checked', disable);
			$('input[name=autoShowGrade]').prop('checked', autoShowGrade);
			$('input[name=lineNumber]').prop('checked', lineNumber);
			if(selectedSection == "") {
				$('#section > option:eq(0)').prop('selected', true);
			} else {
				$('#section > option:contains(' + selectedSection + ')').prop('selected', true);
			}

	});
	$( document ).on( "change", "#section", function() {
		let selectedSection = $("#section :selected").text();
		chrome.storage.sync.set({
	    selectedSection: selectedSection
		}, function() {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {selectedSection: selectedSection}, function(response) {
				});
			});
		});
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
