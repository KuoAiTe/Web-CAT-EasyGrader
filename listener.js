const setUp = () => {
  const title = document.title;
  if (title.includes("View Submissions")){
    if($("textarea").length == 0)
      pageType = 1;
    else
      pageType = 3;
  }
  else if (title.includes("Grade One Submission"))
    pageType = 2;

  switch(pageType) {
    case 1:
      // Submission Page
      // Bind click events
      $(document).on("click", "td.inSection, td.outSection", function() {
        toggleStudent($(this));
      });
      // bind click event
      $(document).on("click", "a[href$='javascript:void(0);'], input.icon", function() {
        $("#webcat_Form_3 tbody:nth-child(2)").html("");
        tableChangeListener();
      });
      // bind table change event
      $(document).on("change", "table", function() {
        $("#webcat_Form_3 tbody:nth-child(2)").html("");
        tableChangeListener();
      });
      $(document).on("keydown", "input", function() {
        tableChangeListener();
      });

      chrome.storage.sync.get({
        studentInSection: [],
      }, function(items) {
        items.studentInSection.reduce((s, e) => s.add(e), studentInSection);
        tableChangeListener();
      });
      tableChangeListener();

  		break;
  	case 2:
  	  // Grade Page
      autoCheckGrade();
      break;
    case 3:
      removeLineNumber();
      break;
    default:
   		break;
  }
}

$(document).ready(function() {
  chrome.storage.local.get({
    studentDict: {},
    studentGrade: {},
  }, function(items) {
    studentDict = items.studentDict;
    studentGrade = items.studentGrade;
    console.log(studentDict);
    console.log(studentGrade);
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
    console.log(courseSection);
    items.courseSection.reduce((s, e) => s.add(e), courseSection);
    studentRosterListener();
    reloadDiscussionBoardListener();
    gradeBookListener();
    setUp();
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
      if (pageType == 1)
        tableChangeListener();
      else if (pageType == 2)
        autoCheckGrade();
      else if (pageType == 3)
        removeLineNumber();
      reloadDiscussionBoardListener();
      gradeBookListener();

      return true;
    });
    $( document ).on( "click", "a.item", function() {
      reloadDiscussionBoardListener();
    });

});
