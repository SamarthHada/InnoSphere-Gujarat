document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("researchWizard");
  if (!form) {
    return;
  }

  const panes = Array.from(
    document.querySelectorAll("[data-step-pane]")
  );
  const stepButtons = Array.from(
    document.querySelectorAll(".wizard-step")
  );
  const progressBar = document.getElementById("wizardProgressBar");
  const prevButton = document.getElementById("prevStep");
  const nextButton = document.getElementById("nextStep");
  const submitButton = document.getElementById("submitResearch");
  const footerCopy = document.getElementById("wizardFooterCopy");

  const titleInput = document.getElementById("title");
  const domainInput = document.getElementById("domain");
  const researcherInput = document.getElementById("researcher");
  const fundingInput = document.getElementById("funding");
  const descriptionInput = document.getElementById("description");
  const paperInput = document.getElementById("paper_file");
  const dropzone = document.getElementById("paperDropzone");
  const browseButton = document.getElementById("browsePaper");
  const filePreview = document.getElementById("filePreview");

  const summaryTitle = document.getElementById("summaryTitle");
  const summaryDomain = document.getElementById("summaryDomain");
  const summaryResearcher = document.getElementById("summaryResearcher");
  const summaryFunding = document.getElementById("summaryFunding");
  const summaryFile = document.getElementById("summaryFile");

  const checklist = {
    title: document.getElementById("checkTitle"),
    domain: document.getElementById("checkDomain"),
    researcher: document.getElementById("checkResearcher"),
    description: document.getElementById("checkDescription"),
    attachment: document.getElementById("checkAttachment")
  };

  const totalSteps = panes.length;
  let currentStep = 1;

  setStep(1);
  syncSummary();

  prevButton.addEventListener("click", () => {
    setStep(Math.max(currentStep - 1, 1));
  });

  nextButton.addEventListener("click", () => {
    if (validateStep(currentStep)) {
      setStep(Math.min(currentStep + 1, totalSteps));
    }
  });

  stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.step);
      if (target < currentStep) {
        setStep(target);
      }
    });
  });

  form.addEventListener("submit", (event) => {
    syncSummary();

    if (!validateAllSteps()) {
      event.preventDefault();
    }
  });

  [titleInput, domainInput, researcherInput, fundingInput, descriptionInput].forEach((element) => {
    element.addEventListener("input", syncSummary);
    element.addEventListener("change", syncSummary);
  });

  paperInput.addEventListener("change", () => {
    handlePaper(paperInput.files[0]);
    syncSummary();
  });

  browseButton.addEventListener("click", () => {
    paperInput.click();
  });

  dropzone.addEventListener("click", (event) => {
    if (event.target === browseButton) {
      return;
    }
    paperInput.click();
  });

  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("is-dragover");
  });

  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");

    const file = event.dataTransfer.files[0];
    if (!file) {
      return;
    }

    if (!setPaperFile(file)) {
      return;
    }
  });

  function setStep(step) {
    currentStep = step;

    panes.forEach((pane) => {
      const paneStep = Number(pane.dataset.stepPane);
      pane.classList.toggle("is-active", paneStep === step);
    });

    stepButtons.forEach((button) => {
      const buttonStep = Number(button.dataset.step);
      button.classList.toggle("is-active", buttonStep === step);
      button.classList.toggle("is-complete", buttonStep < step);
    });

    const progress = totalSteps <= 1 ? 100 : ((step - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = `${progress}%`;
    prevButton.disabled = step === 1;
    nextButton.hidden = step === totalSteps;
    submitButton.hidden = step !== totalSteps;
    footerCopy.textContent = `Step ${step} of ${totalSteps}`;
  }

  function validateStep(step) {
    const pane = panes.find((item) => Number(item.dataset.stepPane) === step);
    if (!pane) {
      return true;
    }

    const fields = Array.from(
      pane.querySelectorAll("input, select, textarea")
    ).filter((field) => !field.disabled);

    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      if (!field.checkValidity()) {
        field.reportValidity();
        field.focus();
        return false;
      }
    }

    return true;
  }

  function validateAllSteps() {
    for (let step = 1; step <= totalSteps; step += 1) {
      if (!validateStep(step)) {
        setStep(step);
        return false;
      }
    }

    return true;
  }

  function syncSummary() {
    const titleValue = titleInput.value.trim();
    const domainValue = domainInput.value || "";
    const researcherValue = researcherInput.value.trim();
    const fundingValue = fundingInput.value.trim();
    const descriptionValue = descriptionInput.value.trim();
    const file = paperInput.files[0];

    summaryTitle.textContent = titleValue || "Project title pending";
    summaryDomain.textContent = domainValue || "Choose a domain";
    summaryResearcher.textContent = researcherValue || "Add researcher name";
    summaryFunding.textContent = fundingValue ? `INR ${fundingValue}` : "Not specified";
    summaryFile.textContent = file
      ? `${file.name} (${formatBytes(file.size)})`
      : "No PDF selected";

    updateChecklist({
      title: titleValue.length >= 3,
      domain: Boolean(domainValue),
      researcher: researcherValue.length >= 3,
      description: descriptionValue.length >= 20,
      attachment: Boolean(file)
    });
  }

  function updateChecklist(state) {
    toggleChecklist(checklist.title, state.title);
    toggleChecklist(checklist.domain, state.domain);
    toggleChecklist(checklist.researcher, state.researcher);
    toggleChecklist(checklist.description, state.description);
    toggleChecklist(checklist.attachment, state.attachment);
  }

  function toggleChecklist(element, complete) {
    if (!element) {
      return;
    }

    element.classList.toggle("is-complete", complete);
  }

  function handlePaper(file) {
    if (!setPaperFile(file)) {
      return;
    }
  }

  function setPaperFile(file) {
    if (!file) {
      paperInput.setCustomValidity("");
      filePreview.hidden = true;
      filePreview.textContent = "";
      filePreview.classList.remove("is-error");
      return true;
    }

    if (!isPdf(file)) {
      paperInput.setCustomValidity("Only PDF files are allowed.");
      filePreview.hidden = false;
      filePreview.classList.add("is-error");
      filePreview.textContent = "Only PDF files are allowed.";
      return false;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    paperInput.files = transfer.files;
    paperInput.setCustomValidity("");
    filePreview.hidden = false;
    filePreview.classList.remove("is-error");
    filePreview.textContent = `${file.name} ready to upload`;
    return true;
  }

  function isPdf(file) {
    const name = (file.name || "").toLowerCase();
    const type = (file.type || "").toLowerCase();
    return name.endsWith(".pdf") || type === "application/pdf";
  }

  function formatBytes(size) {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
});
