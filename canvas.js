
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
              if (userId.length > 0 && loginId.length > 0 && !(userId in studentGrade)) {
                studentGrade[userId] = loginId;
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
        studentDict: studentDict,
        studentGrade: studentGrade,
      }, function() {
        lastRosterSize = currentRosterSize;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
         chrome.tabs.sendMessage(tabs[0].id, {studentDict: studentDict, studentGrade: studentGrade}, function(response) {
         });
        });
      });

      chrome.storage.sync.set({
        courseSection: Array.from(courseSection),
      }, function() {});
    }
  }, 500);
}

var observerBuilt = false;
const hash = {};
async function gradeBookListener() {
  const url = window.location.href;
  const pattern = "/((http|ftp|https):\/\/)?auburn.instructure.com/courses/[1-9]*/gradebook";
  const flags = 'ig';
  const regex = new RegExp(pattern, flags);
  const re = /(Activity|Project) (\d+[A-Za-z]?)/ig;
  const reAssignment = /assignment_\d+/ig;
  const reStudent = /student_\d+/ig;
  if (!url.match(regex)) return;
  if (!autoSaveGrade) {
    $('div.Grid__GradeCell__EndContainer').html("");
    return;
  }
  if (!observerBuilt) {
    var checkExist = setInterval(function() {
      const gradeBook = $('div.slick-header-columns > .assignment');
      if (gradeBook.length > 0) {
        const columns = $('div.slick-header-columns > .assignment');
        columns.each( function(index) {
          const columnId = $(this).attr('id');
          const columnTitle = $('.assignment-name', this).text();
          const columnMatch = [...columnTitle.matchAll(re)][0];
          if (columnMatch) {
            const titleKey = columnMatch[1] + "-" + columnMatch[2];
            const assignmentHash = columnId.match(reAssignment)[0];
            $(this).css('backgroundColor','#2a9d8f');
            hash[assignmentHash] = titleKey;
          }
        });
        var targetNodes         = $(".grid-canvas");
        var MutationObserver    = window.MutationObserver || window.WebKitMutationObserver;
        var myObserver          = new MutationObserver(mutationHandler);
        var obsConfig           = { childList: true, characterData: true, attributes: true, subtree: true };
        //--- Add a target node to the observer. Can only add one node at a time.
        targetNodes.each ( function () {
          myObserver.observe(this, obsConfig);
        });
        observerBuilt = true;
        clearInterval(checkExist);
      }
    }, 50);
  } else {
    $('div.slick-cell.assignment').each( function(index) {
      refreshSlickCell($(this));
    });
  }
  function mutationHandler (mutationRecords) {
      mutationRecords.forEach ( function (mutation) {
        if (mutation.type == "childList" && typeof mutation.addedNodes == "object") {
            let target = $(mutation.addedNodes);
            if (target.hasClass('Grid__GradeCell')) {
              target = target.parent().parent();
            }
            if (target.hasClass('slick-cell')) {
              target = target.parent();
            }
            if (target.hasClass('slick-row')){
              $('.assignment', target).each( function(index) {
                refreshSlickCell($(this));
              });
            }
        }
      } );
  }
  function refreshSlickCell(target) {
    const correctMessage = "<span style='color:#538d22'>O</span>";
    const userNotFoundMessage = "<span style='color:#2a324b'>UNF</span>";
    const studentIdNotFoundMessage = "<span style='color:#2a324b'>SNF</span>";
    const gradeNotFetchedMessage = "<span style='color:#bc4749'>NF</span>";
    const cell = $(target);
    const msgbox = $('div.Grid__GradeCell__EndContainer', target);
    let studentId = target.parent().attr('class').match(reStudent);
    if (studentId && studentId.length > 0) {
      studentId = studentId[0];
    }
    let assignmentId = cell.attr('class').match(reAssignment);
    if (assignmentId && assignmentId.length > 0) {
      assignmentId = assignmentId[0];
    }
    let canvasGrade = $('span.Grade', target).text().trim();
    if (!autoSaveGrade) {
      msgbox.html("");
      return;
    }
    console.log(studentGrade);
    if (studentId && assignmentId && assignmentId in hash) {
      studentId = studentId.match(/\d+/ig)[0];
      if (studentId in studentGrade) {
        const userId = studentGrade[studentId];
        if (userId in studentGrade) {
          const studentData = studentGrade[userId];
          const assignmentKey = hash[assignmentId];
          if (assignmentKey in studentData) {
            // webcat does have a grade for the student
            let webcatGrade = studentData[assignmentKey];
            //console.log(studentId + ", " + assignmentId + "canvasGrade: " + canvasGrade + " webcatGrade: " + webcatGrade);
            if (canvasGrade == '–') {
              msgbox.html("<span style='color:#bc4749'>W-C:" + webcatGrade + "</span>");
            } else {
              canvasGrade = Number(canvasGrade);
              webcatGrade = Number(webcatGrade);
              if (Math.abs(canvasGrade- webcatGrade) < 1.0) {
                msgbox.html(correctMessage);
              } else {
                msgbox.html("<span style='color:#bc4749'>W-C:" + webcatGrade + "</span>");
              }
            }
          } else {
            // web-cat grade missing
            if (canvasGrade == '–'){
              // nothing happens (student didn't hand in)
            } else {
              // canvas has a grade but web-cat didn't (Not Fetched)
              msgbox.html(gradeNotFetchedMessage);
            }
          }
        } else {
          // not userId
          if (canvasGrade != '–') {
            msgbox.html(userNotFoundMessage);
          }
        }
      } else {
        // no student Id
        if (canvasGrade != '–') {
          msgbox.html(studentIdNotFoundMessage);
        }
      }
    }
  }
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
    gradeBookListener();
  });
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if(request.selectedSection !== undefined)
        selectedSection = request.selectedSection;
      if (request.autoSaveGrade !== undefined)
        autoSaveGrade = request.autoSaveGrade;
      if (request.studentDict !== undefined)
        studentDict = request.studentDict;
      if (request.studentGrade !== undefined)
        studentGrade = request.studentGrade;
      reloadDiscussionBoard();
      gradeBookListener();
    }
  );

  $( document ).on( "click", "a.item", function() {
    reloadDiscussionBoard();
  });

});
