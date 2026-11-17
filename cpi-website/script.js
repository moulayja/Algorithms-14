// Cleveland Property Inspectors: site behavior

// Where form submissions are sent. Change this to your business email.
const BUSINESS_EMAIL = "info@cpi-inspections.com";

// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("nav-menu");

toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

menu.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// Mobile sticky "Book" button: show after the hero, hide at the booking form
const mobileCta = document.querySelector(".mobile-cta");
const hero = document.querySelector(".hero");
const book = document.getElementById("book");
function updateCta() {
  const pastHero = hero.getBoundingClientRect().bottom < 0;
  const atBooking = book.getBoundingClientRect().top < window.innerHeight;
  mobileCta.classList.toggle("show", pastHero && !atBooking);
}
window.addEventListener("scroll", updateCta, { passive: true });
updateCta();

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Don't allow booking dates in the past
const dateInput = document.querySelector('input[type="date"]');
if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

// Forms: no server needed. Opens the visitor's email app with the
// request pre-filled. To use a form service (Formspree, Netlify Forms,
// etc.) instead, give the <form> an action URL and remove data-mailto-form.
document.querySelectorAll("form[data-mailto-form]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const lines = [];
    const addOns = data.getAll("Add-on");

    for (const [key, value] of data.entries()) {
      if (key === "Add-on" || !String(value).trim()) continue;
      lines.push(`${key}: ${value}`);
    }
    if (addOns.length) lines.push(`Add-ons: ${addOns.join(", ")}`);

    const isBooking = form.classList.contains("book-form");
    const subject = isBooking ? "Inspection Booking Request" : "Quote Request";
    const href =
      `mailto:${BUSINESS_EMAIL}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(lines.join("\n"))}`;

    window.location.href = href;

    const note = form.querySelector(".form-note");
    if (note) note.textContent = "Thanks! Your email app should open with your request ready to send.";
  });
});
