document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("adminRoot");
  if (!root) {
    return;
  }

  const elements = {
    totalProjects: document.getElementById("totalProjects"),
    totalStartups: document.getElementById("totalStartups"),
    totalIpr: document.getElementById("totalIpr"),
    totalUsers: document.getElementById("totalUsers"),
    approvedProjects: document.getElementById("approvedProjects"),
    pendingProjects: document.getElementById("pendingProjects"),
    pendingIpr: document.getElementById("pendingIpr"),
    activityCount: document.getElementById("activityCount"),
    activityFeed: document.getElementById("activityFeed"),
    activityEmptyState: document.getElementById("activityEmptyState"),
    notificationFeed: document.getElementById("notificationFeed"),
    notificationEmptyState: document.getElementById("notificationEmptyState"),
    healthGrid: document.getElementById("healthGrid"),
    reportMessage: document.getElementById("reportMessage"),
    adminCardStatus: document.getElementById("adminCardStatus"),
    projectStatusChart: document.getElementById("projectStatusChart"),
    startupSectorChart: document.getElementById("startupSectorChart"),
    iprStatusChart: document.getElementById("iprStatusChart")
  };

  let overview = defaultOverview();
  let projectStatusChart;
  let startupSectorChart;
  let iprStatusChart;

  init();

  async function init() {
    await loadOverview();
  }

  async function loadOverview() {
    setStatus("Loading platform overview...");

    try {
      const response = await fetch("/api/admin/overview");

      if (!response.ok) {
        throw new Error("Unable to load admin overview");
      }

      overview = await response.json();
      renderOverview();
      setStatus("Overview loaded");
    } catch (error) {
      overview = defaultOverview();
      renderOverview();
      setStatus(error.message);
    }
  }

  function renderOverview() {
    const metrics = overview.metrics || {};
    const charts = overview.charts || {};

    elements.totalProjects.textContent = metrics.total_projects ?? 0;
    elements.totalStartups.textContent = metrics.total_startups ?? 0;
    elements.totalIpr.textContent = metrics.total_ipr ?? 0;
    elements.totalUsers.textContent = metrics.total_users ?? 0;
    elements.approvedProjects.textContent = metrics.approved_projects ?? 0;
    elements.pendingProjects.textContent = metrics.pending_projects ?? 0;
    elements.pendingIpr.textContent = metrics.pending_ipr ?? 0;
    elements.activityCount.textContent = (overview.activity || []).length;

    renderCharts(charts);
    renderHealthCards(overview.health || []);
    renderActivityFeed(overview.activity || []);
    renderNotifications(overview.notifications || []);
  }

  function renderCharts(charts) {
    const palette = ["#0b7a6d", "#4d76d6", "#f07c42", "#d9a33e", "#8b8cf8"];

    const projectStatus = charts.project_status || defaultBreakdown();
    const startupSector = charts.startup_sector || defaultBreakdown();
    const iprStatus = charts.ipr_status || defaultBreakdown();

    if (!projectStatusChart) {
      projectStatusChart = new Chart(elements.projectStatusChart, {
        type: "doughnut",
        data: breakdownData(projectStatus, palette),
        options: chartOptions("bottom")
      });
    } else {
      syncChart(projectStatusChart, projectStatus, palette);
    }

    if (!startupSectorChart) {
      startupSectorChart = new Chart(elements.startupSectorChart, {
        type: "bar",
        data: breakdownData(startupSector, palette),
        options: chartOptions("bottom", true)
      });
    } else {
      syncChart(startupSectorChart, startupSector, palette, true);
    }

    if (!iprStatusChart) {
      iprStatusChart = new Chart(elements.iprStatusChart, {
        type: "pie",
        data: breakdownData(iprStatus, palette),
        options: chartOptions("bottom")
      });
    } else {
      syncChart(iprStatusChart, iprStatus, palette);
    }
  }

  function breakdownData(breakdown, palette) {
    const labels = breakdown.labels && breakdown.labels.length ? breakdown.labels : ["No data"];
    const values = breakdown.values && breakdown.values.length ? breakdown.values : [1];

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, index) => palette[index % palette.length]),
        borderWidth: 0
      }]
    };
  }

  function syncChart(chart, breakdown, palette, barChart = false) {
    const labels = breakdown.labels && breakdown.labels.length ? breakdown.labels : ["No data"];
    const values = breakdown.values && breakdown.values.length ? breakdown.values : [1];

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].backgroundColor = labels.map((_, index) => palette[index % palette.length]);
    chart.update();
  }

  function renderHealthCards(cards) {
    elements.healthGrid.innerHTML = "";

    if (!cards.length) {
      elements.healthGrid.innerHTML = `
        <div class="note-card">
          <strong>No health data</strong>
          <span>The admin overview did not return health metrics.</span>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    cards.forEach((card) => {
      const node = document.createElement("article");
      node.className = "note-card";
      node.innerHTML = `
        <strong>${escapeHtml(card.label)}</strong>
        <div class="status-badge ${escapeHtml(card.tone || "pending")}">${escapeHtml(card.value)}</div>
        <p style="margin: 10px 0 0; color: var(--muted); line-height: 1.6;">${escapeHtml(card.detail || "")}</p>
      `;
      fragment.appendChild(node);
    });

    elements.healthGrid.appendChild(fragment);
  }

  function renderActivityFeed(activity) {
    elements.activityFeed.innerHTML = "";

    if (!activity.length) {
      elements.activityEmptyState.hidden = false;
      return;
    }

    elements.activityEmptyState.hidden = true;
    const fragment = document.createDocumentFragment();

    activity.forEach((item) => {
      const node = document.createElement("article");
      node.className = "activity-item";
      node.innerHTML = `
        <div>
          <strong>${escapeHtml(item.activity_type || "Activity")}</strong>
          <small>${escapeHtml(item.module || "System")}</small>
        </div>
        <div class="status-badge ${activityTone(item.status)}">${escapeHtml(item.status || "Logged")}</div>
      `;
      fragment.appendChild(node);
    });

    elements.activityFeed.appendChild(fragment);
  }

  function renderNotifications(notifications) {
    elements.notificationFeed.innerHTML = "";

    if (!notifications.length) {
      elements.notificationEmptyState.hidden = false;
      return;
    }

    elements.notificationEmptyState.hidden = true;
    const fragment = document.createDocumentFragment();

    notifications.forEach((item) => {
      const node = document.createElement("li");
      node.innerHTML = `
        <strong>${escapeHtml(item.message || "Notification")}</strong>
        <span>${escapeHtml(item.type || "System")} ${item.created_at ? `• ${formatDate(item.created_at)}` : ""}</span>
      `;
      fragment.appendChild(node);
    });

    elements.notificationFeed.appendChild(fragment);
  }

  window.generateReport = async function generateReport() {
    elements.reportMessage.textContent = "Generating report...";

    try {
      const response = await fetch("/api/reports/projects");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate report");
      }

      elements.reportMessage.textContent = `${data.message} ${data.path ? `(${data.path})` : ""}`.trim();
    } catch (error) {
      elements.reportMessage.textContent = error.message;
    }
  };

  function setStatus(message) {
    elements.adminCardStatus.textContent = message;
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

  function defaultOverview() {
    return {
      metrics: {
        total_projects: 0,
        approved_projects: 0,
        pending_projects: 0,
        total_startups: 0,
        active_startups: 0,
        total_ipr: 0,
        approved_ipr: 0,
        pending_ipr: 0,
        total_users: 0
      },
      charts: {
        project_status: defaultBreakdown(),
        startup_sector: defaultBreakdown(),
        ipr_status: defaultBreakdown()
      },
      health: [],
      activity: [],
      notifications: []
    };
  }

  function defaultBreakdown() {
    return {
      labels: ["No data"],
      values: [1]
    };
  }

  function activityTone(status) {
    const value = normalize(status);
    if (value.includes("error") || value.includes("fail")) {
      return "rejected";
    }
    if (value.includes("warn") || value.includes("pending")) {
      return "pending";
    }
    if (value.includes("ok") || value.includes("done") || value.includes("approved")) {
      return "approved";
    }
    return "under-review";
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
});
