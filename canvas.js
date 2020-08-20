async function studentRosterListener(){
  const url = window.location.href;
  const pattern = "/((http|ftp|https):\/\/)?auburn.instructure.com/courses/[1-9]*/users";
  const flags = 'ig';
  const regex = new RegExp(pattern, flags);
  if (!url.match(regex)) return;
  var checkExist = setInterval(function() {
    const rosterTable = $('table.roster');
    if (rosterTable.length) {
      clearInterval(checkExist);
      const roster = $(' > tbody > tr', rosterTable);
      roster.each(function(index) {
        const studentName = $(this).find('td:eq(1)').text().trim();
        const names = studentName.split(' ');
        const loginId = $(this).find('td:eq(2)').text().trim();
        const userId = $(this).attr('id').replace(/\D/g,'');
        const sections = $(this).find('td:eq(4) > div.section');
        const role = $(this).find('td:eq(5)').text().trim();
        let firstName = "";
        let middleName = "";
        let lastName = "";
        let key = "";
        if (names.length == 2) {
          firstName = names[0];
          lastName = names[1];
          key = `${lastName}, ${firstName}`
        } else if (names.length == 3) {
          firstName = names[0];
          middleName = names[1];
          lastName = names[2];
          key = `${lastName}, ${firstName} ${middleName}`
        }
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
              if (!(key in studentDict)) {
                studentDict[key] = {};
                studentDict[key][section] = {};
              }
            }
          }, this);
        }
      }, this);
      chrome.storage.local.set({
        studentDict: studentDict
      }, function() {
        //console.log(studentDict);
      });

      chrome.storage.sync.set({
        courseSection: Array.from(courseSection),
      }, function() {
      });
    }
  }, 100);
}

async function discussionBoardListener() {
  const url = window.location.href;
  const pattern = "/((http|ftp|https):\/\/)?auburn.instructure.com/courses/[1-9]*/discussion_topics";
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
      const articleAuthorId = $(authorTitle).attr('data-student_id');
      const authorTitleText = $(authorTitle).html().trim();
      if (articleAuthorId !== undefined) {
        if (articleAuthorId in studentDict) {
          if (selectedSection.length == 0 || selectedSection == "Student Mode" || selectedSection == "TA Mode" || selectedSection in studentDict[articleAuthorId]) {
            for (var sectionName in studentDict[articleAuthorId]) {
              if (authorTitleText.indexOf(sectionName) == -1)
                $(authorTitle).append("<br/>" + sectionName);
            }
            $(this).show();
          } else {
            $(this).hide();
          }
        } else {
          if (selectedSection.length == 0 || selectedSection == "Student Mode"){
            $(this).show();
          } else {
            $(this).hide();
          }
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
