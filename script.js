var endpoint = "https://script.google.com/macros/s/AKfycbxr31iqyrAUOrThLD594V6_AJ7233Ckt_kKM2_c2ymVjRUmbvl3/exec";

//utility code
var $ = function(s) { return Array.prototype.slice.call(document.querySelectorAll(s)) };

var app = document.querySelector(".app");
var inputs = ["name", "book", "shelf"].reduce(function(inputs, id) {
  inputs[id] = document.querySelector("#" + id);
  return inputs;
}, {});

var jsonp = function(url, callback) {
  console.log("requesting", url);
  var callbackName = "_jsonp" + Date.now();
  window[callbackName] = function(data) {
    delete window[callbackName];
    callback(data);
    script.parentElement.removeChild(script);
  };
  var script = document.createElement("script");
  script.src = url + (url.indexOf("?") == -1 ? "?" : "&") + "callback=" + callbackName;
  document.body.appendChild(script);
};

var makeURL = function(params) { 
  var qs = [];
  for (var key in params) {
    qs.push(key + "=" + params[key]);
  }
  return endpoint + "?" + qs.join("&");
}

//check the first stage
var checkName = function() {
  var nameValue = inputs.name.value;
  if (!nameValue) {
    document.querySelector(".missing-name.warning").classList.add("show");
  } else {
    inputs.shelf.value = "";
    app.setAttribute("data-stage", "book-entry");
  }
};
document.querySelector(".goto-entry").addEventListener("click", checkName);
inputs.name.addEventListener("keydown", function(e) {
  if (e.keyCode == 13) checkName();
});

//check the second stage
var checkShelf = function() {
  var stage = document.querySelector(".book-entry.stage");
  if (stage.classList.contains("working")) return;
  var warning = stage.querySelector(".warning");
  var params = { run: "answer" };
  for (var key in inputs) {
    params[key] = inputs[key].value;
  }
  if (!params.book && !params.shelf) {
    warning.innerHTML = "You must enter a shelf";
    warning.classList.add("show");
    return;
  }
  var url = makeURL(params);
  stage.classList.add("working");
  jsonp(url, function(data) {
    stage.classList.remove("working");
    if (data.error) {
      if (data.error == "limit") {
        warning.innerHTML = "You're out of guesses for that book.";
      }
      if (data.error == "incomplete") {
        warning.innerHTML = "Not enough information provided."
      }
      warning.classList.add("show");
    } else {
      renderResults(data);
      app.setAttribute("data-stage", "results");
    }
  });
};
inputs.shelf.addEventListener("keydown", function(e) {
  if (e.keyCode == 13) checkShelf();
});
document.querySelector(".check-shelf").addEventListener("click", checkShelf);

var renderResults = function(results) {
  var stage = document.querySelector(".results.stage");
  stage.querySelector(".answer .book").innerHTML = inputs.book.value;
  stage.querySelector(".answer .shelf").innerHTML = inputs.shelf.value;
  var isCorrect = stage.querySelector(".correctness");
  isCorrect.classList.remove("correct", "incorrect");
  if (results.success) {
    isCorrect.classList.add("correct");
    isCorrect.innerHTML = "Correct!";
  } else {
    isCorrect.classList.add("incorrect");
    isCorrect.innerHTML = "Wrong answer.";
  }
  var used = 3 - results.remaining;
  var icons = [];
  for (var i = 0; i < used - 1; i++) {
    icons.push("fa fa-times-circle failure");
  }
  icons.push(results.success ? "fa fa-check-circle current success" : "fa fa-times-circle current failure");
  for (var i = 0; i < results.remaining; i++) {
    icons.push("fa fa-question-circle-o")
  }
  icons = icons.map(function(c) { return "<i class=\"" + c + "\"></i>" }).join("");
  stage.querySelector(".guesses").innerHTML = icons;
}

//clear the form and go back to the shelf
var shelfReturn = function() {
  inputs.shelf.value = "";
  document.querySelector(".book-entry .warning").classList.remove("show");
  app.setAttribute("data-stage", "book-entry");
};
document.querySelector(".try-again").addEventListener("click", shelfReturn);

//load the titles
var getBooks = makeURL({ run: "titles" });
jsonp(getBooks, function(data) {
  data.sort().forEach(function(title) {
    var option = document.createElement("option");
    option.value = title;
    option.innerHTML = title;
    inputs.book.appendChild(option);
  })
})