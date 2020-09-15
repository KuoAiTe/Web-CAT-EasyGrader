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
var showSectionName = false;
var showNoReplyPost = false;
var autoSaveGrade = false;
var lineNumber;
var selectedSection = [];
var studentDict = {};
var studentGrade = {};
var courseSection = new Set();
var lastStatus = '';
const re = /[^\(\)]+(?: \(([a-zA-z0-9]{7,10})\))?/g;
/**
 * Feteh the form and remove all the information except the student list.
 * @return the student list DOM
 */
function getStudentList() {
  let studentList = null;
  const form = $("#webcat_Form_3");
  const formExist = form.length > 0;
  if (formExist) {
    const parentNode = form.find("tbody:nth-child(2)");
    studentList = parentNode.find("tr");
  }
  return studentList;
}

/**
 * Check if the student is in the set
 * @param studentName format -> last name, first name
 * @return whether the student if in the set.
 */
function isStudentInSection(studentName) {
  return studentInSection.has(studentName);
}

function isStudentInSectionByIdOrName(studentName, studentId) {
  if (studentId.length == 0) return false;
  return studentName in studentDict || studentId in studentDict;
}

/**
 * Aite, Kuo
 * Aite, Kuo (azkxxxx0000)
 * Aite, Kuo (azk000)    try #1
 * azk0103 (azk0103)
 * The function should return Aite Kuo with all of the above examples.
 * @return full name
 */
function getStudentName(tdStudentName) {
  tdStudentName = tdStudentName.trim();
  const studentName = tdStudentName.match(re);
  if (studentName.length > 0)
    return studentName[0].trim();
  else
    return tdStudentName;
}

function getStudentId(tdStudentName) {
 tdStudentName = tdStudentName.trim();
  const studentName = tdStudentName.match(re);
  if (studentName.length > 1)
    return studentName[1].trim();
  else
    return "";
}
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Automatically check off "Show grade to student?" if enabled.
 *
 */
async function autoCheckGrade() {
  if (!autoShowGrade || disable) return;
  let checkBox = null, attempts = 0;
  while (checkBox = $('input#done'), checkBox.length == 0 && attempts++ < 500)
    await timeout(10);
  const isPressed = checkBox.attr('aria-pressed');
  if (!isPressed)
    checkBox.click();
}
/**
 * Refresh the table.
 * If the student is in the set, then assign class attribute "inSection"
 * Otherwise, "outSection"
 * @param studentList an array of DOM objects
 */
async function refreshTable() {
  const form = $("#webcat_Form_3");
  const formExist = form.length > 0;
  const regex = /(?:(?:(Project) (\d\d)([A-Za-z]?) Completed Code)|(?:(Activity) (\d\d)([A-Za-z]?)))/ig;
  let isDone = false;
  if (formExist) {
    let studentList = getStudentList();
    const inCount = studentList.find('.inSection').length;
    const outCount = studentList.find('.outSection').length;
    const currentStatus = inCount + "-" + outCount + "-" + autoFilter + "-" + lock + "-" + disable;
    if (studentList && (inCount == 0 || outCount == 0 || lastStatus != currentStatus)) {
      let tdStudentDOM, assignmentScore, student_info, tdStudentName, studentName, tr, section, inSection, inSectionFromCanvas, classAttribute = 'unlock';
      const title = $('span.dijitTitlePaneTextNode').text();
      const titleMatch = [...title.matchAll(regex)][0];
      let titleKey = undefined;
      if (titleMatch && titleMatch[1] !== undefined && titleMatch[2] !== undefined && titleMatch[3] !== undefined) titleKey = titleMatch[1] + "-" + parseInt(titleMatch[2],10) + titleMatch[3];
      else if (titleMatch && titleMatch[4] !== undefined && titleMatch[5] !== undefined && titleMatch[6] !== undefined) titleKey = titleMatch[4] + "-" + parseInt(titleMatch[5],10) + titleMatch[6];
      for (let i = 0, len = studentList.length; i < len; i++) {
        inSection = false;
        tr = studentList[i];
        student_info = tr.getElementsByTagName("td");
        if (student_info && student_info.length > 1) {
          tdStudentDOM = student_info[1];
          tdStudentName = tdStudentDOM.innerText;
          const splitPoint = tdStudentName.indexOf(" |");
          if (splitPoint != -1) {
            tdStudentName = tdStudentName.substring(0,splitPoint);
          }
          studentName = getStudentName(tdStudentName);
          studentId = getStudentId(tdStudentName);
          if (student_info.length == 9)
            assignmentScore = Number(student_info[8].innerText);
          else
            assignmentScore = undefined;
          inSection = isStudentInSection(studentName);
          inSectionFromCanvas = isStudentInSectionByIdOrName(studentName, studentId);
          classAttribute = (lock) ? "locked " : "unlock ";
          classAttribute += (inSection) ? "inSection" : "outSection";
          if (disable) {
            tdStudentDOM.innerHTML = `<span>` + tdStudentName + `</span>`;
          } else {
            section = '';
            if (inSectionFromCanvas) {
              if (studentName in studentDict) {
                for (const [key, value] of Object.entries(studentDict[studentName])) {
                  section += `${key} `;
                }
              } else if (studentId in studentDict) {
                for (const [key, value] of Object.entries(studentDict[studentId])) {
                  section += `${key} `;
                }
              }
            }
            if (showSectionName && section.length > 0) {
              tdStudentDOM.innerHTML = `<span class=" ${classAttribute}">` + tdStudentName + ' | ' + section + `</span>`;
            } else {
              tdStudentDOM.innerHTML = `<span class=" ${classAttribute}">` + tdStudentName + `</span>`;
            }
          }
          tr.style.display = (autoFilter && !inSection && !disable) ? 'none' : 'table-row';
          if (titleKey && studentId.length > 0) {
            if (!(studentId in studentGrade)) {
              studentGrade[studentId] = {};
            }
            if (assignmentScore >= 0)
              studentGrade[studentId][titleKey] = assignmentScore;
            else
              delete studentGrade[studentId][titleKey];
          }
        }
        isDone = true;
      }
  		chrome.storage.local.set({
         studentGrade: studentGrade,
       }, function() {
         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {studentGrade: studentGrade}, function(response) {
          });
         });
      });
      lastStatus = currentStatus;
    }
  }
  return isDone;
}
/**
 * When the user hits the student name on the table,
 * this function will handle it and reassign the DOM attribute.
 * Afterwards, it saves the new student name set to the cloud.
 * @param student DOM
 */
function toggleStudent(student) {
  if (lock || disable) return;
  const tdStudentName = student[0].innerText;
  const studentName = getStudentName(tdStudentName);
  const studentId = getStudentId(tdStudentName);
  const inSection = isStudentInSection(studentName);
  console.log(studentName + " " + studentId);
  const lockAttribute = (lock) ? "locked " : "unlock ";
  const classAttribute = (inSection) ? "outSection" : "inSection";
  (inSection) ? studentInSection.delete(studentName): studentInSection.add(studentName);
  // Put the data to the cloud
  chrome.storage.sync.set({
    studentInSection: Array.from(studentInSection)
  }, function() {
    student.removeClass().addClass(lockAttribute).addClass(classAttribute);
  });
}
async function tableChangeListener(){
  let isDone = false;
  do {
    await refreshTable().then((value) => {
      isDone = value;
    });
    await timeout(50);
  } while (!isDone);
}
function setUp() {
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
      $(document).on("click", "span.inSection, span.outSection", function() {
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
async function hideLineNumbers(){
  let attempts = 0;
  let lineNumbers;
  do {
    lineNumbers = $('iframe').contents().find('td.lineCount');
    await timeout(5);
  } while (lineNumbers.length == 0 && attempts++ < 500);
  (lineNumber) ? lineNumbers.hide() : lineNumbers.show();
  // Remove indentation
  lineNumbers.each( function() {
    if($(this).html().substr(0,6) == "&nbsp;")
      $(this).html($(this).html().substr(6));
  });
}
async function hideMessageBoxes(){
  let attempts = 0;
  let messageBoxes;
  do {
    messageBoxes = $('iframe').contents().find('td.messageBox');
    await timeout(5);
  } while (messageBoxes.length == 0 && attempts++ < 500);
  (lineNumber) ? messageBoxes.hide() : messageBoxes.show();
}
async function removeSrcLines(){
  let attempts = 0;
  let srcLines;
  do {
    srcLines = $('iframe').contents().find('pre.srcLine');
    await timeout(10);
  } while (srcLines.length == 0 && attempts++ < 300);
}
function removeLineNumber() {
  hideLineNumbers();
  hideMessageBoxes();
  removeSrcLines();
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
    autoSaveGrade: false,
    autoShowGrade: false,
    lineNumber: false,
    selectedSection: [],
  }, function(items) {
    autoFilter = items.autoFilter;
    lock = items.lock;
    disable = items.disable;
    showNoReplyPost = items.showNoReplyPost;
    autoSaveGrade = items.autoSaveGrade;
    showSectionName = items.showSectionName;
    autoShowGrade = items.autoShowGrade;
    lineNumber = items.lineNumber;
    selectedSection = items.selectedSection;
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
      if (request.autoSaveGrade !== undefined)
        autoSaveGrade = request.autoSaveGrade;
      if (pageType == 1)
        tableChangeListener();
      else if (pageType == 2)
        autoCheckGrade();
      else if (pageType == 3)
        removeLineNumber();
      return true;
    });
});
