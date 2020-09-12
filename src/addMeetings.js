$(document).ready(() => {
  var mainSection = document.getElementById("mainSection");
  console.log("READY");
  const re = /^\s*https:\/\/umn\.zoom\.us\/j\/\d+(\?pwd=\w+)?\s*$/;
  console.log("asdf".match(re));
  fetch("/getClasses", {
    method: "POST",
  })
    .then((response) => response.text())
    .then((response) => {
      var classes = JSON.parse(response);
      if (classes.length != 0) {
        var classElement = document.getElementById("classId");
        classes.forEach((c) => {
          var opt = document.createElement("option");
          opt.value = c.id;
          opt.innerHTML = c.code; // whatever property it has
          classElement.appendChild(opt);
        });

        $("#startdatetime").flatpickr({
          enableTime: true,
          dateFormat: "F, d Y H:i",
          minDate: "today",
        });
        $("#enddatetime").flatpickr({
          enableTime: true,
          dateFormat: "F, d Y H:i",
          minDate: "today",
        });

        mainSection.hidden = false;

        $("#addMeeting").submit(function () {
          var startTime = moment.utc($("#startdatetime").val());
          var endTime = moment.utc($("#enddatetime").val());
          var start = Date.parse($("#startdatetime").val());
          var end = Date.parse($("#enddatetime").val());
          var now = Date.now();
          var zoom = $("#zoom").val();
          if (start > end || start < now || end < now) {
            document.getElementById("warningArea").innerHTML =
              "<div class='alert alert-warning text-center'>Please check that you have selected valid times for your meeting</div>";
          } else if (end - start > 10800000) {
            document.getElementById("warningArea").innerHTML =
              "<div class='alert alert-warning text-center'>Please keep meetings under three hours in duration. </div>";
          } else if (!zoom.match(re)) {
            document.getElementById("warningArea").innerHTML =
              "<div class='alert alert-warning text-center'>Please check that your zoom link is correct </div>";
          } else {
            fetch("/addMeeting", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                startdatetime: startTime,
                enddatetime: endTime,
                classId: $("#classId").val(),
                zoom: $("#zoom").val().trim(),
                purpose: $("#purpose").val(),
              }),
            })
              .then((response) => {
                if (response.statusCode == 500) {
                  document.getElementById("warningArea").innerHTML =
                    "<div class='alert alert-danger text-center'>There was a server error</div>";
                  document.getElementById("");
                } else {
                  document.getElementById("warningArea").innerHTML =
                    "<div class='alert alert-primary text-center'>Successfully added your meeting. Reload the page to add another.</div>";
                  document.getElementById("addMeetingSubmit").disabled = true;
                }
              })
              .catch((err) => {
                "<div class='alert alert-danger text-center'>There was a server error</div>";
                console.error(err);
              });
          }
          return false;
        });
      } else {
        document.getElementById("mainSection").innerHTML =
          "<div class='alert alert-primary'> You haven't signed up for any classes! You can schedule a meeting once you do that</h>";
        mainSection.hidden = false;
      }
    })
    .catch((err) => {
      console.log(err);
      console.log("error");
    });
});
