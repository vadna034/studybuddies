var submit = function () {};

$(document).ready(() => {
  var table = $("classTable")[0];

  fetch("/getClasses", {
    method: "POST",
  })
    .then((response) => response.text())
    .then((data) => {
      console.log(data);
      var classes = JSON.parse(data);
      console.log(classes);
      document.getElementById("tableCard").hidden = false;
      if (classes.length != 0) {
        var table = $("#classTable")[0];

        classes.forEach((c) => {
          var addRow = table.insertRow();
          console.log(c);

          if (c.section === "0") {
            c.section = "N/A";
          }

          var link = "class/" + c.id;

          var termCell = addRow.insertCell(0);
          termCell.innerHTML = c.term;
          var codeCell = addRow.insertCell(1);
          codeCell.innerHTML = c.code;
          var nameCell = addRow.insertCell(2);
          nameCell.innerHTML = c.name;
          var pageCell = addRow.insertCell(3);
          pageCell.innerHTML =
            "<a href='class/" + c.id + "'>" + "Link" + "</a>";
          var delCell = addRow.insertCell(4);

          delCell.innerHTML =
            '<form name = "deleteClass" action="/deleteClass" method = "POST"><button type="submit" class="btn btn-danger" name="id" value =' +
            c.id +
            ">Leave Class</button></form>";
        });
      } else {
        console.log("here");
        $("#tableCard")[0].innerHTML =
          "<div class='alert alert-primary text-center'> You don't have any classes yet? Add some. </div>";
        document.getElementById("tableCard").hidden = false;
      }
    })
    .catch((error) => {
      console.error("Error: ", error);
    });
});
