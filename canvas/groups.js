const studentGroupListener = async () => {
  const url = window.location.href;
  const urlPattern = URL_PATTERN.CANVAS_PEOPLE_GROUPS;
  if (url.match(urlPattern) === null) return;
  registerStudentGroupsListener();
}

const checkStudentGroupStatus = () => new Promise((resolve, reject) => {
  const groupTableExists = $('ul.collectionViewItems.unstyled.groups-list').length > 0;
  (groupTableExists) ? resolve(): reject();
});

const registerStudentGroupsListener = () => new Promise((resolve, reject) => {
  const interval = setInterval(() => {
    checkStudentGroupStatus().then(() => {
      groupListener();
      resolve();
      clearInterval(interval);
    }).catch(e => {});
  }, 1000);
});

const groupListener = () => {
  const targetNodes = $('ul.collectionViewItems.unstyled');
  const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  const myObserver = new MutationObserver(mutationHandlerForGroupChanges);
  const obsConfig = {
    childList: true,
    characterData: true,
    attributes: false,
    subtree: true
  };
  targetNodes.each(function() {
    myObserver.observe(this, obsConfig);
  });
}

const mutationHandlerForGroupChanges = async (mutationRecords) => {
  const courseKey = getCourseKey(document.title);
  if (courseKey == undefined) return;
  if (!(courseKey in studentGrade)) {
    studentGrade[courseKey] = {};
  }
  mutationRecords.forEach(function(mutation) {
    if (mutation.type == "childList" && typeof mutation.addedNodes == "object") {
      const target = $(mutation.addedNodes);
      if (target.hasClass('group-user')) {
        const groupKey = $('span.group-name', $(mutation.target).parent().parent()).text().replace(/\[.+\]/i, '').trim();
        const nameTokens = $('.group-user-name', target).text().replace(REGEX.STUDENT_PRONOUNS, '').trim().split(" ");
        const candidateIdx = findStudentIdByNameTokens(courseKey, nameTokens);
        const sectionKey = `${courseKey}-${groupKey}`;
        candidateIdx.forEach(function(item){
          const loginId = item[0];
          if (!(loginId in studentGrade[courseKey])) {
            studentGrade[courseKey][loginId] = {};
          }
          if (!('Groups' in studentGrade[courseKey][loginId])) {
            studentGrade[courseKey][loginId]['Groups'] = [];
          }
          if (!studentGrade[courseKey][loginId]['Groups'].includes(groupKey)) {
            studentGrade[courseKey][loginId]['Groups'].push(groupKey);
          }
          courseSection.add(sectionKey);
        });
      }
    }
  });
  chrome.storage.local.set({
    studentGrade: studentGrade,
  }, function() {
  });
  chrome.storage.sync.set({
    courseSection: Array.from(courseSection),
  }, function() {});

}
