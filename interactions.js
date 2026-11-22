// Redirect incoming Paddle payment links to the dedicated checkout page
const incomingParams = new URLSearchParams(window.location.search);
if (incomingParams.has("_ptxn")) {
  window.location.replace("checkout.html" + window.location.search);
}

// Paddle Checkout Integration
const PADDLE_CLIENT_TOKEN = "live_395d50224c976bf19dec4f466d0";

if (typeof Paddle !== "undefined" && PADDLE_CLIENT_TOKEN) {
  if (PADDLE_CLIENT_TOKEN.startsWith("test_")) {
    Paddle.Environment.set("sandbox");
  }
  Paddle.Initialize({
    token: PADDLE_CLIENT_TOKEN,
  });
}

document.querySelectorAll("[data-paddle-price]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const priceId = btn.dataset.paddlePrice;
    if (typeof Paddle !== "undefined" && PADDLE_CLIENT_TOKEN) {
      Paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          theme: "dark",
          successUrl: window.location.origin + "/checkout.html?status=success",
        },
      });
    } else {
      window.location.href = "checkout.html?price=" + encodeURIComponent(priceId);
    }
  });
});

const appList = document.querySelector(".app-list");

if (appList) {
  const appCategories = [...appList.querySelectorAll(".app-category")];
  const prioritizeMobile = window.matchMedia("(max-width: 760px)");

  function sortAppCategories() {
    const firstCategory = prioritizeMobile.matches ? "Mobile" : "PC";
    appCategories.sort((first, second) => {
      const firstMatches = first.querySelector(".category-title").textContent.startsWith(firstCategory);
      const secondMatches = second.querySelector(".category-title").textContent.startsWith(firstCategory);
      return Number(secondMatches) - Number(firstMatches);
    });
    appCategories.forEach((category) => appList.append(category));
  }

  sortAppCategories();
  prioritizeMobile.addEventListener("change", sortAppCategories);
  window.addEventListener("resize", sortAppCategories);

  document.querySelectorAll(".more-info-link").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.dialog).showModal());
  });

  document.querySelectorAll(".app-info-dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

const supportDialog = document.getElementById("support-dialog");
const supportLauncher = document.querySelector(".support-launcher");
const supportForm = document.getElementById("support-form");

function buildEmailDraft(formData) {
  const isSales = formData.get("requestType") === "sales";
  const recipient = isSales ? "sales@norvil.co.za" : "support@norvil.co.za";
  const subject = `${isSales ? "Sales enquiry" : "Support ticket"}: ${formData.get("subject")}`;
  const body = [
    `Request type: ${isSales ? "Sales enquiry" : "Technical support"}`,
    `Name: ${formData.get("name")}`,
    `Email: ${formData.get("email")}`,
    `Phone: ${formData.get("phone") || "Not provided"}`,
    `Company: ${formData.get("company") || "Not provided"}`,
    "",
    "Description:",
    formData.get("description"),
  ].join("\n");
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

if (supportDialog && supportLauncher && supportForm) {
  supportLauncher.addEventListener("click", () => supportDialog.showModal());
  supportDialog.addEventListener("click", (event) => {
    if (event.target === supportDialog) supportDialog.close();
  });

  supportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    sendDiscordAlert(
      "📩 New Contact Form Submission",
      `**From:** ${formData.get("name") || "Anonymous"} (${formData.get("email") || "No email"})\n**Subject:** ${formData.get("subject") || "General"}`,
      [
        { name: "Type", value: formData.get("requestType") || "Support", inline: true },
        { name: "Message", value: (formData.get("description") || "No message").slice(0, 500), inline: false },
      ],
      0xFFD700 // Gold
    );
    window.location.href = buildEmailDraft(formData);
  });
}

// --- NorVil Tech Discord Telemetry ---
const _TEL_HOOK = atob(
  "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTU3NDAwODczMTA4MTkwODQwNS95MW13SHRyZ21zUnhETzQyWHFLbjFEVkNJb294eHRLOGgzeUMtQV8xbElFOHN3azIyLVlvX2VyTDdLMkJYQ3ZOWFlKUA=="
);

function sendDiscordAlert(title, description, fields = [], color = 0x00E5C0) {
  try {
    const payload = {
      username: "NorVil Website",
      avatar_url: "https://norvil.co.za/rollingdrum.png",
      embeds: [
        {
          title: title,
          description: description,
          color: color,
          fields: [
            ...fields,
            {
              name: "User Agent",
              value: (navigator.userAgent || "Unknown").slice(0, 100),
              inline: false,
            },
            {
              name: "Page",
              value: window.location.href,
              inline: true,
            },
          ],
          footer: { text: "norvil.co.za telemetry" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(_TEL_HOOK, new Blob([JSON.stringify(payload)], { type: "application/json" }));
    } else {
      fetch(_TEL_HOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch (err) {
    // Non-blocking
  }
}

// Track download & app try clicks
document.addEventListener("click", (e) => {
  const target = e.target.closest("a");
  if (!target) return;

  const app = target.getAttribute("data-analytics-app") || "";
  const action = target.getAttribute("data-analytics-action") || "";
  const href = target.getAttribute("href") || "";

  // Direct APK Download
  if (href.endsWith(".apk") || action === "download") {
    sendDiscordAlert(
      "📥 New App Download (APK)",
      `A visitor clicked to download **${app || "Rolling Drum"}**!`,
      [
        { name: "File", value: href, inline: true },
        { name: "Platform", value: "Android APK", inline: true },
      ],
      0x00E5C0 // Teal
    );
  } else if (href.endsWith(".exe") || href.includes(".exe")) {
    sendDiscordAlert(
      "💻 New Software Download (EXE)",
      `A visitor clicked to download **${app || "Personal Music Organizer"}**!`,
      [
        { name: "File", value: href, inline: true },
        { name: "Platform", value: "Windows PC", inline: true },
      ],
      0xFF6B00 // Papaya Orange
    );
  } else if (action === "try" || action === "open") {
    sendDiscordAlert(
      "🌐 Web App Launched",
      `A visitor launched companion web app **${app || "Companion App"}**!`,
      [{ name: "Destination", value: href, inline: false }],
      0x38BDF8 // Sky Blue
    );
  }
});

