$("document").ready(() => {
  $("#addClass").submit(function () {
    fetch("/addClass", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        term: $("#term").val(),
        dept: $("#dept").val(),
        classNumber: $("#classNumber").val(),
      }),
    })
      .then((response) => {
        var responseEl = document.getElementById("responseAlert");
        if (response.status == 200) {
          responseEl.innerHTML =
            "<div class='alert alert-primary col-sm-12'>Successfully added the class.  </div>";
        } else if (response.status == 404) {
          responseEl.innerHTML =
            "<div class='alert alert-warning col-sm-12'>Class was not found. Please change some details and try again. </div>";
        } else if (response.status == 500) {
          responseEl.innerHTML =
            "<div class='alert alert-danger col-sm-12'>Server Error. Please try again later :../ </div>";
        }
      })
      .catch((err) => console.log(err));
    return false;
  });
});
