// Google Apps Script for this application
// Do not bother running locally, must run via Google Apps

var SHEET_ID = "1FkBJe2C69Rw1M-KzBpqELwNA8wvL4t7aUC3K6uihunI";
var ATTEMPTS = 3;

var RESPONSE_NAME = 0;
var RESPONSE_BOOK = 1;
var RESPONSE_SHELF = 2;
var RESPONSE_CORRECT = 3;

var POINTS_CORRECT = 3;
var POINTS_WRONG = -1;

var book = SpreadsheetApp.openById(SHEET_ID);
var keySheet = book.getSheetByName("key");
var responsesSheet = book.getSheetByName("responses");
var teacherSheet = book.getSheetByName("teachers");
var keyData = keySheet.getLastRow() > 1 ? keySheet.getSheetValues(2, 1, keySheet.getLastRow() - 1, 2) : [];
var answerKey = {};
keyData.forEach(function(row) {
  answerKey[row[0]] = row[1];
});

var loadResponses = function() {
  var responsesData = responsesSheet.getLastRow() > 1 ? responsesSheet.getSheetValues(2, 1, responsesSheet.getLastRow() - 1, 4) : [];
  var responses = {};
  responsesData.forEach(function(row) {
    var name = row[RESPONSE_NAME];
    var book = row[RESPONSE_BOOK];
    var shelf = row[RESPONSE_SHELF];
    if (!responses[name]) responses[name] = {};
    if (!responses[name][book]) responses[name][book] = [];
    responses[name][book].push(row);
  });
  return responses;
};

function respondJSON(callback, data) {
  callback = callback || "callback";
  if (!data) {
    data = callback;
    callback = "callback";
  }
  var output = ContentService.createTextOutput(callback + "(" + JSON.stringify(data) + ");");
  output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return output;
}

var getScore = function(responses, name) {
  var books = responses[name];
  var score = 0;
  for (var b in books) {
    var answers = books[b];
    answers.forEach(function(a) {
      score += a[RESPONSE_CORRECT] ? POINTS_CORRECT : POINTS_WRONG;
    });
  }
  return score;
};

var answerHandler = function(params) {
  //enforce good AJAX requests
  var required = "name book shelf".split(" ");
  for (var i = 0; i < required.length; i++) {
    if (!(required[i] in params)) {
      return respondJSON(params.callback, { error: "incomplete", field: required[i] });
    }
  }
  //check previous responses
  var count = 0;
  var responses = loadResponses();
  var score = getScore(responses, params.name);
  if (responses[params.name] && responses[params.name][params.book]) {
    var r = responses[params.name][params.book];
    count = r.length;
    if (r.length >= ATTEMPTS) return respondJSON(params.callback, { error: "limit", score: score });
    if (r.some(function(item) { return item[RESPONSE_CORRECT] })) {
      return respondJSON(params.callback, { success: true, repeat: true, score: score });
    }
  }
  //otherwise, lock the sheet, add the row, and respond with status
  var correct = answerKey[params.book] == params.shelf;
  score += correct ? POINTS_CORRECT : POINTS_WRONG;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  responsesSheet.appendRow([params.name, params.book, params.shelf, correct, params.teacher]);
  lock.releaseLock();
  return respondJSON(params.callback, { success: correct, remaining: ATTEMPTS - count - 1, score: score });
};

var titleHandler = function(params) {
  return respondJSON(params.callback, Object.keys(answerKey));
};

var scoreHandler = function(params) {
  return respondJSON(params.callback, { score: getScore(loadResponses(), params.name) });
};

var initHandler = function(params) {
  var teachers = [];
  var teacherValues = teacherSheet.getSheetValues(2, 1, teacherSheet.getLastRow() - 1, 1);
  teacherValues.forEach(function(row) {
    teachers.push(row[0]);
  });
  return respondJSON(params.callback, {
    books: Object.keys(answerKey),
    teachers: teachers
  });
};

function doGet(e) {
  var params = e.parameter;
  var method = params.run;
  switch (method) {
    case "answer":
      return answerHandler(params);
     
    case "titles":
      return titleHandler(params);
      
    case "score":
      return scoreHandler(params);
      
    case "init":
      return initHandler(params);
      
    default:
      return respondJSON(params.callback, { error: "No matching method found" });
  }
}