/**
 * Global settings
 * @author Ai-Te Kuo
 */
var studentInSection = new Set();
var autoFilter = false;
var autoShowGrade = false;
var lock = false;
var disable = false;
var showSectionName = false;
var showNoReplyPost = false;
var onlyShowTextInRed = false;
var autoSaveGrade = false;
var lineNumber;
var selectedSection = [];
var studentDict = {};
var courseMap = {};
var studentGrade = {};
var courseSection = new Set();
var lastStatus = '';
var lastRosterSize = 0
const BG_TYPE = {
  PINK: 0,
  ORANGE: 1,
  GREY: 2,
  NONE: 9999
};
const URL_PATTERN = {
  CANVAS_GRADEBOOK: /((http|https):\/\/)?auburn.instructure.com\/courses\/\d+\/gradebook/i,
  CANVAS_PEOPLE: /((http|https):\/\/)?auburn.instructure.com\/courses\/\d+\/users/i,
  CANVAS_PEOPLE_GROUPS: /((http|https):\/\/)?auburn.instructure.com\/courses\/\d+\/groups/i,
  CANVAS_DISCUSSIONS: /((http|https):\/\/)?auburn.instructure.com\/courses\/\d+\/discussion_topics\/\d+/i,
  WEBCAT: /((http|https):\/\/)?.+.eng.auburn.edu:\d+/i
};
const REGEX = {
  START_WITH_SPACES: /^(&nbsp;)+/,
  STUDENT_ID: /([a-z0-9]{7,8})/,
  STUDENT_NAME_AND_ID: /[^\(\)]+(?: \(([a-zA-z0-9]{7,10})\))?/g,
  STUDENT_PRONOUNS: /(\(She\/Her\/Hers\)|\(He\/Him\/His\)|\(They\/Them\/Theirs?\))/i,
};
var gradebookListenerBuilt = false;
var webcatListenerBuilt = false;
var hash = {};
var inconsistencyMap = {};
const reAssignment = /assignment_\d+/i;
const reStudent = /student_(\d+)/i;
const GRADE_MSG = {
  USER_NOT_FOUND_GREEN: "<span class='wceg-green'>UNF</span>",
  STUDENT_NOT_FOUND_GREEN: "<span class='wceg-green'>SNF</span>",
  GRADE_NOT_FETCHED_GREEN: "<span class='wceg-green'>NF</span>",
  USER_NOT_FOUND_RED: "<span class='wceg-red'>UNF</span>",
  STUDENT_NOT_FOUND_RED: "<span class='wceg-red'>SNF</span>",
  GRADE_NOT_FETCHED_RED: "<span class='wceg-red'>NF</span>",
};
