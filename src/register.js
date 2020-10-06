$(document).ready(() => {
  document.getElementById("registerButton").addEventListener("click", () => {
    window.location.href = "/login";
  });
  $("document").ready(() => {
    document
      .getElementById("registerForm")
      .addEventListener("submit", function (event) {
        event.preventDefault();
        var inputEmail = $("#inputEmail").val().trim();
        var password = $("#inputPassword").val();
        var confirmpassword = $("#confirmPassword").val();
        var warningDiv = $("#warningDiv")[0];

        console.log(password);
        console.log(confirmpassword);
        email = inputEmail.split()[0].split("@");
        console.log(email);
        var local = email[0];
        var domain = email[1];
        console.log(local);
        console.log(domain);
        if (domain !== "umn.edu") {
          warningDiv.innerHTML =
            "<div class='alert alert-danger text-center'> Please use a valid umn.edu email </div>";
        } else if (password.length < 8) {
          warningDiv.innerHTML =
            "<div class='alert alert-danger text-center'> Please check that password is longer than 8 characters </div>";
        } else if (password != confirmpassword) {
          warningDiv.innerHTML =
            "<div class='alert alert-danger text-center'> Please check that passwords match </div>";
        } else {
          fetch("/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputEmail: inputEmail,
              inputPassword: password,
            }),
          })
            .then((response) => {
              if (response.status == 200) {
                document.getElementById("successDiv").innerHTML =
                  '<div class="alert alert-primary text-center">Successfully registered! Check your email to confirm registration </div>';
                warningDiv.hidden = true;
                document.getElementById("submitButton").disabled = true;
              } else if ((response.status = 409)) {
                document.getElementById("successDiv").innerHTML =
                  '<div class="alert alert-warning text-center">That email is already registered</div>';
                warningDiv.hidden = true;
              } else {
                document.getElementById("successDiv").innerHTML =
                  '<div class="alert alert-danger text-center">Server Error: Please try again later </div>';
              }
            })
            .catch((err) => {
              document.getElementById("successDiv").innerHTML =
                '<div class="alert alert-danger text-center">Server Error: Please try again later </div>';
            });
        }
      });
  });
});
