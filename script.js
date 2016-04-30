var endpoint = "https://script.google.com/macros/s/AKfycbxr31iqyrAUOrThLD594V6_AJ7233Ckt_kKM2_c2ymVjRUmbvl3/exec";

var $ = function(s) { return Array.prototype.slice.call(document.querySelectorAll(s)) };
var resultBox = document.querySelector(".result");
var resultLabel = resultBox.querySelector(".description");
var remainingLabel = resultBox.querySelector(".remaining");
var inputs = $("input, select");
var bookSelect = document.querySelector("#book");

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

var makeQueryString = function(params) {
  var qs = [];
  for (var key in params) {
    qs.push(key + "=" + params[key]);
  }
  return qs.join("&");
};

var makeURL = function(data) {
  return endpoint + "?" + makeQueryString(data);
}

var parseInputs = function(inputs) {
  var params = {};
  if (typeof inputs == "string") {
    inputs = document.querySelectorAll(inputs);
  }
  var params = {};
  for (var i = 0; i < inputs.length; i++) {
    params[inputs[i].id] = inputs[i].value;
  }
  return params;
};

document.querySelector("#submit").addEventListener("click", function(e) {
  e.preventDefault();
  var params = parseInputs(inputs);
  params.run = "answer";
  var url = makeURL(params);
  e.target.classList.add("working");
  jsonp(url, function(data) {
    e.target.classList.remove("working");
    resultBox.classList.add("answered");
    resultLabel.innerHTML = data.success ? "Correct!" : "✘ Wrong!";
    if (data.error == "limit") {
      remainingLabel.innerHTML = "0"
    } else if (data.repeat) {
      remainingLabel.innerHTML = "-";
    } else {
      remainingLabel.innerHTML = data.remaining;
    }
  });
});

var reset = function() {
  resultBox.classList.remove("answered");
};

inputs.forEach(function(el) { el.addEventListener("focus", reset) });

var getBooks = makeURL({ run: "titles" });
jsonp(getBooks, function(data) {
  data.forEach(function(title) {
    var option = document.createElement("option");
    option.value = title;
    option.innerHTML = title;
    bookSelect.appendChild(option);
  })
})