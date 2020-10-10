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
  const infoIndex = {'Role': -1, 'Login ID': -1, 'count': 0}
  rosterHead.each(function(index) {
    const title = $(this).text().trim();
    if (title in infoIndex) {
      infoIndex[title] = index;
      infoIndex['count'] += 1;
    }
  });
  if (infoIndex['count'] != 2) return;
  roster.each(function(index) {
    const loginId = $(this).find('td:eq(' + infoIndex['Login ID'] + ')').text().trim();
    const userId = $(this).attr('id').replace(/\D/g,'');
    const sections = $(this).find('td[data-test-id="section-column-cell"] > div.section');
    const role = $(this).find('td:eq(' + infoIndex['Role'] + ')').text().trim();
    if (role != 'Student') return;
    sections.each(function(sectionIndex) {
      const section = $(this).text().trim();
      const courseKey = getCourseKey(section);
      if (courseKey !== undefined ) {
        courseSection.add(courseKey);
        if (!(userId in studentDict)) {
          studentDict[userId] = {};
          studentDict[userId][courseKey] = {};
        }
        if (userId.length > 0 && loginId.length > 0) {
          studentGrade[userId] = loginId;
        }
        if (!(loginId in studentDict)) {
          studentDict[loginId] = {};
          studentDict[loginId][courseKey] = {};
        }
      }
    });
  });
  chrome.storage.local.set({
    studentDict: studentDict,
    studentGrade: studentGrade,
  }, function() {
    lastRosterSize = currentRosterSize;
  });

  chrome.storage.sync.set({
    courseSection: Array.from(courseSection),
  }, function() {});
}
