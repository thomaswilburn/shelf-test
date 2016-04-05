var endpoint = "https://script.google.com/macros/s/AKfycbxr31iqyrAUOrThLD594V6_AJ7233Ckt_kKM2_c2ymVjRUmbvl3/exec";

var $ = function(s) { return Array.prototype.slice.call(document.querySelectorAll(s)) };
var resultBox = document.querySelector(".result");
var resultLabel = resultBox.querySelector(".description");
var remainingLabel = resultBox.querySelector(".remaining");
var inputs = $("input");

var jsonp = function(url, callback) {
  console.log("requesting", url);
  var callbackName = "_jsonp" + Date.now();
  window[callbackName] = function(data) {
    delete window[callbackName];
    callback(data);
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
  var qs = makeQueryString(params);
  var url = endpoint + "?" + qs;
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

