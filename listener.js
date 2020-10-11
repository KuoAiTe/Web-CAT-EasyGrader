$(document).ready(function() {
  chrome.storage.local.get({
    studentDict: {},
    studentGrade: {},
  }, function(items) {
    studentDict = items.studentDict;
    studentGrade = items.studentGrade;
    //console.log(studentDict);
    //console.log(studentGrade);
  });
  chrome.storage.sync.get({
    autoFilter: false,
    lock: false,
    disable: false,
    showSectionName: false,
    showNoReplyPost: false,
    onlyShowTextInRed: false,
    autoSaveGrade: false,
    autoShowGrade: false,
    lineNumber: false,
    selectedSection: [],
    courseSection: [],
  }, function(items) {
    autoFilter = items.autoFilter;
    lock = items.lock;
    disable = items.disable;
    showNoReplyPost = items.showNoReplyPost;
    onlyShowTextInRed = items.onlyShowTextInRed;
    autoSaveGrade = items.autoSaveGrade;
    showSectionName = items.showSectionName;
    autoShowGrade = items.autoShowGrade;
    lineNumber = items.lineNumber;
    selectedSection = items.selectedSection;
    items.courseSection.reduce((s, e) => s.add(e), courseSection);
    studentRosterListener();
    reloadDiscussionBoardListener();
    gradeBookListener();
    webcatListener();
  });
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.disable !== undefined)
        disable = request.disable;
      if (request.autoFilter !== undefined)
        autoFilter = request.autoFilter;
      if (request.lock !== undefined)
        lock = request.lock;
      if (request.autoShowGrade !== undefined)
        autoShowGrade = request.autoShowGrade;
      if (request.lineNumber !== undefined)
        lineNumber = request.lineNumber;
      if (request.studentDict !== undefined)
        studentDict = request.studentDict;
      if (request.studentGrade !== undefined)
        studentGrade = request.studentGrade;
      if (request.courseSection !== undefined) {
        courseSection.clear();
        request.courseSection.reduce((s, e) => s.add(e), courseSection);
      }
      if (request.selectedSection !== undefined)
        selectedSection = request.selectedSection;
      if (request.showSectionName !== undefined)
        showSectionName = request.showSectionName;
      if (request.showNoReplyPost !== undefined)
        showNoReplyPost = request.showNoReplyPost;
      if (request.onlyShowTextInRed !== undefined)
        onlyShowTextInRed = request.onlyShowTextInRed;
      if (request.autoSaveGrade !== undefined)
        autoSaveGrade = request.autoSaveGrade;
      webcatListener();
      reloadDiscussionBoardListener();
      gradeBookListener();

      return true;
    });
    $( document ).on( "click", "a.item", function() {
      reloadDiscussionBoardListener();
    });

});
