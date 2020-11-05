const webcatListener = () => {
  const url = window.location.href;
  const urlPattern = URL_PATTERN.WEBCAT;
  if (url.match(urlPattern) === null) return;
  const title = document.title;
  if (title.includes("View Submissions"))
    pageType = ($("textarea").length == 0)? 1 : 3;
  else if (title.includes("Grade One Submission"))
    pageType = 2;

  switch(pageType) {
    case 1:
      // Submission Page
      if(!webcatListenerBuilt) {
        webcatListenerBuilt = true;
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
      }
      tableChangeListener();
  		break;
  	case 2:
      autoCheckGrade();
      break;
    case 3:
      removeLineNumber();
      break;
  }
}

const tableChangeListener = async () => {
  let isDone = false;
  do {
    isDone = await refreshTable();
    await timeout(50);
  } while (!isDone);
  chrome.storage.local.set({
    studentGrade: studentGrade,
  }, function() {});
}

/**
 * Automatically check off "Show grade to student?" if enabled.
 */
const autoCheckGrade = async () => {
  if (!autoShowGrade || disable) return;
  let checkBox = null;
  let attempts = 0;
  const interval = setInterval(() => {
    new Promise((resolve, reject) => {
      checkBox = $('input#done');
      (checkBox.length > 0 || attemps++ > 500) ? resolve(): reject();
    }).then(() => {
      const isPressed = checkBox.attr('aria-pressed');
      if (isPressed == "false" || isPressed == null) {
        checkBox.click();
      }
      clearInterval(interval);
      resolve();
    }).catch(e => {});
  }, 100);
}
/**
 * Refresh the table.
 * If the student is in the set, then assign class attribute "inSection"
 * Otherwise, "outSection"
 * @param studentList an array of DOM objects
 */
const refreshTable = async () => {
  const form = $("#webcat_Form_3");
  const formExist = form.length > 0;
  let isDone = false;
  if (formExist) {
    const studentList = getStudentList();
    const inCount = studentList.find('.inSection').length;
    const outCount = studentList.find('.outSection').length;
    const currentStatus = `${inCount}-${outCount}-${autoFilter}-${lock}-${disable}-${showSectionName}-${selectedSection.join()}`;
    if (studentList.length > 0 && (inCount == 0 || outCount == 0 || lastStatus != currentStatus)) {
      const title = $('div.dijitTitlePaneTitleFocus > span.dijitTitlePaneTextNode').first().text();
      const courseKey  = getCourseKey(title);
      if (courseKey == undefined) return false;
      const assignmentKey = getAssignmentUniqueKey(title);
      if (assignmentKey == undefined) return false;
      studentList.each(function() {
        refreshRow(courseKey, assignmentKey, $(this));
      });
      isDone = true;
      lastStatus = currentStatus;
    }
  }
  return isDone;
}

const refreshRow = async (courseKey, assignmentKey, studentRow) => {
  let student_info = $('td', studentRow);
  //console.log(student_info);
  //console.log(student_info.length);
  if (student_info && student_info.length > 1) {
    const studetNameDOM = student_info.eq(1);
    studetNameDOM.removeClass('locked unlock inSection outSection');
    const sectionDOM = $('span.section', studetNameDOM);
    if (disable) {
      studentRow.show();
      sectionDOM.hide();
      return ;
    }

    let studentNameFullText = studetNameDOM.text();
    const splitPoint = studentNameFullText.indexOf(" -");
    if (splitPoint != -1) {
      studentNameFullText = studentNameFullText.substring(0, splitPoint);
    }
    const studentName = getStudentName(studentNameFullText);
    const studentId = getStudentId(studentNameFullText);
    const testingScore = Number(student_info.eq(4).text());
    const toolChecks = Number(student_info.eq(5).text());
    const staffScore = Number(student_info.eq(6).text());
    const latePenalties = Number(student_info.eq(7).text());
    const assignmentScore = Number(student_info.eq(8).text());
    const inSection = isStudentInSection(studentName);
    const [ inSelectedSections, sectionNames ] = getSection(studentId);
    const classAttribute = `${(lock) ? "locked " : "unlock "}${(inSection) ? "inSection" : "outSection"}`;
    studetNameDOM.addClass(classAttribute);
    showSection(studentId, sectionNames, studetNameDOM, sectionDOM, classAttribute);
    (autoFilter && !(inSection || inSelectedSections) && !disable) ? studentRow.hide() : studentRow.show();
    if (studentId.length > 0 && student_info.length == 9) {
      if (!(courseKey in studentGrade)) {
        studentGrade[courseKey] = {};
      }
      if (!(studentId in studentGrade[courseKey])) {
        studentGrade[courseKey][studentId] = {};
      }

      if (!('max' in studentGrade[courseKey])) {
        studentGrade[courseKey]['max'] = {}
      }

      if (!(assignmentKey in studentGrade[courseKey]['max'])) {
        studentGrade[courseKey]['max'][assignmentKey] = {
          'maxTestingScore': 0.0,
          'maxToolChecks': 0.0,
          'maxStaffScore': 0.0,
          'maxAssignmentScore': 0.0,
        };
      }
      let graded = false;
      if (assignmentKey.indexOf("Activity") != -1) {
        graded = true;
      } else {
        graded = !isNaN(staffScore);
      }
      let newMaxSetting = studentGrade[courseKey]['max'][assignmentKey];
      newMaxSetting['maxAssignmentScore'] = Math.max(Number(newMaxSetting['maxAssignmentScore']), Number(assignmentScore));
      newMaxSetting['maxTestingScore'] = Math.max(Number(newMaxSetting['maxTestingScore']), Number(testingScore));
      newMaxSetting['maxToolChecks'] = Math.max(Number(newMaxSetting['maxToolChecks']), Number(toolChecks));
      newMaxSetting['maxStaffScore'] = Math.max(Number(newMaxSetting['maxStaffScore']), Number(newMaxSetting['maxAssignmentScore'] - newMaxSetting['maxTestingScore'] - newMaxSetting['maxToolChecks']));
      studentGrade[courseKey]['max'][assignmentKey] = newMaxSetting;
      studentGrade[courseKey][studentId][assignmentKey] = {
        'graded': graded,
        'testingScore': testingScore,
        'toolChecks': toolChecks,
        'staffScore': staffScore,
        'latePenalties': latePenalties,
        'assignmentScore': assignmentScore,
      };
    }
  }
}
const getSection = (studentId) => {
  const sectionSet = [];
  let inSelectedSections = false;
  if (studentId in studentDict) {
    for (const [key, value] of Object.entries(studentDict[studentId])) {
      sectionSet.push(key);
      for (section of selectedSection) {
        if (section == key) {
          inSelectedSections = true;
        }
      }
    }
  }
  return [inSelectedSections, sectionSet.join(' ')];
}
const showSection = (studentId, sectionNames, studetNameDOM, sectionDOM, classAttribute) => {
  if (showSectionName && sectionNames.length > 0) {
    if (sectionDOM.length != 0) {
      sectionDOM.show();
    } else {
      const html = studetNameDOM.html();
      var match = html.match(REGEX.STUDENT_NAME_AND_ID);
      var firstIndex = html.indexOf(match[0]);
      var lastIndex  = html.lastIndexOf(match[match.length-1]);
      const newhtml = html.substring(0, lastIndex) + `<span class='section'> - ${sectionNames}</span>` +  html.substring(lastIndex);
      studetNameDOM.html(newhtml);
    }
  } else {
    sectionDOM.hide();
  }
}
/**
 * When the user hits the student name on the table,
 * this function will handle it and reassign the DOM attribute.
 * Afterwards, it saves the new student name set to the cloud.
 * @param student DOM
 */
const toggleStudent = (student) => {
  if (lock || disable) return;
  const studentNameFullText = student[0].innerText;
  const studentName = getStudentName(studentNameFullText);
  const studentId = getStudentId(studentNameFullText);
  const inSection = isStudentInSection(studentName);
  //console.log(studentName + " " + studentId);
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
