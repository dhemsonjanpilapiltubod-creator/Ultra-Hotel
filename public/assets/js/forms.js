/* ==========================================================================
   Ultra Hotel — forms
   One submit path for every form on the site. Client-side validation first,
   then a JSON POST, then an honest success or failure notice.
   ========================================================================== */

import { $, $$ } from "./core.js";
import { GROUP } from "/shared/catalog.mjs";

/* --------------------------------------------------------------------------
   API helper
   -------------------------------------------------------------------------- */

export async function api(path, { method = "GET", body, signal } = {}) {
  const res = await fetch(path, {
    method,
    signal,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  const type = res.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    payload = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const err = new Error((payload && payload.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

/* --------------------------------------------------------------------------
   Validation
   -------------------------------------------------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const VALIDATORS = {
  required: (v) => (String(v || "").trim() ? "" : "This field is required."),
  email: (v) => (EMAIL.test(String(v || "").trim()) ? "" : "Enter a valid email address."),
  tel: (v) => {
    const s = String(v || "").replace(/[^\d]/g, "");
    return v && (s.length < 7 || s.length > 15) ? "Enter a valid phone number." : "";
  },
  minlen: (v, arg) => (String(v || "").trim().length >= Number(arg) ? "" : `Please write at least ${arg} characters.`),
};

function fieldOf(input) {
  return input.closest(".field") || input.closest(".form-grid") || input.parentElement;
}

function setError(input, message) {
  const wrap = fieldOf(input);
  if (wrap) wrap.classList.toggle("has-error", Boolean(message));
  const slot = wrap ? $(".field__error", wrap) : null;
  if (slot) slot.textContent = message || "";
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

export function validateForm(form) {
  let ok = true;
  const firstBad = [];

  for (const input of $$("input, select, textarea", form)) {
    if (input.type === "hidden" || input.disabled || input.name.startsWith("_")) continue;

    const value = input.type === "checkbox" ? input.checked : input.value;
    let message = "";

    for (const rule of (input.dataset.rules || "").split(/\s+/).filter(Boolean)) {
      const [name, arg] = rule.split(":");
      if (!VALIDATORS[name]) continue;
      if (name === "required" && input.type === "checkbox") {
        if (!value) message = "Please tick to continue.";
      } else if (name === "required") {
        message = VALIDATORS.required(value);
      } else if (String(value || "").trim()) {
        message = VALIDATORS[name](value, arg) || "";
      }
      if (message) break;
    }

    if (input.dataset.rules?.includes("required") && !message) message = "";
    setError(input, message);
    if (message) {
      ok = false;
      firstBad.push(input);
    }
  }

  return { ok, firstBad };
}

/* --------------------------------------------------------------------------
   Form wiring
   ========================================================================== */

const ENDPOINTS = {
  newsletter: "/api/newsletter",
  contact: "/api/enquiries",
  reservation: "/api/dining-reservations",
  spa: "/api/spa-appointments",
  proposal: "/api/proposals",
  booking: "/api/bookings",
};

/**
 * data-form="newsletter|contact|reservation|spa|proposal"
 * data-success="…the message shown on success…"
 */
export function initForms(root = document) {
  for (const form of $$("form[data-form]", root)) {
    const kind = form.dataset.form;
    const endpoint = form.dataset.endpoint || ENDPOINTS[kind];
    if (!endpoint) continue;

    const notice = $("[data-form-notice]", form) || null;
    const submit = $("[type=submit]", form);
    const originalLabel = submit ? submit.innerHTML : "";

    // validate on blur once touched
    for (const input of $$("input, select, textarea", form)) {
      input.addEventListener("blur", () => {
        if (input.dataset.touched) return;
        input.dataset.touched = "1";
      });
      input.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid") === "true") {
          input.dataset.touched = "1";
          validateForm(form);
        }
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (notice) notice.hidden = true;
      const check = validateForm(form);
      if (!check.ok) {
        check.firstBad[0]?.focus();
        if (notice) {
          notice.hidden = false;
          notice.className = "notice notice--bad";
          notice.textContent = "Please check the highlighted fields.";
        }
        return;
      }

      const payload = Object.fromEntries(new FormData(form).entries());
      payload.form = kind;
      payload.page = window.location.pathname.split("/").pop() || "index.html";

      if (submit) {
        submit.disabled = true;
        submit.innerHTML = "Sending…";
      }

      try {
        const result = await api(endpoint, { method: "POST", body: payload });

        if (notice) {
          notice.hidden = false;
          notice.className = "notice notice--ok";
          notice.innerHTML = form.dataset.success || "Thank you — we have your details and will be in touch shortly.";
          if (result && result.code) notice.innerHTML += ` <strong>Reference ${result.code}</strong>.`;
        }

        form.reset();
        for (const input of $$("input, select, textarea", form)) delete input.dataset.touched;

        // a booking returns a real confirmation — hand it to the traveller
        if (result && result.confirmation && result.reservation) {
          showConfirmation(notice, result);
        }
      } catch (err) {
        if (notice) {
          notice.hidden = false;
          notice.className = "notice notice--bad";
          notice.textContent =
            err.status === 429
              ? "That is a lot of requests in a short time. Please try again in a minute."
              : `We could not send that just now. Please call ${GROUP.phone} and we will take the details directly.`;
        }
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.innerHTML = originalLabel;
        }
      }
    });
  }
}

function showConfirmation(host, result) {
  if (!host) return;
  const r = result.reservation;
  host.className = "notice notice--ok";
  host.innerHTML = `
    <div>
      <p style="font-weight:600">Confirmed — ${result.confirmation}</p>
      <p style="margin-top:.35rem;font-size:var(--step--2)">
        ${r.roomName} · ${r.nights} ${r.nights === 1 ? "night" : "nights"} ·
        ${r.checkIn} to ${r.checkOut} · total PHP {(r.grandTotalCents / 100).toFixed(2)}
      </p>
      <p style="margin-top:.35rem;font-size:var(--step--2)">
        A summary is on its way to ${r.email}. Keep the confirmation code to hand.
      </p>
    </div>`;
}

/* --------------------------------------------------------------------------
   Newsletter (in the footer) — shares the same path
   -------------------------------------------------------------------------- */

export function initNewsletter() {
  const form = $("form[data-newsletter]");
  if (!form) return;

  const msg = $("#nl-msg", form) || $("[id$=msg]", form);
  const input = $("input[type=email]", form);
  const button = $("[type=submit]", form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = input.value.trim();

    if (!EMAIL.test(value)) {
      msg.textContent = "Enter a valid email address.";
      input.focus();
      return;
    }

    button.disabled = true;
    msg.textContent = "…";
    try {
      await api("/api/newsletter", { method: "POST", body: { email: value, form: "newsletter" } });
      msg.textContent = "Thank you — you're on the list.";
      form.reset();
    } catch {
      msg.textContent = "We could not sign you up just now. Please try again shortly.";
    } finally {
      button.disabled = false;
    }
  });
}
