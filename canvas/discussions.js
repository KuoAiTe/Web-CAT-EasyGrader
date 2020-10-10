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
  if (discussionBoard.length) {
    const discussionEntries = $(' > li.entry', discussionBoard);
    discussionEntries.each(function(index) {
      const authorTitle = $(' > article > div.entry-content > header .discussion-title > a', this);
      const replyCount = $(' > div.replies > ul.discussion-entries > li', this).length;
      const articleAuthorId = $(authorTitle).attr('data-student_id');
      const authorTitleText = $(authorTitle).html().trim();
      let showReply = (selectedSection.length == 0);
      if (articleAuthorId !== undefined) {
        if (articleAuthorId in studentDict) {
          let inSection = false;
          selectedSection.forEach( section => inSection |= (section in studentDict[articleAuthorId]));
          if (selectedSection.length == 0 || inSection) {
            showReply = true;
            for (const sectionName in studentDict[articleAuthorId]) {
              if (authorTitleText.indexOf(sectionName) == -1)
                $(authorTitle).append("<br/>" + sectionName);
            }
            showReply = !(showNoReplyPost && replyCount != 0);
          } else {
            showReply = false;
          }
        }
      }
      (showReply)? $(this).show(): $(this).hide();
    }, this);
  }
}
