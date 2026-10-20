// Every industry version is already in the HTML; CSS shows the one matching <html data-ind>.
// This pre-selects the matching business type in the form and sets the question placeholder.
(() => {
  const key = document.documentElement.getAttribute("data-ind") || "general";
  const INDUSTRY = { general: "", realestate: "real_estate", coaching: "coaching", d2c: "d2c", clinic: "clinic" };
  const PLACEHOLDER = {
    general: "e.g. Why do good leads go cold after the first call?",
    realestate: "e.g. Why do site-visit leads go cold after the first call?",
    coaching: "e.g. Which fee concerns stop parents from taking admission?",
    d2c: "e.g. Why are customers cancelling orders?",
    clinic: "e.g. How many callers don't book, and why?",
  };
  const select = document.querySelector('select[name="industry"]');
  if (select && !select.value && INDUSTRY[key]) select.value = INDUSTRY[key];
  const msg = document.querySelector('textarea[name="message"]');
  if (msg && PLACEHOLDER[key]) msg.placeholder = PLACEHOLDER[key];
})();
