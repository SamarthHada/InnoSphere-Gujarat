document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("dashboardRoot");
  if (!root) {
    return;
  }

  const totalProjects = Number(root.dataset.totalProjects || 0);
  const totalStartups = Number(root.dataset.totalStartups || 0);
  const totalIpr = Number(root.dataset.totalIpr || 0);
  const totalUsers = Number(root.dataset.totalUsers || 0);
  const approvedProjects = Number(root.dataset.approvedProjects || 0);
  const pendingProjects = Number(root.dataset.pendingProjects || 0);

  const tableBody = document.getElementById("projectTableBody");
  const emptyState = document.getElementById("tableEmptyState");
  const projectSearch = document.getElementById("projectSearch");
  const statusFilter = document.getElementById("statusFilter");
  const sortFilter = document.getElementById("sortFilter");
  const domainFilters = document.getElementById("domainFilters");
  const themeSwitcher = document.getElementById("themeSwitcher");

  const visibleCount = document.getElementById("visibleCount");
  const sidebarVisibleCount = document.getElementById("sidebarVisibleCount");
  const approvedCount = document.getElementById("approvedCount");
  const pendingCount = document.getElementById("pendingCount");
  const approvalRate = document.getElementById("approvalRate");
  const trendMetric = document.getElementById("trendMetric");
  const trendDelta = document.getElementById("trendDelta");
  const liveSliceLabel = document.getElementById("liveSliceLabel");
  const liveVisibleRows = document.getElementById("liveVisibleRows");
  const liveApprovalRate = document.getElementById("liveApprovalRate");
  const liveTopDomain = document.getElementById("liveTopDomain");
  const liveTopStatus = document.getElementById("liveTopStatus");
  const tableStatusText = document.getElementById("tableStatusText");

  const rows = Array.from(tableBody.querySelectorAll("tr"));
  const records = rows.map((row, index) => ({
    row,
    index,
    id: Number(row.dataset.projectId || index + 1),
    title: row.dataset.title || row.querySelector(".table-title")?.textContent.trim() || "",
    domain: row.dataset.domain || "",
    researcher: row.dataset.researcher || "",
    status: row.dataset.status || "",
    titleKey: normalize(row.dataset.title || row.querySelector(".table-title")?.textContent || ""),
    domainKey: normalize(row.dataset.domain || ""),
    researcherKey: normalize(row.dataset.researcher || ""),
    statusKey: normalize(row.dataset.status || "")
  }));

  const themeMap = {
    emerald: {
      brand: "#0b7a6d",
      brandStrong: "#0a5a78",
      accent: "#f07c42",
      secondary: "#4d76d6",
      gold: "#d9a33e",
      brandSoft: "rgba(11, 122, 109, 0.12)",
      text: "#0f172a",
      muted: "#5d687d",
      grid: "rgba(15, 23, 42, 0.08)"
    },
    ocean: {
      brand: "#126f91",
      brandStrong: "#0c4f79",
      accent: "#4ca7d8",
      secondary: "#f08a5d",
      gold: "#d9a33e",
      brandSoft: "rgba(18, 111, 145, 0.12)",
      text: "#0f172a",
      muted: "#5d687d",
      grid: "rgba(15, 23, 42, 0.08)"
    },
    sunset: {
      brand: "#c9652a",
      brandStrong: "#8d4f3d",
      accent: "#0b7a6d",
      secondary: "#4d76d6",
      gold: "#d9a33e",
      brandSoft: "rgba(201, 101, 42, 0.12)",
      text: "#0f172a",
      muted: "#5d687d",
      grid: "rgba(15, 23, 42, 0.08)"
    }
  };

  let currentTheme = "emerald";
  let currentDomain = "all";
  let statusValue = "all";

  Chart.defaults.font.family = '"Manrope", sans-serif';
  Chart.defaults.color = themeMap.emerald.muted;

  const chartTextColor = () => themeMap[currentTheme].muted;
  const chartGridColor = () => themeMap[currentTheme].grid;

  const researchChart = new Chart(document.getElementById("researchChart"), {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [{
        label: "Visible projects",
        data: [120, 220, 350, 500, 700, totalProjects],
        borderColor: themeMap[currentTheme].brand,
        backgroundColor: themeMap[currentTheme].brandSoft,
        fill: true,
        tension: 0.38,
        pointRadius: 4,
        pointBackgroundColor: themeMap[currentTheme].brand,
        pointBorderColor: "#fff",
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: chartTextColor(),
            usePointStyle: true
          }
        }
      },
      scales: {
        x: {
          ticks: { color: chartTextColor() },
          grid: { color: chartGridColor() }
        },
        y: {
          ticks: { color: chartTextColor() },
          grid: { color: chartGridColor() }
        }
      }
    }
  });

  const statusChart = new Chart(document.getElementById("statusChart"), {
    type: "doughnut",
    data: {
      labels: ["Approved", "Pending", "Other"],
      datasets: [{
        data: [approvedProjects, pendingProjects, Math.max(totalProjects - approvedProjects - pendingProjects, 0)],
        backgroundColor: [themeMap[currentTheme].brand, themeMap[currentTheme].accent, themeMap[currentTheme].secondary],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "66%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: chartTextColor(),
            usePointStyle: true
          }
        }
      }
    }
  });

  const startupChart = new Chart(document.getElementById("startupChart"), {
    type: "bar",
    data: {
      labels: ["AI", "Healthcare", "FinTech", "Energy", "Robotics"],
      datasets: [{
        label: "Startup domains",
        data: [40, 28, 32, 18, 25],
        borderRadius: 12,
        backgroundColor: [
          themeMap[currentTheme].brand,
          themeMap[currentTheme].secondary,
          themeMap[currentTheme].accent,
          themeMap[currentTheme].gold,
          "#8b8cf8"
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: chartTextColor(),
            usePointStyle: true
          }
        }
      },
      scales: {
        x: {
          ticks: { color: chartTextColor() },
          grid: { color: chartGridColor() }
        },
        y: {
          ticks: { color: chartTextColor() },
          grid: { color: chartGridColor() }
        }
      }
    }
  });

  const iprChart = new Chart(document.getElementById("iprChart"), {
    type: "pie",
    data: {
      labels: ["Approved", "Pending", "Rejected"],
      datasets: [{
        data: [65, 25, 10],
        backgroundColor: [themeMap[currentTheme].brand, themeMap[currentTheme].secondary, themeMap[currentTheme].accent],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: chartTextColor(),
            usePointStyle: true
          }
        }
      }
    }
  });

  const statusOptions = unique(records.map((record) => record.status)).filter(Boolean);
  statusOptions.forEach((status) => {
    const option = document.createElement("option");
    option.value = normalize(status);
    option.textContent = status;
    statusFilter.appendChild(option);
  });

  renderDomainFilters(unique(records.map((record) => record.domain)).filter(Boolean));

  projectSearch.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", (event) => {
    statusValue = event.target.value || "all";
    applyFilters();
  });
  sortFilter.addEventListener("change", applyFilters);
  themeSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest(".theme-button");
    if (!button) {
      return;
    }
    setTheme(button.dataset.theme || "emerald");
  });

  applyFilters();

  function applyFilters() {
    const searchTerm = normalize(projectSearch.value);
    const sortMode = sortFilter.value;

    const filtered = records.filter((record) => {
      const matchesSearch =
        !searchTerm ||
        record.titleKey.includes(searchTerm) ||
        record.domainKey.includes(searchTerm) ||
        record.researcherKey.includes(searchTerm) ||
        record.statusKey.includes(searchTerm);

      const matchesStatus = statusValue === "all" || record.statusKey === statusValue;
      const matchesDomain = currentDomain === "all" || record.domainKey === currentDomain;

      return matchesSearch && matchesStatus && matchesDomain;
    });

    const sorted = sortRecords(filtered, sortMode);
    const fragment = document.createDocumentFragment();

    sorted.forEach((record) => {
      record.row.hidden = false;
      fragment.appendChild(record.row);
    });

    records.forEach((record) => {
      if (!sorted.includes(record)) {
        record.row.hidden = true;
      }
    });

    tableBody.appendChild(fragment);
    updateEmptyState(sorted.length === 0);
    updateSummary(sorted);
    updateCharts(sorted);
  }

  function updateEmptyState(isEmpty) {
    emptyState.hidden = !isEmpty;
    tableBody.closest(".table-wrap").hidden = isEmpty;
    tableStatusText.textContent = isEmpty
      ? "No records match the current filters"
      : `${tableBody.querySelectorAll("tr:not([hidden])").length} records visible`;
  }

  function updateSummary(filtered) {
    const approvedVisible = filtered.filter((record) => record.statusKey === "approved").length;
    const pendingVisible = filtered.filter((record) => record.statusKey === "pending").length;
    const visibleTotal = filtered.length;
    const approvalRatio = visibleTotal ? Math.round((approvedVisible / visibleTotal) * 100) : 0;
    const topDomain = getTopValue(filtered, "domain");
    const topStatus = getTopValue(filtered, "status");

    visibleCount.textContent = visibleTotal;
    sidebarVisibleCount.textContent = visibleTotal;
    approvedCount.textContent = approvedVisible;
    pendingCount.textContent = pendingVisible;
    approvalRate.textContent = `${approvalRatio}%`;
    trendMetric.textContent = visibleTotal;
    trendDelta.textContent = `${approvalRatio}%`;
    liveVisibleRows.textContent = visibleTotal;
    liveApprovalRate.textContent = `${approvalRatio}%`;
    liveTopDomain.textContent = topDomain || "All domains";
    liveTopStatus.textContent = topStatus || "All statuses";
    liveSliceLabel.textContent = visibleTotal
      ? `${visibleTotal} records in view`
      : "No active records";
  }

  function updateCharts(filtered) {
    const approvedVisible = filtered.filter((record) => record.statusKey === "approved").length;
    const pendingVisible = filtered.filter((record) => record.statusKey === "pending").length;
    const otherVisible = Math.max(filtered.length - approvedVisible - pendingVisible, 0);
    const theme = themeMap[currentTheme];

    researchChart.data.datasets[0].data = [120, 220, 350, 500, 700, Math.max(filtered.length, 0)];
    researchChart.data.datasets[0].borderColor = theme.brand;
    researchChart.data.datasets[0].backgroundColor = theme.brandSoft;
    researchChart.data.datasets[0].pointBackgroundColor = theme.brand;
    researchChart.options.plugins.legend.labels.color = chartTextColor();
    researchChart.options.scales.x.ticks.color = chartTextColor();
    researchChart.options.scales.y.ticks.color = chartTextColor();
    researchChart.options.scales.x.grid.color = chartGridColor();
    researchChart.options.scales.y.grid.color = chartGridColor();
    researchChart.update();

    statusChart.data.datasets[0].data = [approvedVisible, pendingVisible, otherVisible];
    statusChart.data.datasets[0].backgroundColor = [theme.brand, theme.accent, theme.secondary];
    statusChart.options.plugins.legend.labels.color = chartTextColor();
    statusChart.update();

    startupChart.data.datasets[0].backgroundColor = [
      theme.brand,
      theme.secondary,
      theme.accent,
      theme.gold,
      "#8b8cf8"
    ];
    startupChart.options.plugins.legend.labels.color = chartTextColor();
    startupChart.options.scales.x.ticks.color = chartTextColor();
    startupChart.options.scales.y.ticks.color = chartTextColor();
    startupChart.options.scales.x.grid.color = chartGridColor();
    startupChart.options.scales.y.grid.color = chartGridColor();
    startupChart.update();

    iprChart.data.datasets[0].backgroundColor = [theme.brand, theme.secondary, theme.accent];
    iprChart.options.plugins.legend.labels.color = chartTextColor();
    iprChart.update();
  }

  function setTheme(themeName) {
    if (!themeMap[themeName]) {
      themeName = "emerald";
    }

    currentTheme = themeName;
    const theme = themeMap[themeName];
    const styles = document.documentElement.style;

    styles.setProperty("--brand", theme.brand);
    styles.setProperty("--brand-strong", theme.brandStrong);
    styles.setProperty("--accent", theme.accent);
    styles.setProperty("--brand-soft", theme.brandSoft);
    styles.setProperty("--text", theme.text);
    styles.setProperty("--muted", theme.muted);

    themeSwitcher.querySelectorAll(".theme-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.theme === themeName);
    });

    applyFilters();
  }

  function renderDomainFilters(domains) {
    domainFilters.innerHTML = "";

    const allButton = createFilterChip("All domains", "all", true);
    domainFilters.appendChild(allButton);

    domains.forEach((domain) => {
      domainFilters.appendChild(createFilterChip(domain, normalize(domain), false));
    });
  }

  function createFilterChip(label, value, active) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${active ? " is-active" : ""}`;
    button.textContent = label;
    button.dataset.value = value;
    button.addEventListener("click", () => {
      currentDomain = value;
      domainFilters.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.classList.toggle("is-active", chip.dataset.value === value);
      });
      applyFilters();
    });
    return button;
  }

  function sortRecords(filtered, sortMode) {
    const copy = [...filtered];

    switch (sortMode) {
      case "oldest":
        return copy.sort((a, b) => a.id - b.id);
      case "title":
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      case "researcher":
        return copy.sort((a, b) => a.researcher.localeCompare(b.researcher));
      case "recent":
      default:
        return copy.sort((a, b) => b.id - a.id);
    }
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function getTopValue(filtered, key) {
    if (!filtered.length) {
      return "";
    }

    const counts = new Map();
    filtered.forEach((record) => {
      const value = record[key];
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

    return winner;
  }
});
