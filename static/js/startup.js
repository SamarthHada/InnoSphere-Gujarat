document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("startupRoot");
  if (!root) {
    return;
  }

  const elements = {
    startupForm: document.getElementById("startupForm"),
    startupSearch: document.getElementById("startupSearch"),
    statusFilter: document.getElementById("statusFilter"),
    sortFilter: document.getElementById("sortFilter"),
    sectorFilters: document.getElementById("sectorFilters"),
    startupCards: document.getElementById("startupCards"),
    startupEmptyState: document.getElementById("startupEmptyState"),
    cardStatus: document.getElementById("cardStatus"),
    formStatus: document.getElementById("formStatus"),
    totalStartups: document.getElementById("totalStartups"),
    activeStartups: document.getElementById("activeStartups"),
    avgFunding: document.getElementById("avgFunding"),
    cityCount: document.getElementById("cityCount"),
    incubatingCount: document.getElementById("incubatingCount"),
    topSector: document.getElementById("topSector"),
    topCity: document.getElementById("topCity"),
    portfolioStatus: document.getElementById("portfolioStatus"),
    fundingInput: document.getElementById("funding_received"),
    resetButton: document.getElementById("resetStartupForm"),
    toast: document.getElementById("toast"),
    sectorChart: document.getElementById("sectorChart"),
    fundingChart: document.getElementById("fundingChart")
  };

  const startupFields = {
    startup_name: document.getElementById("startup_name"),
    founder_name: document.getElementById("founder_name"),
    sector: document.getElementById("sector"),
    funding_stage: document.getElementById("funding_stage"),
    funding_received: document.getElementById("funding_received"),
    employee_count: document.getElementById("employee_count"),
    incubation_status: document.getElementById("incubation_status"),
    city: document.getElementById("city")
  };

  const state = {
    search: "",
    sector: "all",
    status: "all",
    sort: "recent"
  };

  const fallbackStartups = [
    {
      id: 1,
      startup_name: "Narmada Grid",
      founder_name: "Aarav Patel",
      sector: "Energy",
      funding_stage: "Seed",
      funding_received: 4200000,
      employee_count: 18,
      incubation_status: "Incubating",
      city: "Ahmedabad",
      status: "Active"
    },
    {
      id: 2,
      startup_name: "MedLens AI",
      founder_name: "Riya Shah",
      sector: "Healthcare",
      funding_stage: "Series A",
      funding_received: 12800000,
      employee_count: 31,
      incubation_status: "Accelerating",
      city: "Surat",
      status: "Active"
    },
    {
      id: 3,
      startup_name: "FinPulse",
      founder_name: "Kabir Mehta",
      sector: "FinTech",
      funding_stage: "Pre-Seed",
      funding_received: 1800000,
      employee_count: 9,
      incubation_status: "Incubating",
      city: "Vadodara",
      status: "Active"
    },
    {
      id: 4,
      startup_name: "AgroLoop",
      founder_name: "Nisha Desai",
      sector: "Climate",
      funding_stage: "Seed",
      funding_received: 5600000,
      employee_count: 22,
      incubation_status: "Graduated",
      city: "Rajkot",
      status: "Active"
    }
  ];

  let startups = [];
  let sectorChart;
  let fundingChart;

  init();

  async function init() {
    wireForm();
    wireFilters();
    await loadData();
  }

  async function loadData() {
    setStatus("Loading startup data...");

    const [startupResult, sectorResult] = await Promise.allSettled([
      fetchJson("/api/startups"),
      fetchJson("/api/startups/analytics/sectors")
    ]);

    const apiStartups = startupResult.status === "fulfilled" && Array.isArray(startupResult.value)
      ? startupResult.value
      : [];

    startups = normalizeStartups(
      apiStartups.length ? apiStartups : fallbackStartups
    );

    if (sectorResult.status === "fulfilled" && sectorResult.value) {
      // Keep the endpoint exercised, but compute chart state from the actual visible data.
      // The sector payload is useful as a fallback if the list endpoint is empty.
    }

    populateFilters(startups);
    render();
    setStatus(apiStartups.length ? "Portfolio loaded" : "Using fallback startup sample");
  }

  function wireFilters() {
    elements.startupSearch.addEventListener("input", () => {
      state.search = elements.startupSearch.value.trim().toLowerCase();
      render();
    });

    elements.statusFilter.addEventListener("change", () => {
      state.status = elements.statusFilter.value || "all";
      render();
    });

    elements.sortFilter.addEventListener("change", () => {
      state.sort = elements.sortFilter.value || "recent";
      render();
    });

    elements.resetButton.addEventListener("click", () => {
      state.search = "";
      state.sector = "all";
      state.status = "all";
      state.sort = "recent";
      elements.startupSearch.value = "";
      elements.statusFilter.value = "all";
      elements.sortFilter.value = "recent";
      updateSectorChips();
      render();
    });

    elements.sectorFilters.addEventListener("click", (event) => {
      const chip = event.target.closest(".filter-chip");
      if (!chip) {
        return;
      }

      state.sector = chip.dataset.value || "all";
      updateSectorChips();
      render();
    });
  }

  function wireForm() {
    elements.startupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!elements.startupForm.checkValidity()) {
        elements.startupForm.reportValidity();
        return;
      }

      const payload = {
        startup_name: startupFields.startup_name.value.trim(),
        founder_name: startupFields.founder_name.value.trim(),
        sector: startupFields.sector.value,
        funding_stage: startupFields.funding_stage.value,
        funding_received: startupFields.funding_received.value,
        employee_count: startupFields.employee_count.value,
        incubation_status: startupFields.incubation_status.value,
        city: startupFields.city.value.trim()
      };

      setFormStatus("Saving startup...");

      try {
        const response = await fetch("/api/startups/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || "Unable to register startup");
        }

        setFormStatus("Startup registered successfully");
        showMessage(data.message || "Startup registered successfully");
        elements.startupForm.reset();
        await loadData();
      } catch (error) {
        setFormStatus(error.message);
        showMessage(error.message, true);
      }
    });
  }

  function render() {
    const filtered = applyFilters(startups);
    const sorted = sortStartups(filtered, state.sort);

    renderCards(sorted);
    renderAnalytics(sorted);
    updateChartData(sorted);
  }

  function applyFilters(collection) {
    return collection.filter((startup) => {
      const textMatch = !state.search || [
        startup.startup_name,
        startup.founder_name,
        startup.sector,
        startup.city,
        startup.funding_stage,
        startup.incubation_status,
        startup.status
      ].some((value) => normalize(value).includes(state.search));

      const sectorMatch = state.sector === "all" || normalize(startup.sector) === state.sector;
      const statusMatch = state.status === "all" || normalize(startup.incubation_status || startup.status) === state.status;

      return textMatch && sectorMatch && statusMatch;
    });
  }

  function sortStartups(collection, sortMode) {
    const sorted = [...collection];

    switch (sortMode) {
      case "funding":
        return sorted.sort((a, b) => (b.funding_received || 0) - (a.funding_received || 0));
      case "name":
        return sorted.sort((a, b) => a.startup_name.localeCompare(b.startup_name));
      case "city":
        return sorted.sort((a, b) => a.city.localeCompare(b.city));
      case "recent":
      default:
        return sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
  }

  function renderCards(collection) {
    elements.startupCards.innerHTML = "";

    if (!collection.length) {
      elements.startupEmptyState.hidden = false;
      elements.cardStatus.textContent = "No matches found";
      return;
    }

    elements.startupEmptyState.hidden = true;
    elements.cardStatus.textContent = `${collection.length} startups visible`;

    const fragment = document.createDocumentFragment();
    collection.forEach((startup) => {
      fragment.appendChild(createCard(startup));
    });

    elements.startupCards.appendChild(fragment);
  }

  function createCard(startup) {
    const card = document.createElement("article");
    card.className = "startup-card";

    const funding = formatCurrency(startup.funding_received);
    const statusLabel = startup.incubation_status || startup.status || "Active";

    card.innerHTML = `
      <div class="startup-card-head">
        <div>
          <h3 class="startup-card-title">${escapeHtml(startup.startup_name)}</h3>
          <p class="startup-card-subtitle">Founded by ${escapeHtml(startup.founder_name || "Unknown founder")}</p>
        </div>
        <span class="status-badge ${statusClass(statusLabel)}">${escapeHtml(statusLabel)}</span>
      </div>

      <div class="startup-chip-row">
        <span class="startup-chip">${escapeHtml(startup.sector || "Sector TBD")}</span>
        <span class="startup-chip alt">${escapeHtml(startup.funding_stage || "Stage TBD")}</span>
      </div>

      <div class="startup-card-stats">
        <div class="startup-stat">
          <span>Funding</span>
          <strong>${funding}</strong>
        </div>
        <div class="startup-stat">
          <span>Team size</span>
          <strong>${startup.employee_count || "N/A"}</strong>
        </div>
        <div class="startup-stat">
          <span>City</span>
          <strong>${escapeHtml(startup.city || "N/A")}</strong>
        </div>
      </div>

      <div class="startup-card-footer">
        <small>${startup.registration_date ? `Registered ${formatDate(startup.registration_date)}` : "Recent startup record"}</small>
        <span class="startup-chip">${escapeHtml(startup.status || "Active")}</span>
      </div>
    `;

    return card;
  }

  function renderAnalytics(collection) {
    const total = collection.length;
    const active = collection.filter((item) => normalize(item.status) === "active").length;
    const incubating = collection.filter((item) => ["incubating", "accelerating"].includes(normalize(item.incubation_status))).length;
    const avgFunding = total
      ? Math.round(collection.reduce((sum, item) => sum + Number(item.funding_received || 0), 0) / total)
      : 0;
    const uniqueCities = new Set(collection.map((item) => normalize(item.city)).filter(Boolean)).size;
    const topSector = topValue(collection, "sector") || "All sectors";
    const topCity = topValue(collection, "city") || "All cities";

    elements.totalStartups.textContent = total;
    elements.activeStartups.textContent = active;
    elements.avgFunding.textContent = formatCurrency(avgFunding);
    elements.cityCount.textContent = uniqueCities;
    elements.incubatingCount.textContent = incubating;
    elements.topSector.textContent = topSector;
    elements.topCity.textContent = topCity;
    elements.portfolioStatus.textContent = total ? "Portfolio live" : "No data";
  }

  function updateChartData(collection) {
    const sectorCounts = countBy(collection, "sector");
    const fundingStages = countBy(collection, "funding_stage");

    const sectorLabels = Object.keys(sectorCounts);
    const sectorValues = Object.values(sectorCounts);
    const fundingLabels = Object.keys(fundingStages);
    const fundingValues = Object.values(fundingStages);

    const sectorPalette = ["#0b7a6d", "#4d76d6", "#f07c42", "#d9a33e", "#8b8cf8", "#14b8a6", "#8d4f3d"];

    if (!sectorChart) {
      sectorChart = new Chart(elements.sectorChart, {
        type: "doughnut",
        data: {
          labels: sectorLabels,
          datasets: [{
            data: sectorValues,
            backgroundColor: sectorPalette,
            borderWidth: 0
          }]
        },
        options: chartOptions("bottom")
      });
    } else {
      sectorChart.data.labels = sectorLabels;
      sectorChart.data.datasets[0].data = sectorValues;
      sectorChart.update();
    }

    if (!fundingChart) {
      fundingChart = new Chart(elements.fundingChart, {
        type: "bar",
        data: {
          labels: fundingLabels,
          datasets: [{
            label: "Startups",
            data: fundingValues,
            backgroundColor: fundingLabels.map((_, index) => sectorPalette[index % sectorPalette.length]),
            borderRadius: 12
          }]
        },
        options: chartOptions("bottom", true)
      });
    } else {
      fundingChart.data.labels = fundingLabels;
      fundingChart.data.datasets[0].data = fundingValues;
      fundingChart.data.datasets[0].backgroundColor = fundingLabels.map((_, index) => sectorPalette[index % sectorPalette.length]);
      fundingChart.update();
    }
  }

  function populateFilters(collection) {
    const sectors = unique(collection.map((item) => item.sector).filter(Boolean));
    const statuses = unique(collection.map((item) => item.incubation_status || item.status).filter(Boolean));

    elements.sectorFilters.innerHTML = "";
    elements.sectorFilters.appendChild(createChip("All sectors", "all", true));
    sectors.forEach((sector) => {
      elements.sectorFilters.appendChild(createChip(sector, normalize(sector), false));
    });

    elements.statusFilter.innerHTML = '<option value="all">All statuses</option>';
    statuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = normalize(status);
      option.textContent = status;
      elements.statusFilter.appendChild(option);
    });

    updateSectorChips();
  }

  function createChip(label, value, active) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${active ? " is-active" : ""}`;
    button.textContent = label;
    button.dataset.value = value;
    return button;
  }

  function updateSectorChips() {
    elements.sectorFilters.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.value === state.sector);
    });
  }

  function setStatus(message) {
    elements.cardStatus.textContent = message;
  }

  function setFormStatus(message) {
    elements.formStatus.textContent = message;
  }

  function showMessage(message, isError = false) {
    if (elements.toast) {
      elements.toast.textContent = message;
      elements.toast.classList.toggle("is-error", isError);
      elements.toast.classList.add("is-visible");

      window.clearTimeout(window.__startupToastTimer);
      window.__startupToastTimer = window.setTimeout(() => {
        elements.toast.classList.remove("is-visible");
      }, 2800);
    }
  }

  function normalizeStartups(collection) {
    return collection.map((item, index) => ({
      id: item.id || index + 1,
      startup_name: item.startup_name || "Unnamed startup",
      founder_name: item.founder_name || "Unknown founder",
      sector: item.sector || "",
      funding_stage: item.funding_stage || "",
      funding_received: Number(item.funding_received || 0),
      employee_count: item.employee_count === null || item.employee_count === undefined ? null : Number(item.employee_count),
      incubation_status: item.incubation_status || item.status || "Active",
      city: item.city || "",
      status: item.status || "Active",
      registration_date: item.registration_date || null
    }));
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed for ${url}`);
    }
    return response.json();
  }

  function topValue(collection, key) {
    if (!collection.length) {
      return "";
    }

    const counts = new Map();
    collection.forEach((item) => {
      const value = normalize(item[key]);
      if (!value) {
        return;
      }
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    let winner = "";
    let winnerCount = 0;
    counts.forEach((count, value) => {
      if (count > winnerCount) {
        winner = value;
        winnerCount = count;
      }
    });

    return winner || "";
  }

  function countBy(collection, key) {
    const counts = new Map();
    collection.forEach((item) => {
      const value = item[key];
      const normalized = normalize(value);
      if (!normalized) {
        return;
      }
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    if (!counts.size) {
      counts.set("No data", 1);
    }

    return Object.fromEntries(counts.entries());
  }

  function chartOptions(legendPosition = "bottom", barChart = false) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: barChart ? undefined : "68%",
      plugins: {
        legend: {
          position: legendPosition,
          labels: {
            color: "#5d687d",
            usePointStyle: true
          }
        }
      },
      scales: barChart
        ? {
            x: {
              ticks: { color: "#5d687d" },
              grid: { color: "rgba(15, 23, 42, 0.08)" }
            },
            y: {
              ticks: { color: "#5d687d" },
              grid: { color: "rgba(15, 23, 42, 0.08)" }
            }
          }
        : undefined
    };
  }

  function formatCurrency(value) {
    const number = Number(value || 0);
    if (!number) {
      return "INR 0";
    }

    return `INR ${new Intl.NumberFormat("en-IN").format(Math.round(number))}`;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "recently";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function statusClass(value) {
    const normalized = normalize(value);
    if (normalized.includes("incub")) {
      return "incubating";
    }
    if (normalized.includes("acceler")) {
      return "accelerating";
    }
    if (normalized.includes("gradu")) {
      return "graduated";
    }
    if (normalized.includes("pause")) {
      return "paused";
    }
    return "active";
  }
});
