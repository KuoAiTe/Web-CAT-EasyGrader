$( document ).ready(function() {
  chrome.storage.local.get({
    studentDict: {},
    studentGrade: {},
  }, function(items) {
    let studentDict = items.studentDict;
    let studentGrade = items.studentGrade;
    chrome.storage.sync.get({
      disable: false,
      autoFilter: false,
      autoShowGrade: false,
      lock: false,
      lineNumber: false,
      showSectionName: false,
      showNoReplyPost: false,
      autoSaveGrade: false,
      selectedSection: [],
      courseSection: [],
    }, function(items){
      let disable = items.disable;
      let autoFilter = items.autoFilter;
      let lock = items.lock;
      let autoShowGrade = items.autoShowGrade;
      let lineNumber = items.lineNumber;
      let courseSection = new Set();
      let selectedSection = items.selectedSection;
      let showSectionName = items.showSectionName;
      let showNoReplyPost = items.showNoReplyPost;
      let autoSaveGrade = items.autoSaveGrade;
      items.courseSection.reduce((s, e) => s.add(e), courseSection);
      let sectionCountDict = {}
      const regex = /([a-zA-Z]{3,4}[0-9]{3,5})/;
      for (let key in studentDict) {
        if (!key.match(regex)) continue;
        const sections = studentDict[key];
        for (section in sections) {

          if (!(section in sectionCountDict)) {
            sectionCountDict[section] = 0;
          }
          sectionCountDict[section] += 1;
        }
        //console.log(section);
      }
      //console.log(sectionCountDict);

      courseSection = Array.from(courseSection).sort();
      courseSection.forEach(function (value1,value2,set) {
        let studentCount = 0;
        if (value1 in sectionCountDict)
          studentCount = sectionCountDict[value1];
        $('#section').append("<option value='" + value1 + "'>" + studentCount + " Students - " + value1 + "</option>");
      });
      //console.log(courseSection);
      $('input[name=autoFilter]').prop('checked', autoFilter);
      $('input[name=lock]').prop('checked', lock);
      $('input[name=disable]').prop('checked', disable);
      $('input[name=autoShowGrade]').prop('checked', autoShowGrade);
      $('input[name=lineNumber]').prop('checked', lineNumber);
      $('input[name=showSectionName]').prop('checked', showSectionName);
      $('input[name=showNoReplyPost]').prop('checked', showNoReplyPost);
      $('input[name=autoSaveGrade]').prop('checked', autoSaveGrade);
      selectedSection.forEach( section => {
        $('#section > option:contains(' + section + ')').prop('selected', true);
      });
    });
  });
	$( document ).on( "click", "#resetCache", function() {
		$('#section > option').remove();
		chrome.storage.sync.set({
			courseSection: [],
      selectedSection: []
		}, function() {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {courseSection: [], selectedSection: []}, function(response) {
				});
			});
		});
		chrome.storage.local.set({
     studentDict: {},
     studentGrade: {},
   }, function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {studentDict: {}, studentGrade: {}}, function(response) {
        });
      });
    });
	});
	$( document ).on( "change", "#section", function() {
		let selectedSection = new Set();
    $("#section :selected").each(function() {
      selectedSection.add($(this).val());
    });
    selectedSection = Array.from(selectedSection).sort()
		chrome.storage.sync.set({
     selectedSection: selectedSection
   }, function() {
     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {selectedSection: selectedSection}, function(response) {
      });
    });
   });
	});
	$( document ).on( "change", "input[name=autoFilter], input[name=lock], input[name=showNoReplyPost], input[name=autoSaveGrade], input[name=autoShowGrade], input[name=showSectionName], input[name=disable], input[name=lineNumber]", function() {
   autoFilter = $("input[name=autoFilter]").is(':checked');
   lock = $("input[name=lock]").is(':checked');
   autoShowGrade = $("input[name=autoShowGrade]").is(':checked');
   disable = $("input[name=disable]").is(':checked');
   lineNumber = $("input[name=lineNumber]").is(':checked');
   showSectionName = $("input[name=showSectionName]").is(':checked');
   showNoReplyPost = $("input[name=showNoReplyPost]").is(':checked');
   autoSaveGrade = $('input[name=autoSaveGrade]').is(':checked');
   chrome.storage.sync.set({
     autoFilter: autoFilter,
     lock: lock,
     autoShowGrade: autoShowGrade,
     disable: disable,
     lineNumber: lineNumber,
     showSectionName: showSectionName,
     showNoReplyPost: showNoReplyPost,
     autoSaveGrade: autoSaveGrade,
   }, function() {
     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
       chrome.tabs.sendMessage(tabs[0].id, {autoFilter: autoFilter, lock: lock, autoSaveGrade: autoSaveGrade, showNoReplyPost: showNoReplyPost, autoShowGrade: autoShowGrade, disable: disable, lineNumber: lineNumber, showSectionName: showSectionName}, function(response) {
       });
     });
   });
 });
});
