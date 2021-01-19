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
      getMaximumScoreFromStaff(courseKey, assignmentKey);
      studentList.each(function() {
        refreshRow(courseKey, assignmentKey, $(this));
      });
      isDone = true;
      lastStatus = currentStatus;
    }
  }
  return isDone;
}
const getMaximumScoreFromStaff = (courseKey, assignmentKey) => {
  if (!(courseKey in studentGrade)) return;
  const staffs = $('tbody.top > tr');
  staffs.each(function() {
    const columns = $(' > td', $(this));
    if (columns.length == 7) {
      const userName = columns.eq(1).text().trim();
      const testingScore = parseInt(columns.eq(4).text()) || 0;
      const staffScore = parseInt(columns.eq(5).text()) || 0;
      const totalScore = parseInt(columns.eq(6).text()) || 0;
      const toolChecks = totalScore - testingScore - staffScore;
      if (!('max' in studentGrade[courseKey])) {
        studentGrade[courseKey]['max'] = {};
      }
      if (!(assignmentKey in studentGrade[courseKey]['max'])) {
        studentGrade[courseKey]['max'][assignmentKey] = {
          'maxTestingScore': 0.0,
          'maxToolChecks': 0.0,
          'maxStaffScore': 0.0,
          'maxAssignmentScore': 0.0,
        };
      }
      let newMaxSetting = studentGrade[courseKey]['max'][assignmentKey]
      newMaxSetting['maxTestingScore'] = Math.max(newMaxSetting['maxTestingScore'], testingScore);
      newMaxSetting['maxToolChecks'] = Math.max(newMaxSetting['maxToolChecks'], toolChecks);
      newMaxSetting['maxStaffScore'] = Math.max(newMaxSetting['maxStaffScore'], staffScore);
      newMaxSetting['maxAssignmentScore'] = newMaxSetting['maxTestingScore'] + newMaxSetting['maxToolChecks'] + newMaxSetting['maxStaffScore'];
      if (staffScore >= 100) {
        delete studentGrade[courseKey]['max'][assignmentKey];
      } else {
        studentGrade[courseKey]['max'][assignmentKey] = newMaxSetting;
      }
    }
  });
}
const refreshRow = async (courseKey, assignmentKey, studentRow) => {
  let student_info = $('td', studentRow);
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
    const testingScore = Number(student_info.eq(4).text()) || 0;
    const toolChecks = Number(student_info.eq(5).text()) || 0;
    const staffScore = Number(student_info.eq(6).text());
    const latePenalties = Number(student_info.eq(7).text()) || 0;
    const assignmentScore = Number(student_info.eq(8).text()) || 0;
    const inSection = isStudentInSection(studentName);
    const [ inSelectedSections, sectionNames ] = getSection(courseKey, studentName, studentId);
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
      newMaxSetting['maxTestingScore'] = Math.max(newMaxSetting['maxTestingScore'], testingScore);
      newMaxSetting['maxToolChecks'] = Math.max(newMaxSetting['maxToolChecks'], toolChecks);
      newMaxSetting['maxStaffScore'] = Math.max(newMaxSetting['maxStaffScore'], newMaxSetting['maxAssignmentScore'] - newMaxSetting['maxTestingScore'] - newMaxSetting['maxToolChecks']);
      newMaxSetting['maxAssignmentScore'] = Math.max(newMaxSetting['maxAssignmentScore'], assignmentScore);
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
const getSection = (courseKey, studentName, studentId) => {
  if (!(courseKey in studentGrade)) return;
  const sectionSet = [];
  const potentialSectionSet = {};
  let inSelectedSections = false;
  let studentIdx = [];
  if (studentId.length == 0) {
    const nameTokens = studentName.replace(',', '').trim().split(" ");
    const candidateIdx = findStudentIdByNameTokens(courseKey, nameTokens);
    if (candidateIdx != undefined) {
      candidateIdx.forEach(function(item){
        const loginId = item[0];
        studentIdx.push(loginId);
      });
    }
  } else {
    studentIdx.push(studentId);
  }
  if (selectedSection.length == 0) inSelectedSections = true;
  studentIdx.forEach(function(studentId) {
    if (studentId in studentGrade[courseKey]) {
      let section = '';
      if ('Section' in studentGrade[courseKey][studentId]) {
        fullSectionKey = studentGrade[courseKey][studentId]['Section'];
        const sectionMatches = fullSectionKey.match(/\w+-\d+-(\w+)-(?:Fall|Spring|Summer)-\d{4}/i);
        if (sectionMatches.length == 2) {
          section = sectionMatches[1];
        }
      }
      let groups = '';
      if ('Groups' in studentGrade[courseKey][studentId]) {
        groups = studentGrade[courseKey][studentId]['Groups'].join(" | ");
      }
      const output = `${section}-${groups}`;
      for (section of selectedSection) {
        const sectionMatches = section.match(/(\w+-\d+-\w+-(?:Fall|Spring|Summer)-\d{4})-?(.+)?/i);
        if (sectionMatches != undefined) {
          if (sectionMatches[2] == undefined) {
            if (sectionMatches[1] == fullSectionKey) {
              inSelectedSections = true;
            }
          } else {
            if (sectionMatches[1] == fullSectionKey && sectionMatches[2] == groups) {
              inSelectedSections = true;
            }
          }
        }
      }
      sectionSet.push(output);
    }
  });
  //console.log(potentialSectionSet);
  return [inSelectedSections, sectionSet.join(' | ')];
}
const showSection = (studentId, sectionNames, studetNameDOM, sectionDOM, classAttribute) => {
  if (showSectionName && sectionNames.length > 0) {
    if (sectionDOM.length != 0) {
      sectionDOM.show();
    } else {
      const html = studetNameDOM.html();
      var match = html.match(REGEX.STUDENT_NAME_AND_ID);
      let lastIndex  = html.lastIndexOf(match[match.length - 1]) + match[match.length - 1].length;
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
