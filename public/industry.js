// "My business" switcher. Every industry example is already in the HTML; CSS shows the one
// matching <html data-ind>. ind-init.js sets it before first paint; this file handles clicks,
// remembers the choice, pre-selects the business type in the form and sets the placeholder.
(() => {
  const root = document.documentElement;
  const buttons = document.querySelectorAll(".aud-seg button");
  if (!buttons.length) return;

  const INDUSTRY = { realestate: "real_estate", coaching: "coaching", d2c: "d2c", clinic: "clinic" };
  const PATH = { realestate: "/real-estate", coaching: "/coaching", d2c: "/d2c", clinic: "/clinics" };
  const PLACEHOLDER = {
    realestate: "e.g. Why do site-visit leads go cold after the first call?",
    coaching: "e.g. Which fee objections stop parents from taking admission?",
    d2c: "e.g. Why are customers cancelling COD orders?",
    clinic: "e.g. How many callers don't book, and why?",
  };

  // Pre-select the matching business type in the form, unless the visitor picked one themselves.
  let userPicked = false;
  document.querySelectorAll('input[name="industry"]').forEach((r) =>
    r.addEventListener("change", (e) => { if (e.isTrusted) userPicked = true; })
  );
  function setIndustry(key) {
    if (userPicked) return;
    const radio = document.querySelector(`input[name="industry"][value="${INDUSTRY[key]}"]`);
    if (radio && !radio.checked) radio.checked = true;
  }

  function sync(key) {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ind === key)));
    const msg = document.querySelector('textarea[name="message"]');
    if (msg && PLACEHOLDER[key]) msg.placeholder = PLACEHOLDER[key];
  }

  function choose(key) {
    if (!INDUSTRY[key]) return;
    root.setAttribute("data-ind", key);
    try { localStorage.setItem("cs_ind", key); } catch {}
    // Keep the address shareable for the chosen industry without reloading
    try {
      const url = new URL(location.href);
      url.pathname = PATH[key];
      history.replaceState(null, "", url);
    } catch {}
    sync(key);
    setIndustry(key);
  }

  buttons.forEach((b) => b.addEventListener("click", () => choose(b.dataset.ind)));

  const current = root.getAttribute("data-ind") || "realestate";
  sync(current);
  // Only pre-fill the form when the visitor arrived on a specific industry
  if (root.getAttribute("data-ind-from")) setIndustry(current);
})();
