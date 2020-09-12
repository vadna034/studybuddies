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
        console.log(event.starttime);
        console.log(event.endtime);
        console.log(Date.parse(event.starttime));
        console.log(Date.parse(event.endtime));
        calEvents.push({
          title: event.code,
          timeZone: "local",
          start: event.starttime,
          end: event.endtime,
        });
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
