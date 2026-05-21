document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("iprRoot");
  if (!root) {
    return;
  }

  const elements = {
    iprForm: document.getElementById("iprForm"),
    iprSearch: document.getElementById("iprSearch"),
    iprStatusFilter: document.getElementById("iprStatusFilter"),
    iprSortFilter: document.getElementById("iprSortFilter"),
    iprTableBody: document.getElementById("iprTableBody"),
    iprEmptyState: document.getElementById("iprEmptyState"),
    iprCardStatus: document.getElementById("iprCardStatus"),
    iprTableStatus: document.getElementById("iprTableStatus"),
    workflowStatus: document.getElementById("workflowStatus"),
    totalIpr: document.getElementById("totalIpr"),
    approvalRate: document.getElementById("approvalRate"),
    underReviewIpr: document.getElementById("underReviewIpr"),
    pendingIpr: document.getElementById("pendingIpr"),
    approvedIpr: document.getElementById("approvedIpr"),
    rejectedIpr: document.getElementById("rejectedIpr"),
    reviewShare: document.getElementById("reviewShare"),
    approvedCounter: document.getElementById("approvedIpr"),
    workflowReset: document.getElementById("resetIprForm"),
    toast: document.getElementById("toast"),
    statusChart: document.getElementById("statusChart"),
    typeChart: document.getElementById("typeChart")
  };

  const fields = {
    patentTitle: document.getElementById("patent_title"),
    applicantName: document.getElementById("applicant_name"),
    patentType: document.getElementById("patent_type"),
    approvalStatus: document.getElementById("approval_status")
  };

  const state = {
    search: "",
    status: "all",
    sort: "recent"
  };

  const fallbackRecords = [
    {
      id: 1,
      patent_title: "Automated Water Quality Sensor",
      applicant_name: "Aarav Patel",
      patent_type: "Utility",
      approval_status: "Pending",
      application_date: "2026-03-12T09:30:00"
    },
    {
      id: 2,
      patent_title: "Carbon Capture Filtration Shell",
      applicant_name: "Riya Shah",
      patent_type: "Design",
      approval_status: "Under Review",
      application_date: "2026-03-14T11:20:00"
    },
    {
      id: 3,
      patent_title: "Solar Grid Load Balancer",
      applicant_name: "Dev Khanna",
      patent_type: "Process",
      approval_status: "Approved",
      application_date: "2026-03-16T13:10:00"
    },
    {
      id: 4,
      patent_title: "Low-Latency Medtech Scanner",
      applicant_name: "Neha Joshi",
      patent_type: "Utility",
      approval_status: "Rejected",
      application_date: "2026-03-18T16:45:00"
    }
  ];

  let records = [];
  let analytics = defaultAnalytics();
  let statusChart;
  let typeChart;

  init();

  async function init() {
    wireFilters();
    wireForm();
    await loadData();
  }

  async function loadData() {
    setCardStatus("Loading IPR data...");
    setWorkflowStatus("Refreshing");

    const [recordResult, analyticsResult] = await Promise.allSettled([
      fetchJson("/api/ipr"),
      fetchJson("/api/ipr/analytics")
    ]);

    const apiRecords = recordResult.status === "fulfilled" && Array.isArray(recordResult.value)
      ? recordResult.value
      : [];

    records = normalizeRecords(apiRecords.length ? apiRecords : fallbackRecords);
    analytics = apiRecords.length && analyticsResult.status === "fulfilled" && analyticsResult.value
      ? analyticsResult.value
      : defaultAnalytics(records);

    populateStatusFilter();
    render();
    setCardStatus(apiRecords.length ? "Live IPR workflow loaded" : "Using sample IPR data");
    setWorkflowStatus("Ready");
  }

  function wireFilters() {
    elements.iprSearch.addEventListener("input", () => {
      state.search = elements.iprSearch.value.trim().toLowerCase();
      render();
    });

    elements.iprStatusFilter.addEventListener("change", () => {
      state.status = elements.iprStatusFilter.value || "all";
      render();
    });

    elements.iprSortFilter.addEventListener("change", () => {
      state.sort = elements.iprSortFilter.value || "recent";
      render();
    });

    elements.workflowReset.addEventListener("click", () => {
      setWorkflowStatus("Ready");
    });
  }

  function wireForm() {
    elements.iprForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!elements.iprForm.checkValidity()) {
        elements.iprForm.reportValidity();
        return;
      }

      const payload = {
        patent_title: fields.patentTitle.value.trim(),
        applicant_name: fields.applicantName.value.trim(),
        patent_type: fields.patentType.value.trim(),
        approval_status: fields.approvalStatus.value
      };

      setWorkflowStatus("Saving case...");

      try {
        const response = await fetch("/api/ipr/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || "Unable to create IPR record");
        }

        setWorkflowStatus("Patent record created");
        showMessage(data.message || "IPR application submitted");
        elements.iprForm.reset();
        await loadData();
      } catch (error) {
        setWorkflowStatus("Action failed");
        showMessage(error.message, true);
      }
    });
  }

  function render() {
    const filtered = sortRecords(applyFilters(records), state.sort);

    renderTable(filtered);
    updateMetrics(filtered);
    updateCharts(filtered);
  }

  function applyFilters(collection) {
    return collection.filter((record) => {
      const textMatch = !state.search || [
        record.patent_title,
        record.applicant_name,
        record.patent_type,
        record.approval_status
      ].some((value) => normalize(value).includes(state.search));

      const statusMatch = state.status === "all" || normalize(record.approval_status) === state.status;

      return textMatch && statusMatch;
    });
  }

  function sortRecords(collection, sortMode) {
    const sorted = [...collection];

    switch (sortMode) {
      case "title":
        return sorted.sort((a, b) => a.patent_title.localeCompare(b.patent_title));
      case "status":
        return sorted.sort((a, b) => normalize(a.approval_status).localeCompare(normalize(b.approval_status)));
      case "recent":
      default:
        return sorted.sort((a, b) => (parseDate(b.application_date) || b.id || 0) - (parseDate(a.application_date) || a.id || 0));
    }
  }

  function renderTable(collection) {
    elements.iprTableBody.innerHTML = "";

    if (!collection.length) {
      elements.iprEmptyState.hidden = false;
      elements.iprTableStatus.textContent = "No matches found";
      return;
    }

    elements.iprEmptyState.hidden = true;
    elements.iprTableStatus.textContent = `${collection.length} records visible`;

    const fragment = document.createDocumentFragment();
    collection.forEach((record) => {
      fragment.appendChild(createRow(record));
    });

    elements.iprTableBody.appendChild(fragment);
  }

  function createRow(record) {
    const row = document.createElement("tr");
    const status = record.approval_status || "Pending";
    const actions = ["Pending", "Under Review", "Approved", "Rejected"]
      .map((nextStatus) => createActionButton(record.id, nextStatus, status))
      .join("");

    row.innerHTML = `
      <td>
        <strong>${escapeHtml(record.patent_title)}</strong>
      </td>
      <td>${escapeHtml(record.applicant_name || "Unknown")}</td>
      <td>${escapeHtml(record.patent_type || "Unspecified")}</td>
      <td><span class="status-badge ${statusClass(status)}">${escapeHtml(status)}</span></td>
      <td>${record.application_date ? formatDate(record.application_date) : "Recent"}</td>
      <td>
        <div class="record-actions">${actions}</div>
      </td>
    `;

    return row;
  }

  function createActionButton(id, nextStatus, currentStatus) {
    const isActive = normalize(nextStatus) === normalize(currentStatus);
    return `
      <button
        type="button"
        class="btn btn-ghost"
        ${isActive ? "disabled" : ""}
        data-ipr-id="${id}"
        data-ipr-status="${escapeHtml(nextStatus)}"
      >
        ${escapeHtml(nextStatus)}
      </button>
    `;
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-ipr-id][data-ipr-status]");
    if (!button) {
      return;
    }

    const iprId = Number(button.dataset.iprId);
    const approvalStatus = button.dataset.iprStatus;

    await updateRecordStatus(iprId, approvalStatus);
  });

  async function updateRecordStatus(iprId, approvalStatus) {
    setWorkflowStatus(`Updating ${approvalStatus}...`);

    try {
      const response = await fetch(`/api/ipr/${iprId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ approval_status: approvalStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to update patent status");
      }

      setWorkflowStatus(`Status updated to ${data.approval_status}`);
      showMessage(data.message || "Patent status updated");
      await loadData();
    } catch (error) {
      setWorkflowStatus("Action failed");
      showMessage(error.message, true);
    }
  }

  function updateMetrics(collection) {
    const total = analytics.total || records.length;
    const approved = analytics.counters?.approved ?? collection.filter((item) => normalize(item.approval_status) === "approved").length;
    const pending = analytics.counters?.pending ?? collection.filter((item) => normalize(item.approval_status) === "pending").length;
    const underReview = analytics.counters?.under_review ?? collection.filter((item) => normalize(item.approval_status) === "under review").length;
    const rejected = analytics.counters?.rejected ?? collection.filter((item) => normalize(item.approval_status) === "rejected").length;
    const reviewShare = total ? Math.round(((underReview + pending) / total) * 100) : 0;

    elements.totalIpr.textContent = total;
    elements.approvalRate.textContent = `${analytics.approval_rate || 0}%`;
    elements.underReviewIpr.textContent = underReview;
    elements.pendingIpr.textContent = pending;
    elements.approvedIpr.textContent = approved;
    elements.rejectedIpr.textContent = rejected;
    elements.reviewShare.textContent = `${reviewShare}%`;
  }

  function updateCharts(collection) {
    const statusCounts = countBy(collection, "approval_status");
    const typeCounts = countBy(collection, "patent_type");
    const palette = ["#0b7a6d", "#4d76d6", "#f07c42", "#d9a33e", "#8b8cf8"];

    if (!statusChart) {
      statusChart = new Chart(elements.statusChart, {
        type: "doughnut",
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: palette,
            borderWidth: 0
          }]
        },
        options: chartOptions("bottom")
      });
    } else {
      statusChart.data.labels = Object.keys(statusCounts);
      statusChart.data.datasets[0].data = Object.values(statusCounts);
      statusChart.update();
    }

    if (!typeChart) {
      typeChart = new Chart(elements.typeChart, {
        type: "bar",
        data: {
          labels: Object.keys(typeCounts),
          datasets: [{
            label: "Patent cases",
            data: Object.values(typeCounts),
            backgroundColor: palette,
            borderRadius: 12
          }]
        },
        options: chartOptions("bottom", true)
      });
    } else {
      typeChart.data.labels = Object.keys(typeCounts);
      typeChart.data.datasets[0].data = Object.values(typeCounts);
      typeChart.data.datasets[0].backgroundColor = palette;
      typeChart.update();
    }
  }

  function populateStatusFilter() {
    const statuses = ["Pending", "Under Review", "Approved", "Rejected"];
    elements.iprStatusFilter.innerHTML = '<option value="all">All statuses</option>';
    statuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = normalize(status);
      option.textContent = status;
      elements.iprStatusFilter.appendChild(option);
    });
  }

  function defaultAnalytics(source = records) {
    const total = source.length;
    const approved = source.filter((item) => normalize(item.approval_status) === "approved").length;
    const pending = source.filter((item) => normalize(item.approval_status) === "pending").length;
    const underReview = source.filter((item) => normalize(item.approval_status) === "under review").length;
    const rejected = source.filter((item) => normalize(item.approval_status) === "rejected").length;
    const approvalRate = total ? Math.round((approved / total) * 100) : 0;

    return {
      total,
      approval_rate: approvalRate,
      counters: {
        approved,
        pending,
        under_review: underReview,
        rejected
      }
    };
  }

  function normalizeRecords(source) {
    return source.map((item, index) => ({
      id: item.id || index + 1,
      patent_title: item.patent_title || "Untitled case",
      applicant_name: item.applicant_name || "Unknown applicant",
      patent_type: item.patent_type || "",
      approval_status: item.approval_status || "Pending",
      application_date: item.application_date || null
    }));
  }

  function countBy(collection, key) {
    const counts = new Map();

    collection.forEach((item) => {
      const value = normalize(item[key]) || "unspecified";
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

  function setCardStatus(message) {
    elements.iprCardStatus.textContent = message;
  }

  function setWorkflowStatus(message) {
    elements.workflowStatus.textContent = message;
  }

  function showMessage(message, isError = false) {
    if (!elements.toast) {
      return;
    }

    elements.toast.textContent = message;
    elements.toast.classList.toggle("is-error", isError);
    elements.toast.classList.add("is-visible");

    window.clearTimeout(window.__iprToastTimer);
    window.__iprToastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 2800);
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed for ${url}`);
    }
    return response.json();
  }

  function statusClass(value) {
    const normalized = normalize(value);
    if (normalized.includes("pending")) {
      return "pending";
    }
    if (normalized.includes("under review")) {
      return "under-review";
    }
    if (normalized.includes("approved")) {
      return "approved";
    }
    if (normalized.includes("reject")) {
      return "rejected";
    }
    return "pending";
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Recent";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function parseDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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
