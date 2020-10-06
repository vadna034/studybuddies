$(document).ready(function () {
    console.log("here");
    Array.from(document.getElementsByClassName("addMeetingForm")).forEach(
        f => {
            f.addEventListener("submit", (e) =>{
                e.preventDefault();
                fetch("/joinMeeting",{
                    method: "POST", 
                    redirect: "manual",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: f.submit.value,
                    })
                }).then( (r) =>{
                    console.log(response);
                    if(r.status == 200){
                        reload();
                    } else{
                        document.getElementsByClassName("errorArea").innerHTML = "<div class='alert alert-danger text-center'>Server Error: Please try again later</div>";
                    }
                }).catch( e => {
                        document.getElementsByClassName("errorArea").innerHTML = "<div class='alert alert-danger text-center'>Server Error: Please try again later</div>";
                });
            })
        }
    );
});
 

/*
function addClass(e){
    
}

event.preventDefault();
    fetch("/login", {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputEmail: $("#inputEmail").val(),
        inputPassword: $("#inputPassword").val(),
      }),
    })
      .then((response) => {
        console.log(response);
        if (response.redirected) {
          window.location.href = "/dashboard/home";
        } else if (response.status == 404) {
          document.getElementById("successDiv").innerHTML =
            "<div class='alert alert-warning text-center'>User not found. Please check that your email and password have been entered correctly</div>";
        } else if (response.status == 500) {
          document.getElementById("successDiv").innerHTML =
            "<div class='alert alert-danger text-center'>Server Error: Please try again later</div>";
        }
      })
      .catch((err) => {
        document.getElementById("successDiv").innerHTML =
          "<div class='alert alert-danger text-center'>Server Error: Please try again later</div>";
      });
  }
  */