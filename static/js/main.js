var consoleData = [];
var disconnectText = $('.disconnect-text');
var userTable = $('#user-data-table');
var serverTable = $('#internal-data-table');
var consoleContent = $('.console-text');
var socket = io.connect();

// initialize socket.io

userTable.css('display', 'none');
serverTable.css('display', 'none');
consoleContent.css('display', 'none');
disconnectText.css('display', 'block');

socket.on('connect', function (data) {
  console.log("Connected!")
  userTable.css('display', 'table');
  serverTable.css('display', 'table');
  consoleContent.css('display', 'inline');
  disconnectText.css('display', 'none');
  var consoleData = data; // assuming `data` is a JSON dictionary
  for (var key in consoleData) { // loop through the keys of the dictionary
    if (consoleData.hasOwnProperty(key)) { // check if the key belongs to the object itself, not its prototype chain
      var text = "[" + key + "] : " + consoleData[key]; // format the console text with the key-value pair
      var consoleText = $('<p>').addClass('console-text').text(text);
      $('#console-content').append(consoleText);
    }
  }
  var consoleBox = document.getElementById('console-box');
  consoleBox.scrollTop = consoleBox.scrollHeight;
})

socket.on('error', function () {
  userTable.css('display', 'none');
  serverTable.css('display', 'none');
  consoleContent.css('display', 'none');
  disconnectText.css('display', 'block');
});


// update the console output when new data arrives
socket.on('get_console', function (data) {
  var consoleData = data;
  var keys = Object.keys(consoleData);
  if (keys.length === 0) {
    return
  }
  if (keys.length > 250) {
    consoleData = consoleData.slice(-250);
    $('#console-content p:first-child').remove();
  }

  for (var key in consoleData) { // loop through the keys of the dictionary
    if (consoleData.hasOwnProperty(key)) { // check if the key belongs to the object itself, not its prototype chain
      var text = "[" + key + "] : " + consoleData[key]; // format the console text with the key-value pair
      var consoleText = $('<p>').addClass('console-text').text(text);
      $('#console-content').append(consoleText);
    }
  }
  var consoleBox = document.getElementById('console-box');
  consoleBox.scrollTop = consoleBox.scrollHeight;
});

// update the server data when new data arrives
socket.on('get_data', function (data) {
  let server_status = $("#server-status")
  let server_load = $("#server-load")
  let server_threads = $("#server-threads")
  let server_ram = $("#server-ram-usage")
  let server_time = $("#server-time")

  server_status.text(data.status)
  server_load.text(data.cpu_usage)
  server_threads.text(data.threads)
  server_ram.text(data.memory_usage)
  server_time.text(data.time)

});

// request initial server data
socket.emit('get_data');

var consoleFlag = true;

setInterval(function () {
  if (consoleFlag) {
    // request initial server data
    socket.emit('get_console');
  } else {
    // request initial server data
    socket.emit('get_data');
  }
  consoleFlag = !consoleFlag;
}, 100);



$(document).ready(function () {
  var form = $('#command-form');
  form.submit(function (event) {
    event.preventDefault(); // prevent form submission
    var textInput = $('#command-input').val(); // get the text input value
    var newStr = textInput.replace(/[,.'/$"!?*]/g, '');
    textInput = newStr
    // send the text input value to the server using AJAX
    $.ajax({
      url: '/',
      type: 'POST',
      data: { text_input: textInput },
      dataType: 'json',
      success: function (response) {
        console.log(response);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(textStatus, errorThrown);
      },
      complete: function (jqXHR, textStatus) {
        console.log(textStatus)
      },
      timeout: 1000
    });
    // clear the form input
    document.getElementById("command-form").reset()
  });

});

function getTime() {
  var now = new Date();
  var hours = now.getHours() % 12 || 12;
  var minutes = now.getMinutes();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  var seconds = now.getSeconds();
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  var meridian = now.getHours() >= 12 ? "PM" : "AM";
  var timeString = hours + ":" + minutes + ":" + seconds + " " + meridian;
  return timeString;
}

function serverTime() {
  var timeString = getTime();
  $('#local-time').html(timeString);
}

setInterval(serverTime, 1000); // Update time every second


