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
      onlyShowTextInRed: false,
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
      let onlyShowTextInRed = items.onlyShowTextInRed;
      let autoSaveGrade = items.autoSaveGrade;
      items.courseSection.reduce((s, e) => s.add(e), courseSection);
      let sectionCountDict = {};
      for (const courseKey in studentGrade) {
        for (const loginId in studentGrade[courseKey]) {
          if (!loginId.match(REGEX.STUDENT_ID)) continue;
          let studentSection = '';
          let studentGroups = '';
          if ('Section' in studentGrade[courseKey][loginId]) {
            studentSection = studentGrade[courseKey][loginId]['Section'];
          }
          if ('Groups' in studentGrade[courseKey][loginId]) {
            studentGroups = studentGrade[courseKey][loginId]['Groups'].join(" | ");
          }
          const output = `${studentSection}-${studentGroups}`;
          if (!(studentSection in sectionCountDict)) {
            sectionCountDict[studentSection] = 0;
          }
          if (!(output in sectionCountDict)) {
            sectionCountDict[output] = 0;
          }
          sectionCountDict[studentSection] += 1;
          sectionCountDict[output] += 1;
        }
      }
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
      $('input[name=onlyShowTextInRed]').prop('checked', onlyShowTextInRed);
      $('input[name=autoSaveGrade]').prop('checked', autoSaveGrade);
      selectedSection.forEach( section => {
        $('#section > option:contains(' + section + ')').prop('selected', true);
      });
    });
  });
	$( document ).on( "click", "#resetCache", function() {
    const r = confirm("CLEAR ALL CACHE?");
    if (r) {
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
    }
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
	$( document ).on( "change", "input[name=autoFilter], input[name=lock], input[name=showNoReplyPost], input[name=onlyShowTextInRed], input[name=autoSaveGrade], input[name=autoShowGrade], input[name=showSectionName], input[name=disable], input[name=lineNumber]", function() {
   autoFilter = $("input[name=autoFilter]").is(':checked');
   lock = $("input[name=lock]").is(':checked');
   autoShowGrade = $("input[name=autoShowGrade]").is(':checked');
   disable = $("input[name=disable]").is(':checked');
   lineNumber = $("input[name=lineNumber]").is(':checked');
   showSectionName = $("input[name=showSectionName]").is(':checked');
   showNoReplyPost = $("input[name=showNoReplyPost]").is(':checked');
   onlyShowTextInRed = $('input[name=onlyShowTextInRed]').is(':checked');
   autoSaveGrade = $('input[name=autoSaveGrade]').is(':checked');
   chrome.storage.sync.set({
     autoFilter: autoFilter,
     lock: lock,
     autoShowGrade: autoShowGrade,
     disable: disable,
     lineNumber: lineNumber,
     showSectionName: showSectionName,
     showNoReplyPost: showNoReplyPost,
     onlyShowTextInRed: onlyShowTextInRed,
     autoSaveGrade: autoSaveGrade,
   }, function() {
     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
       chrome.tabs.sendMessage(tabs[0].id, {
         autoFilter: autoFilter,
         lock: lock,
         autoSaveGrade: autoSaveGrade,
         showNoReplyPost: showNoReplyPost,
         onlyShowTextInRed: onlyShowTextInRed,
         autoShowGrade: autoShowGrade,
         disable: disable,
         lineNumber: lineNumber,
         showSectionName: showSectionName
       }, function(response) {
       });
     });
   });
 });
});
