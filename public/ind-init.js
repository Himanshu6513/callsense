// Runs in <head>, before the page paints: picks which industry version to show.
// The home page is real estate first; /coaching, /d2c and /clinics show their own version.
(function () {
  var byPath = { "/real-estate": "realestate", "/coaching": "coaching", "/d2c": "d2c", "/clinics": "clinic" };
  var key = byPath[location.pathname.replace(/\/+$/, "")];
  if (key) document.documentElement.setAttribute("data-ind", key);
})();
