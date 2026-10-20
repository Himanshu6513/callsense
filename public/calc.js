// Sample-report bar widths (set here, not inline, so the page's CSP can stay strict)
// and the "what missed leads cost you" calculator.
(() => {
  // bars are scaled to the biggest reason in each report, so the chart reads at a glance
  document.querySelectorAll(".bars").forEach((ul) => {
    const bars = [...ul.querySelectorAll("i[data-w]")];
    const max = Math.max(...bars.map((i) => Number(i.dataset.w) || 0)) || 1;
    bars.forEach((i) => { i.style.width = (Number(i.dataset.w) / max) * 100 + "%"; });
  });

  const form = document.getElementById("calc");
  if (!form) return;
  const LOCALE = { INR: "en-IN", USD: "en-US", EUR: "en-IE", GBP: "en-GB" };
  // sensible starting numbers for each industry version: [missed a month, rate, value in INR]
  const START = { general: [20, "0.1", 50000], realestate: [20, "0.1", 100000], coaching: [30, "0.2", 150000], d2c: [300, "0.2", 1500], clinic: [60, "0.2", 8000] };
  const start = START[document.documentElement.getAttribute("data-ind")] || START.general;
  form.missed.value = start[0]; form.rate.value = start[1]; form.value.value = start[2];
  const month = form.querySelector('[data-out="month"]');
  const year = form.querySelector('[data-out="year"]');

  function update() {
    const missed = Math.max(0, Number(form.missed.value) || 0);
    const rate = Number(form.rate.value) || 0;
    const value = Math.max(0, Number(form.value.value) || 0);
    const cur = form.cur.value;
    const fmt = new Intl.NumberFormat(LOCALE[cur] || "en-IN", { style: "currency", currency: cur, maximumFractionDigits: 0 });
    const lost = missed * rate * value;
    month.textContent = fmt.format(lost);
    year.textContent = fmt.format(lost * 12);
  }
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  update();
})();
