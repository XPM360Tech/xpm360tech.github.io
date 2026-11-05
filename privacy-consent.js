(() => {
  const measurementId = "G-HTSB9NKY54";
  const storageKey = "norvil-analytics-consent";
  const consentDuration = 180 * 24 * 60 * 60 * 1000;
  const banner = document.getElementById("consent-banner");
  const status = document.getElementById("consent-status");
  let analyticsLoaded = false;

  if (!banner) return;

  function getSavedChoice() {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return null;

      const preference = JSON.parse(saved);
      if (
        !["accepted", "rejected"].includes(preference.choice) ||
        typeof preference.savedAt !== "number"
      ) {
        return null;
      }

      if (Date.now() - preference.savedAt >= consentDuration) {
        window.localStorage.removeItem(storageKey);
        return null;
      }

      return preference.choice;
    } catch (error) {
      console.warn("Could not read the analytics preference.", error);
      return null;
    }
  }

  function saveChoice(choice) {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ choice, savedAt: Date.now() })
      );
      return true;
    } catch (error) {
      console.error("Could not save the analytics preference.", error);
      status.textContent = "Your choice could not be saved, so analytics remain off.";
      return false;
    }
  }

  function cleanPageLocation() {
    const allowedPaths = new Set(["/", "/index.html", "/terms.html", "/privacy.html"]);
    const pathname = allowedPaths.has(window.location.pathname)
      ? window.location.pathname
      : "/other";
    return `${window.location.origin}${pathname}`;
  }

  function recordPageView() {
    window.gtag("event", "page_view", {
      page_location: cleanPageLocation(),
      page_referrer: "",
      page_title: document.title,
    });
  }

  function recordAppInterest(appName, action) {
    window.gtag("event", "app_link_click", {
      app_name: appName,
      link_action: action,
    });
  }

  function startAnalytics() {
    if (!["norvil.co.za", "www.norvil.co.za"].includes(window.location.hostname)) return;

    window[`ga-disable-${measurementId}`] = false;

    if (analyticsLoaded) {
      recordPageView();
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      page_location: cleanPageLocation(),
      page_referrer: "",
      page_title: document.title,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    recordPageView();

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onerror = () => {
      console.error("Google Analytics could not be loaded.");
    };
    document.head.append(script);
    analyticsLoaded = true;
  }

  function clearAnalyticsCookies() {
    const cookieNames = document.cookie
      .split(";")
      .map((cookie) => cookie.trim().split("=")[0])
      .filter((name) => /^(_ga($|_)|_gid$|_gat($|_))/.test(name));
    const domains = [null];

    if (window.location.hostname === "norvil.co.za" || window.location.hostname.endsWith(".norvil.co.za")) {
      domains.push("norvil.co.za");
    }

    cookieNames.forEach((name) => {
      domains.forEach((domain) => {
        const domainAttribute = domain ? `; Domain=${domain}` : "";
        document.cookie = `${name}=; Max-Age=0; Path=/${domainAttribute}; SameSite=Lax; Secure`;
      });
    });
  }

  function stopAnalytics() {
    window[`ga-disable-${measurementId}`] = true;
    clearAnalyticsCookies();
  }

  function choose(choice) {
    if (!saveChoice(choice)) return;

    banner.hidden = true;
    status.textContent = "";

    if (choice === "accepted") {
      startAnalytics();
    } else {
      stopAnalytics();
    }
  }

  document.querySelectorAll("[data-consent-choice]").forEach((button) => {
    button.addEventListener("click", () => choose(button.dataset.consentChoice));
  });

  document.querySelectorAll("[data-open-consent]").forEach((button) => {
    button.addEventListener("click", () => {
      banner.hidden = false;
      status.textContent = "";
      banner.querySelector("[data-consent-choice='rejected']").focus();
    });
  });

  document.querySelectorAll("[data-analytics-app]").forEach((link) => {
    link.addEventListener("click", () => {
      if (!analyticsLoaded || getSavedChoice() !== "accepted") return;
      recordAppInterest(link.dataset.analyticsApp, link.dataset.analyticsAction);
    });
  });

  const savedChoice = getSavedChoice();
  if (savedChoice === "accepted") {
    startAnalytics();
  } else if (savedChoice === "rejected") {
    stopAnalytics();
  } else {
    window[`ga-disable-${measurementId}`] = true;
    banner.hidden = false;
  }
})();
