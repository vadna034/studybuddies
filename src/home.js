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
        calEvents.push({
          title: event.code,
          timeZone: "local",
          start: Date.parse(event.starttime) + Date.getTimezoneOffset(),
          end: Date.parse(event.endtime) + Date.getTimezoneOffset(),
        });
        console.log(event.starttime);
        console.log(event.endtime);
      });

      var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "timeGridWeek",
        events: calEvents,
      });

      calendar.render();
    })
    .catch((err) => {
      alert("Could not load your meetings");
      var dash = document.getElementsByClassName("dash");
      console.log(dash);
    });
});
