document.addEventListener("DOMContentLoaded", () => {
  const actionable = document.querySelectorAll(".working-box");

  actionable.forEach((element) => {
    element.addEventListener("click", () => {
      const label = element.textContent.trim();
      window.alert(`${label} clicked. This demo uses static data in Flask (Python).`);
    });
  });
});
