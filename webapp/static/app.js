const state = {
  history: [],
  includeUploads: false,
  lastQuestion: "",
};

const chatEl = document.getElementById("chat");
const chatForm = document.getElementById("chatForm");
const questionEl = document.getElementById("question");
const domaineEl = document.getElementById("domaine");
const actionsEl = document.getElementById("actions");
const extraOutputEl = document.getElementById("extraOutput");
const uploadInputEl = document.getElementById("pdfUpload");
const uploadStatusEl = document.getElementById("uploadStatus");
const statusPillEl = document.getElementById("statusPill");
const statusDetailsEl = document.getElementById("statusDetails");
const synthBtn = document.getElementById("synthBtn");
const reportBtn = document.getElementById("reportBtn");
const pdfBtn = document.getElementById("pdfBtn");
const messageTpl = document.getElementById("messageTpl");
const sampleListEl = document.getElementById("sampleList");
const chatWelcomeEl = document.getElementById("chatWelcome");
const toolsPanelEl = document.getElementById("toolsPanel");
const toolsUsedEl = document.getElementById("toolsUsed");
const confidencePanelEl = document.getElementById("confidencePanel");
const confidenceStatsEl = document.getElementById("confidenceStats");
const clearChatBtn = document.getElementById("clearChatBtn");
const runDiagnosticsBtn = document.getElementById("runDiagnosticsBtn");
const diagnosticsOutputEl = document.getElementById("diagnosticsOutput");

function setLoading(isLoading, label = "Pret", details = "") {
  if (!statusPillEl) return;
  const defaultDetails = isLoading
    ? "Traitement en cours. Veuillez patienter..."
    : "Le systeme est disponible. Vous pouvez poser une question.";
  const content = details || defaultDetails;

  statusPillEl.textContent = label;
  statusPillEl.classList.toggle("loading", isLoading);
  if (statusDetailsEl) statusDetailsEl.textContent = content;
}

function addMessage(role, content, sources = []) {
  const node = messageTpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  node.querySelector(".role").textContent = role === "user" ? "Vous" : "Assistant";
  node.querySelector(".content").textContent = content;
  if (sources.length > 0) {
    const sourceWrap = document.createElement("div");
    sourceWrap.className = "sources";
    for (const s of sources) {
      const sourceNode = document.createElement("article");
      sourceNode.className = "source";
      sourceNode.innerHTML = `
        <div class="source-title">${escapeHtml(s.citation)} (${escapeHtml(s.badge)})</div>
        <div class="source-meta">Pertinence: ${s.score}</div>
        <div>${escapeHtml(s.text)}</div>
      `;
      sourceWrap.appendChild(sourceNode);
    }
    node.appendChild(sourceWrap);
  }
  chatEl.appendChild(node);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function addAssistantMessageStreaming(content, sources = []) {
  const node = messageTpl.content.firstElementChild.cloneNode(true);
  node.classList.add("assistant");
  node.querySelector(".role").textContent = "Assistant";
  const contentEl = node.querySelector(".content");
  contentEl.textContent = "";
  chatEl.appendChild(node);

  const chunks = content.split(/(\s+)/);
  for (const token of chunks) {
    contentEl.textContent += token;
    chatEl.scrollTop = chatEl.scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, 7));
  }

  if (sources.length > 0) {
    const sourceWrap = document.createElement("div");
    sourceWrap.className = "sources";
    for (const s of sources) {
      const sourceNode = document.createElement("article");
      sourceNode.className = "source";
      sourceNode.innerHTML = `
        <div class="source-title">${escapeHtml(s.citation)} (${escapeHtml(s.badge)})</div>
        <div class="source-meta">Pertinence: ${s.score}</div>
        <div>${escapeHtml(s.text)}</div>
      `;
      sourceWrap.appendChild(sourceNode);
    }
    node.appendChild(sourceWrap);
  }
  chatEl.scrollTop = chatEl.scrollHeight;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Erreur serveur.");
  }
  return res.json();
}

function renderToolsUsed(tools = []) {
  if (!toolsPanelEl || !toolsUsedEl) return;
  toolsUsedEl.innerHTML = "";
  if (!tools.length) {
    toolsPanelEl.classList.add("hidden");
    return;
  }
  for (const name of tools) {
    const span = document.createElement("span");
    span.className = "tool-badge";
    span.textContent = name;
    toolsUsedEl.appendChild(span);
  }
  toolsPanelEl.classList.remove("hidden");
}

function renderConfidence(data) {
  if (!confidencePanelEl || !confidenceStatsEl) return;
  confidenceStatsEl.innerHTML = "";
  if (!data) {
    confidencePanelEl.classList.add("hidden");
    return;
  }
  const items = [
    `Sources: ${data.source_stats?.count ?? 0}`,
    `Score moyen: ${data.source_stats?.avg_score ?? 0}`,
    `Citations: ${data.quality?.has_citation ? "Oui" : "Non"}`,
    `Disclaimer: ${data.quality?.has_disclaimer ? "Oui" : "Non"}`,
  ];
  for (const line of items) {
    const div = document.createElement("div");
    div.className = "confidence-item";
    div.textContent = line;
    confidenceStatsEl.appendChild(div);
  }
  confidencePanelEl.classList.remove("hidden");
}

function attachSampleHandlers() {
  if (!sampleListEl || !questionEl) return;
  const buttons = sampleListEl.querySelectorAll(".sample-btn");
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      questionEl.value = btn.dataset.question || "";
      questionEl.focus();
    });
  }
}

async function loadSuggestedQuestions() {
  if (!sampleListEl) return;
  try {
    const res = await fetch("/api/suggested-questions");
    if (!res.ok) throw new Error("Impossible de charger les questions.");
    const data = await res.json();
    const questions = data.questions || [];
    if (!questions.length) return;
    sampleListEl.innerHTML = "";
    for (const item of questions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sample-btn";
      button.dataset.question = item.question;
      button.textContent = item.question;
      sampleListEl.appendChild(button);
    }
    attachSampleHandlers();
  } catch {
    // On conserve le placeholder en cas d'erreur.
  }
}

if (chatForm && questionEl && domaineEl && chatEl && actionsEl && extraOutputEl) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = questionEl.value.trim();
    if (!question) return;

    setLoading(true, "En cours", "L'agent analyse votre question et recherche des sources.");
    state.lastQuestion = question;
    addMessage("user", question);
    if (chatWelcomeEl) chatWelcomeEl.classList.add("hidden");
    state.history.push({ role: "user", content: question });
    questionEl.value = "";
    extraOutputEl.classList.add("hidden");
    extraOutputEl.textContent = "";

    try {
      const data = await postJson("/api/chat", {
        question,
        domaine: domaineEl.value || null,
        history: state.history.filter((m) => m.role !== "system"),
        include_uploads: state.includeUploads,
      });
      await addAssistantMessageStreaming(data.answer, data.sources || []);
      renderToolsUsed(data.tools_used || []);
      renderConfidence(data);
      state.history.push({ role: "assistant", content: data.answer });
      actionsEl.classList.remove("hidden");
    } catch (error) {
      addMessage("assistant", `Erreur: ${error.message}`);
    } finally {
      setLoading(false, "Pret");
    }
  });
}

if (clearChatBtn && chatEl) {
  clearChatBtn.addEventListener("click", () => {
    chatEl.innerHTML = "";
    state.history = [];
    state.lastQuestion = "";
    if (chatWelcomeEl) chatWelcomeEl.classList.remove("hidden");
    if (actionsEl) actionsEl.classList.add("hidden");
    if (toolsPanelEl) toolsPanelEl.classList.add("hidden");
    if (confidencePanelEl) confidencePanelEl.classList.add("hidden");
    if (extraOutputEl) {
      extraOutputEl.classList.add("hidden");
      extraOutputEl.textContent = "";
    }
    setLoading(false, "Pret", "Historique efface. Vous pouvez poser une nouvelle question.");
  });
}

if (uploadInputEl && uploadStatusEl) {
  uploadInputEl.addEventListener("change", async () => {
    const file = uploadInputEl.files?.[0];
    if (!file) {
      await fetch("/api/clear-upload", { method: "POST" });
      state.includeUploads = false;
      uploadStatusEl.textContent = "Aucun document uploadé.";
      return;
    }
    setLoading(
      true,
      "Indexation de document",
      "Extraction du texte, decoupage en chunks et ajout a l'index de la session."
    );
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        throw new Error("Echec de l'upload.");
      }
      const data = await res.json();
      state.includeUploads = data.enabled;
      uploadStatusEl.textContent = data.enabled
        ? `${data.filename} indexe (${data.chunks} extraits). Ce document sera utilise dans les prochaines requetes.`
        : "Le PDF n'a pas pu etre indexe (OCR manquant ?).";
    } catch (error) {
      state.includeUploads = false;
      uploadStatusEl.textContent = `Erreur upload: ${error.message}`;
    } finally {
      setLoading(false, "Pret");
    }
  });
}

if (synthBtn && extraOutputEl && domaineEl) {
  synthBtn.addEventListener("click", async () => {
    if (!state.lastQuestion) return;
    setLoading(true, "En cours", "Generation de la synthese des sources juridiques.");
    try {
      const data = await postJson("/api/synthesis", {
        question: state.lastQuestion,
        domaine: domaineEl.value || null,
        include_uploads: state.includeUploads,
        focus: null,
      });
      extraOutputEl.textContent = data.text;
      extraOutputEl.classList.remove("hidden");
    } catch (error) {
      extraOutputEl.textContent = `Erreur synthese: ${error.message}`;
      extraOutputEl.classList.remove("hidden");
    } finally {
      setLoading(false, "Pret");
    }
  });
}

if (reportBtn && extraOutputEl && domaineEl) {
  reportBtn.addEventListener("click", async () => {
    if (!state.lastQuestion) return;
    setLoading(true, "En cours", "Generation du rapport juridique structure.");
    try {
      const data = await postJson("/api/report", {
        question: state.lastQuestion,
        domaine: domaineEl.value || null,
        include_uploads: state.includeUploads,
      });
      extraOutputEl.textContent = data.markdown;
      extraOutputEl.classList.remove("hidden");
    } catch (error) {
      extraOutputEl.textContent = `Erreur rapport: ${error.message}`;
      extraOutputEl.classList.remove("hidden");
    } finally {
      setLoading(false, "Pret");
    }
  });
}

if (pdfBtn && extraOutputEl && domaineEl) {
  pdfBtn.addEventListener("click", async () => {
    if (!state.lastQuestion) return;
    setLoading(true, "En cours", "Preparation du rapport au format PDF.");
    try {
      const res = await fetch("/api/report/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: state.lastQuestion,
          domaine: domaineEl.value || null,
          include_uploads: state.includeUploads,
        }),
      });
      if (!res.ok) {
        throw new Error("Generation PDF impossible.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rapport-juridique.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      extraOutputEl.textContent = `Erreur PDF: ${error.message}`;
      extraOutputEl.classList.remove("hidden");
    } finally {
      setLoading(false, "Pret");
    }
  });
}

attachSampleHandlers();
loadSuggestedQuestions();

if (runDiagnosticsBtn && diagnosticsOutputEl) {
  runDiagnosticsBtn.addEventListener("click", async () => {
    diagnosticsOutputEl.classList.remove("hidden");
    diagnosticsOutputEl.textContent = "Diagnostic en cours...";
    runDiagnosticsBtn.disabled = true;
    try {
      const data = await postJson("/api/diagnostics/llm", {});
      const lines = [];
      lines.push(`Resultat global: ${data.ok ? "OK" : "ECHEC"}`);
      lines.push("");
      for (const check of data.checks || []) {
        lines.push(`- ${check.passed ? "OK" : "KO"}  ${check.name}: ${check.details}`);
      }
      diagnosticsOutputEl.textContent = lines.join("\n");
    } catch (error) {
      diagnosticsOutputEl.textContent = `Erreur diagnostic: ${error.message}`;
    } finally {
      runDiagnosticsBtn.disabled = false;
    }
  });
}
