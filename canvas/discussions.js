const reloadDiscussionBoardListener = async () => {
  const url = window.location.href;
  const urlPattern = URL_PATTERN.CANVAS_DISCUSSIONS;
  if (url.match(urlPattern) === null) return;
  await isReadyForDiscussionBoardListener().then( () => {
    reloadDiscussionBoard();
  });
}

const isReadyForDiscussionBoardListener = () => new Promise((resolve, reject) => {
  const interval = setInterval(() => {
    checkDiscussionBoardStatus().then(() => {
      clearInterval(interval);
      resolve();
    }).catch(e => {});
  }, 500);
});

const checkDiscussionBoardStatus = () => new Promise((resolve, reject) => {
  const discussionBoardExists = $('ul.discussion-entries').length > 0;
  (discussionBoardExists) ? resolve(): reject();
});

const reloadDiscussionBoard = async () => {
  const discussionBoard = $('ul.discussion-entries:eq(0)');
  const courseKey = getCourseKey(document.title);
  if (discussionBoard.length) {
    const discussionEntries = $(' > li.entry', discussionBoard);
    discussionEntries.each(function(index) {
      const authorTitle = $(' > article > div.entry-content > header .discussion-title > a', this);
      const replyCount = $(' > div.replies > ul.discussion-entries > li', this).length;
      const articleAuthorId = $(authorTitle).attr('data-student_id');
      const courseId = $(authorTitle).attr('data-course_id');
      let showReply = (selectedSection.length == 0);
      let inSection = false;
      if (courseId in courseMap) {
        const courseKey = courseMap[courseId];
        if (articleAuthorId in studentDict) {
          const articleLoginId = studentDict[articleAuthorId];
          const authorTitleText = $(authorTitle).html().trim();
          let sectionName = '';
          if (courseKey in studentGrade) {
            if (articleLoginId in studentGrade[courseKey]) {
              let studentSection = '';
              if ('Section' in studentGrade[courseKey][articleLoginId]) {
                studentSection = studentGrade[courseKey][articleLoginId]['Section'];
              }
              let studentGroups = '';
              let studentGroups2 = '';
              if ('Groups' in studentGrade[courseKey][articleLoginId]) {
                studentGroups = studentGrade[courseKey][articleLoginId]['Groups'].join(" | ");
              }
              sectionName = (studentGroups.length == 0) ? studentSection : `${studentSection}<br>${studentGroups}`;
              selectedSection.forEach( section => {
                const sectionMatches = section.match(/(\w+-\d+-\w+-(?:Fall|Spring|Summer)-\d{4})-?(.+)?/i);
                if (sectionMatches != undefined) {
                  const selectedSection = sectionMatches[1];
                  const selectedGroups = sectionMatches[2];
                  let output = '';
                  if (selectedSection == studentSection) {
                    if (selectedGroups == undefined) {
                      inSection = true;
                    } else if (selectedGroups == studentGroups) {
                      inSection = true;
                    }
                  }
                }
              });
              if (selectedSection.length == 0 || inSection) {
                showReply = true;
                if (authorTitleText.indexOf(sectionName) == -1){
                  $(authorTitle).append("<br/>" + sectionName);
                }
                showReply = !(showNoReplyPost && replyCount != 0);
              } else {
                showReply = false;
              }
            }
          }
        }
      }
      (showReply)? $(this).show(): $(this).hide();
    }, this);
  }
}
