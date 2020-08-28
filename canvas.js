
var lastRosterSize = 0
async function studentRosterListener(){
  const url = window.location.href;
  const pattern = /((http|ftp|https):\/\/)?auburn.instructure.com\/courses\/[0-9]*\/users/ig;
  const flags = 'ig';
  const regex = new RegExp(pattern, flags);
  if (!url.match(regex)) return;
  var checkExist = setInterval(function() {
    const rosterTable = $('table.roster');
    if (rosterTable.length) {
      const roster = $(' > tbody > tr', rosterTable);
      const currentRosterSize = roster.length;
      if (lastRosterSize == currentRosterSize) return;
      console.log("change !!");
      const rosterHead = $(' > thead > tr > th', rosterTable);
      let studentNameIndex = -1;
      let loginIdIndex = -1;
      let roleIdIndex = -1;
      let count = 0;
      rosterHead.each(function(index) {
        const title = $(this).text().trim();
        switch (title) {
          case 'Name':
            count += 1;
            studentNameIndex = index;
            break;
          case 'Role':
            count += 1;
            roleIdIndex = index;
            break;
          case 'Login ID':
            count += 1;
            loginIdIndex = index;
            break;
          default:
            break;
        }
      });
      if (count != 3) return;
      roster.each(function(index) {
        const loginId = $(this).find('td:eq(' + loginIdIndex + ')').text().trim();
        const userId = $(this).attr('id').replace(/\D/g,'');
        const sections = $(this).find('td[data-test-id="section-column-cell"] > div.section');
        const role = $(this).find('td:eq(' + roleIdIndex + ')').text().trim();
        if (role == 'Student') {
          sections.each(function(sectionIndex) {
            const section = $(this).text().trim();
            if (section.length > 0 ) {
              courseSection.add(section);
              if (!(userId in studentDict)) {
                studentDict[userId] = {};
                studentDict[userId][section] = {};
              }
              if (!(loginId in studentDict)) {
                studentDict[loginId] = {};
                studentDict[loginId][section] = {};
              }
            }
          }, this);
        }
      }, this);
      chrome.storage.local.set({
        studentDict: studentDict
      }, function() {
        lastRosterSize = currentRosterSize;
      });

      chrome.storage.sync.set({
        courseSection: Array.from(courseSection),
      }, function() {});
    }
  }, 500);
}

async function discussionBoardListener() {
  const url = window.location.href;
  const pattern = "/((http|ftp|https):\/\/)?auburn.instructure.com/courses/[1-9]*/discussion_topics/[1-9]*";
  const flags = 'ig';
  const regex = new RegExp(pattern, flags);
  if (!url.match(regex)) return;
  var checkExist = setInterval(function() {
    const discussionBoard = $('ul.discussion-entries');
    if (discussionBoard.length) {
      clearInterval(checkExist);
      reloadDiscussionBoard();
    }
  }, 100);
}
function reloadDiscussionBoard(){
  const discussionBoard = $('ul.discussion-entries:eq(0)');
  if (discussionBoard.length) {
    const discussionEntries = $(' > li.entry', discussionBoard);
    discussionEntries.each(function(index) {
      const authorTitle = $(' > article > div.entry-content > header .discussion-title > a', this);
      const replyCount = $(' > div.replies > ul.discussion-entries > li', this).length;
      const articleAuthorId = $(authorTitle).attr('data-student_id');
      const authorTitleText = $(authorTitle).html().trim();
      if (articleAuthorId !== undefined) {
        if (articleAuthorId in studentDict) {
          let inSection = false;
          selectedSection.forEach( section => {
            if (section in studentDict[articleAuthorId])
              inSection = true;
          });
          if (selectedSection.length == 0 || inSection) {
            for (var sectionName in studentDict[articleAuthorId]) {
              if (authorTitleText.indexOf(sectionName) == -1)
                $(authorTitle).append("<br/>" + sectionName);
            }
            if (showNoReplyPost) {
              if (replyCount == 0)
                $(this).show();
              else
                $(this).hide();
            } else {
              $(this).show();
            }
          } else {
            $(this).hide();
          }
        } else {
          if (selectedSection.length == 0){
            $(this).show();
          } else {
            $(this).hide();
          }
        }
      } else { 
        if (selectedSection.length == 0) {
          $(this).show();
        } else {
          $(this).hide();
        }
      }
    }, this);
  }
}
$(document).ready(function() {
  chrome.storage.sync.get({
    courseSection: [],
  }, function(items) {
    items.courseSection.reduce((s, e) => s.add(e), courseSection);
    studentRosterListener();
    discussionBoardListener();
  });
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if(request.selectedSection !== undefined)
        selectedSection = request.selectedSection;
      reloadDiscussionBoard();
    }
  );

  $( document ).on( "click", "a.item", function() {
    reloadDiscussionBoard();
  });
});
