// Runs in <head>, before the page paints: picks which industry example to show.
// Order: the page itself (/real-estate, /coaching, /d2c, /clinics), then the visitor's last
// choice, then real estate.
(function () {
  var ok = { realestate: 1, coaching: 1, d2c: 1, clinic: 1 };
  var byPath = { "/real-estate": "realestate", "/coaching": "coaching", "/d2c": "d2c", "/clinics": "clinic" };
  var root = document.documentElement;
  var key = byPath[location.pathname.replace(/\/+$/, "")] || null, from = key ? "page" : null;
  if (!key) {
    try {
      var s = localStorage.getItem("cs_ind");
      if (ok[s]) { key = s; from = "saved"; }
    } catch (e) {}
  }
  if (key) {
    root.setAttribute("data-ind", key);
    root.setAttribute("data-ind-from", from);
  }
})();
