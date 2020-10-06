$(document).ready(function () {
  fetch("/getMeetings", { method: "POST" })
    .then((response) => response.text())
    .then((response) => {
      console.log(response);
      var events = JSON.parse(response);
      var calEvents = [];
      var calendarEl = document.getElementById("calendar");
      console.log(events);
      

 

      events.forEach((event) => {
        var starttime = new Date(event.starttime);
        var endtime = new Date(event.endtime);
        console.log(starttime);
        console.log(starttime.toLocaleString());

        calEvents.push({
          title: event.code,
          timeZone: "local",
          start: starttime,
          end: endtime,
        });
      });

      var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "timeGridWeek",
        events: calEvents,
      });
      console.log(calEvents);

      calendar.render();
    })
    .catch((err) => {
      alert("Could not load your meetings");
      var dash = document.getElementsByClassName("dash");
      console.log(dash);
    });
});

function adjustForTimezone(date){
  
  var timeOffsetInMS = new Date().getTimezoneOffset() * 60000;
  console.log(timeOffsetInMS);
  date.setTime(date.getTime() - timeOffsetInMS);
  return date
}