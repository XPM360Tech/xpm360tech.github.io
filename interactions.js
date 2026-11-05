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
