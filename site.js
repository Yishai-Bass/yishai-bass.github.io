const audienceContent = {
  customers: {
    title: "Coffee that's ready when you are.",
    lede: "Earn better rewards, order ahead, order with friends, pay with Apple Pay or Samsung Pay, and make group coffee runs less messy.",
    subject: "Coffee lover wants to join the OrderUp waitlist",
    message: "A coffee lover signed up to join the OrderUp waitlist.",
    userType: "coffee_lover",
    waitlistCopy: "Tell us where to reach you and we will keep you posted on launch access, early shops, and beta availability.",
    formSubmit: "Join the waitlist",
    flowNav: "Coffee drinker flow",
    waitlistPoints: [
      "Get launch updates.",
      "Hear when the first coffee shops go live.",
      "Tell us what would make your coffee run smoother."
    ]
  },
  shops: {
    title: "A faster lane for your coffee shop.",
    lede: "Take paid orders, manage prep, control availability, get analytics and insights, and give your users built-in modernised rewards.",
    subject: "Coffee shop wants to join OrderUp",
    message: "A coffee shop signed up to learn about OrderUp merchant onboarding.",
    userType: "coffee_shop",
    waitlistCopy: "Share a few shop details and we will follow up with launch timing, onboarding steps, and partnership options.",
    formSubmit: "Request shop signup",
    flowNav: "Coffee shop flow",
    waitlistPoints: [
      "Get onboarding details for your shop.",
      "Share your location, current setup, and best contact route.",
      "Ask about menu setup, payouts, loyalty, and launch timing."
    ]
  }
};

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const audienceTabs = document.querySelectorAll("[data-audience]");
const heroEyebrow = document.querySelector("#audience-eyebrow");
const heroTitle = document.querySelector("#hero-title");
const heroLede = document.querySelector("#hero-lede");
const navFlow = document.querySelector("#nav-flow");
const waitlistCopy = document.querySelector("#waitlist-copy");
const waitlistTitle = document.querySelector("#waitlist-title");
const waitlistPoints = document.querySelectorAll("#waitlist-points li");
const waitlistForm = document.querySelector("#waitlist-form");
const formStatus = document.querySelector("#form-status");
const shopFields = document.querySelector("#shop-fields");
const phoneField = document.querySelector("#phone-field");
const phoneInput = phoneField?.querySelector("input");
const emailSubject = document.querySelector("#email-subject");
const emailMessage = document.querySelector("#email-message");
const userType = document.querySelector("#user-type");
const signupRadios = document.querySelectorAll('input[name="signup_type"]');
const submitText = document.querySelector(".submit-text");
const flowSections = document.querySelectorAll("[data-flow]");

let currentAudience = "customers";

function setAudience(audience) {
  currentAudience = audience;
  const content = audienceContent[audience];
  document.body.dataset.audience = audience;

  if (heroEyebrow) {
    heroEyebrow.textContent = content.eyebrow;
  }
  if (heroTitle) {
    heroTitle.textContent = content.title;
  }
  if (heroLede) {
    heroLede.textContent = content.lede;
  }
  if (navFlow) {
    navFlow.textContent = content.flowNav;
  }
  if (waitlistTitle) {
    waitlistTitle.textContent = audience === "shops"
      ? "Bring your coffee shop into the first OrderUp! launch wave."
      : "Be first in line when OrderUp! opens.";
  }
  if (waitlistCopy) {
    waitlistCopy.textContent = content.waitlistCopy;
  }
  if (emailSubject) {
    emailSubject.value = content.subject;
  }
  if (emailMessage) {
    emailMessage.value = content.message;
  }
  if (userType) {
    userType.value = content.userType;
  }
  if (submitText) {
    submitText.textContent = content.formSubmit;
  }

  waitlistPoints.forEach((point, index) => {
    point.textContent = content.waitlistPoints[index] || "";
  });

  flowSections.forEach((section) => {
    section.hidden = section.dataset.flow !== audience;
  });

  audienceTabs.forEach((tab) => {
    const isActive = tab.dataset.audience === audience;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  signupRadios.forEach((radio) => {
    radio.checked = radio.value === content.userType;
  });

  const isShop = audience === "shops";
  if (shopFields) {
    shopFields.hidden = !isShop;
  }
  if (phoneField && phoneInput) {
    phoneField.hidden = !isShop;
    phoneInput.disabled = !isShop;
    phoneInput.required = isShop;
    if (!isShop) {
      phoneInput.value = "";
    }
  }
}

navToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("nav-open", isOpen);
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  });
});

audienceTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setAudience(tab.dataset.audience);
    [0, 80].forEach((delay) => {
      window.setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }, delay);
    });
  });
});

signupRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    setAudience(radio.value === "coffee_shop" ? "shops" : "customers");
  });
});

waitlistForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "";
  formStatus.className = "form-status";

  if (!waitlistForm.reportValidity()) {
    return;
  }

  waitlistForm.classList.add("is-submitting");
  const submitButton = waitlistForm.querySelector("button[type='submit']");
  submitButton.disabled = true;

  const formData = new FormData(waitlistForm);
  formData.set("audience", currentAudience);
  formData.set("submitted_at", new Date().toISOString());

  try {
    const response = await fetch(waitlistForm.action, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Submission failed");
    }

    try {
      const backup = Object.fromEntries(formData.entries());
      localStorage.setItem("orderup_waitlist_last_submission", JSON.stringify(backup));
    } catch (storageError) {
      // Storage is only a local convenience; the remote signup already succeeded.
    }
    waitlistForm.reset();
    setAudience(currentAudience);
    formStatus.textContent = currentAudience === "shops"
      ? "Thank you. We have your shop details and will be in touch."
      : "Thank you. You are on the OrderUp waitlist.";
    formStatus.classList.add("success");
  } catch (error) {
    formStatus.textContent = "Something went wrong. Please try again in a moment.";
    formStatus.classList.add("error");
  } finally {
    waitlistForm.classList.remove("is-submitting");
    submitButton.disabled = false;
  }
});

setAudience(currentAudience);
