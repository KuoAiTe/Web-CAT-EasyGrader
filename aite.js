/**
 * Global settings
 * @author Ai-Te Kuo
 */
var studentInSection = new Set();
var autoFilter = false;
var autoShowGrade = false;
var pageType = 0;
var lock = false;
var disable = false;
var lineNumber;

/**
 * Feteh the form and remove all the information except the student list.
 * @return the student list DOM
 */
function getStudentList() {
  var studentList = null;
  var form = $("#webcat_Form_3");
  var formExist = form.length > 0;
  if (formExist) {
    var parentNode = form.find("tbody:nth-child(2)");
    studentList = parentNode.find("tr");
  }
  return studentList;
}
/**
 * Aite, Kuo
 * Aite, Kuo (azkxxxx0000)
 * Aite, Kuo (azk000)    try #1
 * The function should return Aite Kuo with all of the above examples.
 * @return last name, first name
 */
function getStudentName(tdStudentName) {
  var re = /[A-Za-z]+, [A-Za-z]+/;
  var studentName = tdStudentName.match(re);
  return studentName[0];
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Automatically check "Show grade to student?" if enabled.
 * 
 */
async function autoCheckGrade() {
  if (!autoShowGrade || disable) return;
  var attempts = 0;
  var checkBox;
  while (checkBox = $('input#done'), checkBox.length == 0 && attempts++ < 500)
    await timeout(10);
  var pressed = checkBox.attr('aria-pressed');
  if (!pressed)
    checkBox.click();
}
/**
 * Listen to the page and refresh the table when the table is loaded.
 */
async function oneTimeTableRefreshListener() {
  var attempts = 0;
  var studentList;
  do {
    studentList = getStudentList();
    await timeout(10);
  } while ((studentList == null || studentList.length == 0) && attempts++ < 1000);
  await refreshTable(studentList);
}

/**
 * Refresh the table.
 * If the student is in the set, then assign class attribute "inSection"
 * Otherwise, "outSection"
 * @param studentList an array of DOM objects
 */
async function refreshTable(studentList) {
  if (studentList) {
    var tdStudentDOM, student_info, tdStudentName, studentName;
    var tr;
    var classAttribute = 'unlock';
    var inSection;
    for (var i = 0, len = studentList.length; i < len; i++) {
      inSection = false;
      tr = studentList[i];
      student_info = tr.getElementsByTagName("td");
      if (student_info.length > 2) {
        tdStudentDOM = student_info[1];
        tdStudentName = tdStudentDOM.innerText;
        studentName = getStudentName(tdStudentName);
        inSection = isStudentInSection(studentName);
        classAttribute = (lock) ? "locked " : "unlock ";
        classAttribute += (inSection) ? "inSection" : "outSection";
        if (disable)
          tdStudentDOM.innerHTML = `<span>` + tdStudentName + `</span>`;
        else
          tdStudentDOM.innerHTML = `<span class=" ${classAttribute}">` + tdStudentName + `</span>`;
        tr.style.display = (autoFilter && !inSection && !disable) ? 'none' : 'table-row';
      }

    }
  }
}
/**
 * Check if the student is in the set
 * @param studentName format -> last name, first name
 * @return whether the student if in the set.
 */
function isStudentInSection(studentName) {
  return studentInSection.has(studentName);
}

/**
 * When the user hits the student name on the table,
 * this function will handle it and reassign the DOM attribute.
 * Afterwards, it saves the new student name set to the cloud.
 * @param student DOM
 */
function toggleStudent(student) {
  if (lock || disable) return;
  var tdStudentName = student[0].innerText;
  var studentName = getStudentName(tdStudentName);
  var inSection = isStudentInSection(studentName);
  var lockAttribute = (lock) ? "locked " : "unlock ";
  var classAttribute = (inSection) ? "outSection" : "inSection";
  if (inSection)
    studentInSection.delete(studentName);
  else
    studentInSection.add(studentName);
  // Put the data to the cloud
  chrome.storage.sync.set({
    studentInSection: Array.from(studentInSection)
  }, function() {
    student.removeClass().addClass(lockAttribute).addClass(classAttribute);
  });
}

function setUp() {
  var title = document.title;
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
      $(document).on("click", "span.inSection, span.outSection", function() {
        toggleStudent($(this));
      });
      
      $(document).on("click", "a.active, input.icon", function() {
        var form = $("#webcat_Form_3 tbody:nth-child(2)").html("");
        oneTimeTableRefreshListener();
      });
      $(document).on("change", "table", function() {
        var form = $("#webcat_Form_3 tbody:nth-child(2)").html("");
        oneTimeTableRefreshListener();
      });

      chrome.storage.sync.get({
        studentInSection: [],
      }, function(items) {
        items.studentInSection.reduce((s, e) => s.add(e), studentInSection);
        oneTimeTableRefreshListener();
      });
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

async function removeLineNumber() {
  var attempts = 0;
  var count = 0;
  var object;
  do {
    object = $('iframe').contents().find('td.lineCount');
    await timeout(10);
  } while (object.length == 0 && attempts++ < 300);
  if(lineNumber){
    object.hide();
  }
  else
    object.show();

  do {
    object = $('iframe').contents().find('pre.srcLine');
    await timeout(10);
  } while (object.length == 0 && attempts++ < 300);
  object.each( function() {
    if($(this).html().substr(0,6) == "&nbsp;")
      $(this).html($(this).html().substr(6));
  });
}
$(document).ready(function() {
  chrome.storage.sync.get({
    autoFilter: false,
    lock: false,
    disable: false,
    autoShowGrade: false,
    lineNumber: false,
  }, function(items) {
    autoFilter = items.autoFilter;
    lock = items.lock;
    disable = items.disable;
    autoShowGrade = items.autoShowGrade;
    lineNumber = items.lineNumber;
    setUp();
    oneTimeTableRefreshListener();
  });
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      disable = request.disable;
      autoFilter = request.autoFilter;
      lock = request.lock;
      autoShowGrade = request.autoShowGrade;
      lineNumber = request.lineNumber;
      if (pageType == 1)
        oneTimeTableRefreshListener();
      else if (pageType == 2)
        autoCheckGrade();
      else if (pageType == 3)
        removeLineNumber();
      return true;
    });
});