
/**
 * Feteh the form and remove all the information except the student list.
 * @return the student list DOM
 */
function getStudentList() {
  return $("#webcat_Form_3 > div.dijitContentPane > table > tbody:nth-child(2) > tr");
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
 * Given a student name and id, check if it is in the section.
 * @param studentName example: Ai-Te, Kuo
 * @param studentId exapmle: abc1234
 * @return whether the student if in the set.
 */
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
  const studentName = tdStudentName.match(REGEX.STUDENT_NAME_AND_ID);
  if (studentName.length > 0)
    return studentName[0].trim();
  else
    return tdStudentName;
}

function getStudentId(tdStudentName) {
 tdStudentName = tdStudentName.trim();
  const studentName = tdStudentName.match(REGEX.STUDENT_NAME_AND_ID);
  if (studentName.length > 1)
    return studentName[1].trim();
  else
    return "";
}
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Given a title, return the course key
 * ... (COMP-1210-001-Fall-2020) ... -> COMP-1210-001-Fall-2020
 * ... (COMP-1210-002-Spring-2021) ... -> COMP-1210-002-Spring-2021
 * ... (COMP-1210-Fall-2020) ... -> undefined
 * @return the right side
 */
function getCourseKey(str) {
    const courseName = str.match(/\w+-\d+-\w+/i);
    const courseYearMatch = str.match(/(Fall|Spring|Summer) (\d{4})/i);
    let courseKey = undefined;
    if (courseName != undefined && courseYearMatch != undefined) {
      courseKey = `${courseName}-${courseYearMatch[1]}-${courseYearMatch[2]}`;
    }
    if (courseKey == undefined) {
      // Example: Submissions for COMP 1213 (COMP-1213-Spring-2021) M01 Activity 01 (max 10 submits) -> COMP-1213-001-Fall-2021
      const courseKeyMatch = str.match(/\w+-\d+-\w+-(?:Fall|Spring|Summer)-\d{4}/i);
      if (courseKeyMatch != undefined) {
        courseKey = courseKeyMatch[0];
      }
    }
    return courseKey;
}
/**
 * Given a title, return submission key
 * M1 Activity -> Activity-1
 * N1 Activity -> Activity-1
 * N1A Activity -> Activity-1A
 * Activity 01 -> Activity-1
 * Activity 01A -> Activity-1A
 * Activity 0001A -> Activity-1A
 * Activity 1A -> Activity-1A
 * Act 01 -> Activity-01
 * M6 Project -> Project-6
 * Submissions for CPSC 1213 (CPSC-1213-AO1-Fall-2020) M1 Project -> Project-1
 * Submissions for CPSC 1213 (CPSC-1213-AO1-Fall-2020) M6 Project (Completed Code) -> Project-6
 * Submissions for CPSC 1223 (CPSC-1223-AO1-Fall-2020) M1 Activity (max 10 submits) -> Activity-1
 * Submissions for CPSC 1223 (CPSC-1223-AO1-Fall-2020) M2 Project Completed Code (max 10 submits) -> Project-2
 * Submissions for CPSC 1223 (CPSC-1223-AO1-Fall-2020) M2 Project  Skeleton Code (ungraded) -> undefined
 * Submissions for CPSC 1223 (CPSC-1223-AO1-Fall-2020) M02A Project Completed Code (max 10 submits) -> Project-2A
 * Submissions for COMP 1210 (COMP-1210-Fall-2020) Project 08A Completed Code (max 10 submits) -> Project-8A
 * M1: Activity 1 -> Activity-1
 * M6: Project 6 -> Project-6
 * @return the right side
 */
function getAssignmentUniqueKey(assignmentName){
  if (assignmentName == null) return undefined;
  assignmentName = assignmentName.trim();
  const regex = /(?:\w(\d+\w?))?:? *(Project|Proj|Pro|Activity|Actv|Act) *(\d+\w?)?/ig;
  const assignmentTypeMap = { 'Proj': 'Project', 'Pro': 'Project', 'Project': 'Project', 'Act':'Activity', 'Actv':'Activity', 'Activity': 'Activity'};
  const isSkeletonCode = (assignmentName.search(/Skeleton/i) > 0);
  if (!isSkeletonCode) {
    let result = [...assignmentName.matchAll(regex)][0];
    let assignmentType = undefined;
    let assignmentKey = undefined;
    if (result !== undefined) {
     assignmentType = assignmentTypeMap[result[2]];
     assignmentKey = (result[3] != undefined)? result[3] : result[1];
     if (assignmentKey !== undefined && assignmentKey.length > 1)
      assignmentKey = assignmentKey.replace(/^0+/, '');
    }
    const key = `${assignmentType}-${assignmentKey}`;
    if ( assignmentType != undefined && assignmentKey != undefined) {
     return key;
    }
  }
  return undefined;
}

function findStudentIdByNameTokens(courseKey, nameTokens) {
  if (!(courseKey in studentGrade)) return undefined;
  const courseInfo = studentGrade[courseKey];
  if (!('Tokens' in courseInfo)) return undefined;
  const nameDict = courseInfo['Tokens'];
  const potentialSet = {};
  nameTokens.forEach(function(token, i){
    if (token in nameDict) {
      nameDict[token].forEach(function(loginId){
        if (!(loginId in potentialSet)) {
          potentialSet[loginId] = 0;
        }
        potentialSet[loginId] += 1;
      });
    }
  });
  var keyValues = [];
  for (var key in potentialSet) {
    keyValues.push([key, potentialSet[key] ])
  }
  keyValues.sort(function compare(kv1, kv2) {
    return kv2[1] - kv1[1];
  });
  let candidateIdx = [];
  if (keyValues.length > 0) {
    keyValues.forEach(function(item){
      const key = item[0];
      const value = item[1];
      if (value == nameTokens.length) {
        candidateIdx.push([key, value]);
      }
    });
  }
  return candidateIdx;
}
