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
        console.log(moment.utc(Date.parse(event.starttime)).local());
        console.log(moment.utc(Date.parse(event.endtime)).local());

        calEvents.push({
          title: event.code,
          timeZone: "local",
          start: Date.parse(moment.utc(Date.parse(event.starttime)).local()),
          end: Date.parse(moment.utc(Date.parse(event.endtime)).local()),
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
