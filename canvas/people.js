const studentRosterListener = async () => {
  const url = window.location.href;
  const urlPattern = URL_PATTERN.CANVAS_PEOPLE;
  if (url.match(urlPattern) === null) return;
  registerStudentRosterListener();
}

const registerStudentRosterListener = () => new Promise((resolve, reject) => {
  const interval = setInterval(() => {
    checkStudentRosterStatus().then(() => {
      listenRosterChanges();
      resolve();
    }).catch(e => {});
  }, 1000);
});

const checkStudentRosterStatus = () => new Promise((resolve, reject) => {
  const rosterTableExists = $('table.roster').length > 0;
  (rosterTableExists) ? resolve(): reject();
});

const listenRosterChanges = () => {
  const rosterTable = $('table.roster');
  const roster = $(' > tbody > tr', rosterTable);
  const currentRosterSize = roster.length;
  if (lastRosterSize == currentRosterSize) return;
  const rosterHead = $(' > thead > tr > th', rosterTable);
  const infoIndex = {'Name':-1, 'Role': -1, 'Login ID': -1, 'count': 0}
  rosterHead.each(function(index) {
    const title = $(this).text().trim();
    if (title in infoIndex) {
      infoIndex[title] = index;
      infoIndex['count'] += 1;
    }
  });
  if (infoIndex['count'] != 3) return;
  const courseKey = getCourseKey(document.title);
  if (!(courseKey in studentGrade)) {
    studentGrade[courseKey] = {};
  }
  const url = window.location.href;
  const urlMatch = url.match(/(?:(?:http|https):\/\/)?auburn.instructure.com\/courses\/(\d+)\/users/i);
  if (urlMatch != null && urlMatch[1] != undefined) {
    const courseId = urlMatch[1];
    courseMap[courseId] = courseKey;
  }

  const courseInfo = studentGrade[courseKey];
  if (!('Tokens' in courseInfo)) {
    courseInfo['Tokens'] = {};
  }
  const nameDict = courseInfo['Tokens'];
  roster.each(function(index) {
    // remove personal pronouns
    const nameTokens = $(this).find('td:eq(' + infoIndex['Name'] + ')').text().replace(REGEX.STUDENT_PRONOUNS, '').trim().split(" ");
    const loginId = $(this).find('td:eq(' + infoIndex['Login ID'] + ')').text().trim();
    const userId = $(this).attr('id').replace(/\D/g,'');
    const sections = $(this).find('td[data-test-id="section-column-cell"] > div.section');
    const role = $(this).find('td:eq(' + infoIndex['Role'] + ')').text().trim();
    if (role != 'Student') return;
    sections.each(function(sectionIndex) {
      const section = $(this).text().trim();
      const courseSectionKey = getCourseKey(section);
      if (courseSectionKey !== undefined ) {
        courseSection.add(courseSectionKey);
        if (!(userId in studentDict)) {
          studentDict[userId] = loginId;
        }
        if (!(loginId in courseInfo)) {
          courseInfo[loginId] = {};
        }
        courseInfo[loginId]['Section'] = courseSectionKey;
        nameTokens.forEach(function(token){
          if (!(token in nameDict)) {
            nameDict[token] = [];
          }
          if (!nameDict[token].includes(loginId)) {
            nameDict[token].push(loginId);
          }
        });
      }
    });
  });
  chrome.storage.local.set({
    studentDict: studentDict,
    studentGrade: studentGrade,
    courseMap: courseMap,
  }, function() {
    lastRosterSize = currentRosterSize;
  });

  chrome.storage.sync.set({
    courseSection: Array.from(courseSection),
  }, function() {});
}
