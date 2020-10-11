const gradeBookListener = async () => {
  const url = window.location.href;
  const urlPattern = URL_PATTERN.CANVAS_GRADEBOOK;
  if (url.match(urlPattern) === null) return;
  const courseKey = getCourseKey(document.title);
  if (courseKey == undefined) return;
  if (!gradebookListenerBuilt) {
    await isReadyForGradebookListener().then( () => {
      buildGradebookListener();
    });
  } else {
    refreshAssignmentColumns();
    await refreshAllCell();
    await showStudentsWithInconsistentGrades();
  }
}

const checkGradebookStatus = () => new Promise((resolve, reject) => {
  const targetNodeExists = $(".grid-canvas").length > 0;
  const columnLoaded = refreshAssignmentColumns();
  (targetNodeExists && columnLoaded) ? resolve(): reject();
});

const isReadyForGradebookListener = () => new Promise((resolve, reject) => {
  const interval = setInterval(() => {
    checkGradebookStatus().then(() => {
      clearInterval(interval);
      resolve();
    }).catch(e => {});
  }, 500);
});

const buildGradebookListener = () => {
  const targetNodes = $(".grid-canvas");
  const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  const myObserver = new MutationObserver(mutationHandler);
  const obsConfig = {
    childList: true,
    characterData: true,
    attributes: true,
    subtree: true
  };
  targetNodes.each(function() {
    myObserver.observe(this, obsConfig);
  });
  gradebookListenerBuilt = true;
}
const refreshAssignmentColumns = () => {
  const columns = $('div.slick-header-columns > .assignment');
  if (columns.length == 0) return false;
  columns.each(function(index) {
    if (autoSaveGrade) {
      const columnId = $(this).attr('id');
      const columnTitle = $('.assignment-name', this).text();
      const assignmentKey = getAssignmentUniqueKey(columnTitle);
      if (assignmentKey != undefined) {
        $(this).addClass('assignment-column');
        let assignmentHash = columnId.match(reAssignment)
        if (assignmentHash !== null) {
          assignmentHash = assignmentHash[0];
          if (!(assignmentHash in hash)) {
            hash[assignmentHash] = assignmentKey;
          }
        }
      }
    } else {
      $(this).removeClass('assignment-column');
    }
  });
  return true;
}

const mutationHandler = async (mutationRecords) => {
  let refreshNeeded = false;
  mutationRecords.forEach(function(mutation) {
    if (mutation.type == "childList" && typeof mutation.addedNodes == "object") {
      let target = $(mutation.addedNodes);
      if (target.hasClass('Grid__GradeCell') || target.hasClass('slick-cell') || target.hasClass('slick-row')) {
        refreshNeeded = true
      }
    }
  });
  if (refreshNeeded) {
    refreshAllCell();
    showStudentsWithInconsistentGrades();
  }
}

const showStudentsWithInconsistentGrades = async () => {
  $(`.student`).removeClass('student-need-attention student-not-graded student-not-found');
  if (onlyShowTextInRed) {
    let pinkBg = [];
    let greyBg = [];
    let orangeBg = [];
    let bgHash = {};
    for (const studentId in inconsistencyMap) {
      bgHash[studentId] = BG_TYPE.NONE;
      for (const assignmentId in inconsistencyMap[studentId]) {
        const bgtype = inconsistencyMap[studentId][assignmentId];
        if (bgtype < bgHash[studentId]) {
          bgHash[studentId] = bgtype;
        }
      }
    }
    for (const studentId in bgHash) {
      const bg = bgHash[studentId];
      switch (bg) {
        case BG_TYPE.PINK:
          pinkBg.push(`.student_${studentId} .student`);
          break;
        case BG_TYPE.ORANGE:
          orangeBg.push(`.student_${studentId} .student`);
          break;
        case BG_TYPE.GREY:
          greyBg.push(`.student_${studentId} .student`);
          break;
      }
    }
    pinkBg = pinkBg.join(',');
    orangeBg = orangeBg.join(',');
    greyBg = greyBg.join(',');
    $(pinkBg).addClass('student-need-attention');
    $(orangeBg).addClass('student-not-graded');
    $(greyBg).addClass('student-not-found');
  }
}
const refreshAllCell = async () => {
  if (autoSaveGrade) {
    const courseKey = getCourseKey(document.title);
    if(!(courseKey in studentGrade)) return;
    $('div.slick-row > div.assignment').each( function(index) {
      refreshSlickCell($(this), courseKey);
    });
  } else {
    $('div.Grid__GradeCell__EndContainer').html("");
  }
}

const refreshSlickCell = async (target, courseKey) => {
  if (courseKey == undefined) return;
  const msgbox = $('div.Grid__GradeCell__EndContainer', target);
  let studentId = target.parent().attr('class').match(reStudent);
  if (studentId == null) return;
  studentId = studentId[1];
  let assignmentId = target.attr('class').match(reAssignment);
  if (assignmentId == null) return;
  assignmentId = assignmentId[0];
  const canvasGrade = $('span.Grade', target).text().trim();
  if (assignmentId in hash) {
    const courseData = studentGrade[courseKey];
    let bgtype = BG_TYPE.NONE;
    if (studentId in studentGrade) {
      const userId = studentGrade[studentId];
      if (userId in courseData) {
        const studentData = courseData[userId];
        const assignmentKey = hash[assignmentId];
        if (assignmentKey in studentData) {
          const webcatGradeInfo = studentData[assignmentKey];
          bgtype = correctGradeHandler(msgbox, canvasGrade, webcatGradeInfo)
        } else {
          bgtype = errorGradeHandler(msgbox, canvasGrade, GRADE_MSG.GRADE_NOT_FETCHED_RED, GRADE_MSG.GRADE_NOT_FETCHED_GREEN);
        }
      } else {
        bgtype = errorGradeHandler(msgbox, canvasGrade, GRADE_MSG.USER_NOT_FOUND_RED, GRADE_MSG.USER_NOT_FOUND_GREEN);
      }
    } else {
      bgtype = errorGradeHandler(msgbox, canvasGrade, GRADE_MSG.STUDENT_NOT_FOUND_RED, GRADE_MSG.STUDENT_NOT_FOUND_GREEN);
    }
    if (!(studentId in inconsistencyMap)) {
      inconsistencyMap[studentId] = {};
    }
    inconsistencyMap[studentId][assignmentId] = bgtype;
  }
}

const correctGradeHandler = (msgbox, canvasGrade, webcatGradeInfo) => {
  let bgtype = BG_TYPE.NONE;
  const graded = webcatGradeInfo['graded'];
  const testingScore = webcatGradeInfo['testingScore'];
  const toolChecks = webcatGradeInfo['toolChecks'];
  let staffScore = webcatGradeInfo['staffScore'];
  if (staffScore == undefined) staffScore = 'Unavailable'
  const latePenalties = webcatGradeInfo['latePenalties'];
  const webcatGrade = webcatGradeInfo['assignmentScore'];
  const gradetip = `Total: ${webcatGrade}&#xa;Testing: ${testingScore}&#xa;ToolChecks: ${toolChecks}&#xa;Staff: ${staffScore}&#xa;Late: ${latePenalties}`;
  if (canvasGrade == '–') {
    if (graded) {
      msgbox.html(`<div class='wceg-red' grade-tip="${gradetip}">WC: ${webcatGrade}</div>`);
      bgtype = BG_TYPE.PINK;
    } else {
      msgbox.html(`<div class='wceg-orange' grade-tip="${gradetip}">NG: ${webcatGrade}</div>`);
      bgtype = BG_TYPE.ORANGE;
    }
  } else {
    const difference = Math.abs(parseFloat(canvasGrade) - parseFloat(webcatGrade));
    if (difference < 0.1) {
      msgbox.html(`<div class='wceg-green' grade-tip="${gradetip}">&#10004;</div>`);
    } else {
      bgtype = BG_TYPE.PINK;
      msgbox.html(`<div class='wceg-red' grade-tip="${gradetip}">WC: ${webcatGrade}</div>`);
    }
  }
  return bgtype;
}
const errorGradeHandler = (msgbox, canvasGrade, message_red, message_green) => {
  let bgtype = BG_TYPE.NONE;
  if (canvasGrade != '–') {
    if (canvasGrade.length > 0) {
      if (parseFloat(canvasGrade) == 0.0) {
        msgbox.html(message_green);
      } else {
        bgtype = BG_TYPE.PINK;
        msgbox.html(message_red);
      }
    } else {
      // When entering
      msgbox.html(message_red);
    }
  }
  return bgtype;
}
