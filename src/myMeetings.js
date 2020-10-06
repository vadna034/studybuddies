createDeleteButton = function (id) {
  return (
    '<form name = "deleteMeeting" class = "deleteForm"action="/deleteMeeting" method = "POST"><button type="submit" class="btn btn-danger" name="id" value =' +
    id +
    ">Delete</button></form>"
  );
};

createLeaveButton = function (id) {
  return (
    '<form name = "leaveMeeting" action="/leaveMeeting" method = "POST"><button type="submit" class="btn btn-danger" name="id" value =' +
    id +
    ">Delete</button></form>"
  );
};



$(document).ready(() => {
  fetch("/getMeetings", {
    method: "POST",
  })
    .then((response) => response.text())
    // The response is a stringified JSON object containing meeting data.
    .then((response) => {
      var meetings = JSON.parse(response);
      meetings = meetings.filter(
        (meeting) => Date.parse(meeting.endtime) > Date.now()
      );
      const format1 = "h:mm a <br> MMMM Do ";

      if (meetings.length != 0) {
        $("#mainSection")[0].hidden = false;
        console.log("POPULATE TABLE");
        var table = document.getElementById("meetingTable");

        meetings.forEach((element) => {
          console.log(element);
          var addRow = table.insertRow();
          
          console.log(Date.parse(element.starttime));
          var starttime = new Date(element.starttime);
          var endtime = new Date(element.endtime);

          var codeCell = addRow.insertCell(0);
          codeCell.innerHTML = element.code;
          var startCell = addRow.insertCell(1);
          startCell.innerHTML = 
            starttime.toLocaleString();
          var endCell = addRow.insertCell(2);
          endCell.innerHTML = 
            endtime.toLocaleString();
          var purposeCell = addRow.insertCell(3);
          purposeCell.innerText = element.purpose;

          var linkCell = addRow.insertCell(4);
          linkCell.innerHTML = "<a href=" + element.link + "> Link </a>";

          var delCell = addRow.insertCell(5);
          if (element.delete) {
            delCell.innerHTML = createDeleteButton(element.id);
          } else {
            delCell.innerHTML = createLeaveButton(element.id);
          }
        });
      } else {
        $("#mainSection")[0].innerHTML =
          "<div class='alert alert-primary text-center'> You don't have any meetings yet. Check your class pages to schedule some! </div>";
        $("#mainSection")[0].hidden = false;
      }
    })
    .catch((err) => {
      console.error("Error: ", err);
      alert("THERE WAS A SERVER ERROR. PLEASE TRY AGAIN LATER");
      $("#mainSection")[0].innerHTML =
        "<div class='alert alert-danger'> There was a server error. Please try again later </div>";
    });
});
