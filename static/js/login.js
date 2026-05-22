document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) {
    return;
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitButton = document.getElementById("loginSubmit");
  const status = document.getElementById("loginStatus");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      setStatus("Email and password are required.", true);
      return;
    }

    setSubmitting(true);
    setStatus("Signing in...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Invalid login credentials");
      }

      const nextPath = safeNext(window.loginNext);
      const target = nextPath || (normalizeRole(data.role) === "admin" ? "/admin" : "/dashboard");

      setStatus("Login successful. Redirecting...");
      window.location.assign(target);
    } catch (error) {
      setStatus(error.message || "Unable to sign in.", true);
      setSubmitting(false);
    }
  });

  function setSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting;
    emailInput.disabled = isSubmitting;
    passwordInput.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? "Signing in..." : "Sign in";
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? "#b42318" : "";
  }

  function normalizeRole(value) {
    return String(value || "").trim().toLowerCase();
  }

  function safeNext(value) {
    const target = String(value || "").trim();
    if (!target || !target.startsWith("/")) {
      return "";
    }

    if (target.startsWith("//")) {
      return "";
    }

    return target;
  }
});
