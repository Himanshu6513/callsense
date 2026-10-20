(() => {
  const doc = document.documentElement;
  doc.classList.add("js");

  // Nav hairline once scrolled
  const nav = document.getElementById("nav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 4);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Phone and tablet menu
  const toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    const setOpen = (open) => {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
    nav.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  // Reveal on scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px 20% 0px", threshold: 0 }
    );
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("in"));
  }

  // ---------- trial form ----------
  const form = document.getElementById("lead-form");
  if (!form) return;
  const done = document.getElementById("lead-done");
  const status = form.querySelector(".form-status");
  const submit = form.querySelector('button[type="submit"]');
  const label = submit.textContent;
  const startedAt = Date.now();
  const params = new URLSearchParams(location.search);

  function clearError(name) {
    const el = form.querySelector(`.err[data-for="${name}"]`);
    if (el) el.textContent = "";
    const field = el && el.closest(".field");
    if (field) field.classList.remove("invalid");
  }
  function showError(name, msg) {
    const el = form.querySelector(`.err[data-for="${name}"]`);
    if (!el) return;
    el.textContent = msg;
    const field = el.closest(".field");
    if (field) field.classList.add("invalid");
  }
  form.addEventListener("input", (e) => e.target.name && clearError(e.target.name));
  form.addEventListener("change", (e) => e.target.name && clearError(e.target.name));

  function collect() {
    const fd = new FormData(form);
    const s = (k) => (fd.get(k) || "").toString().trim();
    return {
      full_name: s("full_name"),
      phone: s("phone"),
      email: s("email"),
      company: s("company"),
      city: s("city"),
      industry: s("industry"),
      team_size: s("team_size"),
      calls_per_day: s("calls_per_day"),
      phone_system: s("phone_system"),
      languages: fd.getAll("languages"),
      message: s("message"),
      company_site: s("company_site"),
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      referrer: document.referrer || "",
      landing_page: location.pathname,
      started_at: startedAt,
    };
  }

  function validate(d) {
    const errs = {};
    const n = d.phone.replace(/\D/g, "").length;
    if (d.full_name.length < 2) errs.full_name = "Please enter your name.";
    if (n < 10 || n > 13) errs.phone = "Please enter a 10-digit mobile number.";
    if (d.email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(d.email)) errs.email = "Please check this email address.";
    if (d.company.length < 2) errs.company = "Please enter your business name.";
    if (!d.industry) errs.industry = "Please choose your business type.";
    return errs;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    const data = collect();
    const errs = validate(data);
    for (const k of ["full_name", "phone", "email", "company", "industry"]) clearError(k);
    const keys = Object.keys(errs);
    if (keys.length) {
      keys.forEach((k) => showError(k, errs[k]));
      const first = form.querySelector(`[name="${keys[0]}"]`);
      if (first) first.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = "Sending…";
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        form.hidden = true;
        done.hidden = false;
        done.focus();
        return;
      }
      if (body.errors) Object.entries(body.errors).forEach(([k, v]) => showError(k, v));
      status.textContent = body.error || "Please check the highlighted fields.";
    } catch {
      status.textContent = "We couldn't reach the server. Please check your connection and try again.";
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
})();
