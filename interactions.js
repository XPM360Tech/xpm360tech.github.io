// Redirect incoming Paddle payment links to the dedicated checkout page
const incomingParams = new URLSearchParams(window.location.search);
if (incomingParams.has("_ptxn")) {
  window.location.replace("checkout.html" + window.location.search);
}

// Paddle Checkout Integration
const PADDLE_CLIENT_TOKEN = "test_c7e69318d828fb50215a9f1843f";

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
    window.location.href = buildEmailDraft(new FormData(event.currentTarget));
  });
}
