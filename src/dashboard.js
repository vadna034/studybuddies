$(document).ready(function () {
  var toggled = false;
  $("#sidebarCollapse").on("click", function () {
    $("#sideMenu").toggleClass("toggled");
    $("#dash").toggleClass("wide");
    $("#dash").toggleClass("thin");
    $("#header").toggleClass("wide");
    $("#calendar").toggleClass("toggled");
  });
});
