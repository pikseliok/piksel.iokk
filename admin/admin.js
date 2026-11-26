(() => {
  const config = window.CMS_CONFIG || {};
  const loginPanel = document.getElementById("loginPanel");
  const cmsPanel = document.getElementById("cmsPanel");
  const signOutButton = document.getElementById("signOut");
  const loginStatus = document.getElementById("loginStatus");
  const cmsStatus = document.getElementById("cmsStatus");
  const packageList = document.getElementById("packageList");
  const sectionsElement = document.getElementById("sections");
  const form = document.getElementById("packageForm");
  const editorTitle = document.getElementById("editorTitle");
  const deleteButton = document.getElementById("deletePackage");
  const googleButton = document.getElementById("googleButton");
  const ANIM_MS = 500;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let token = "";
  let packages = [];
  let editingId = "";
  let draft = createDraft();

  function showPanel(el) {
    el.hidden = false;
    void el.offsetWidth; // animasiya başlasın deyə reflow
    el.classList.add("is-open");
  }

  async function hidePanel(el) {
    el.classList.remove("is-open");
    await wait(ANIM_MS);
    el.hidden = true;
  }

  function createDraft() {
    return {
      id: "",
      title: "",
      type: "nhn",
      date: new Date().toISOString().slice(0, 10),
      icon: "",
      sections: [{ name: "1-ci tur", groups: [{ name: "Sual bloku", author: "", questions: [emptyQuestion()] }] }],
    };
  }

  function emptyQuestion() {
    return { question: "", answer: "", comment: "", source: "", criteria: "", handout: "", reqImg: "", extraImage: "", author: "" };
  }

  function setStatus(element, message, kind = "") {
    element.textContent = message;
    element.dataset.kind = kind;
  }

  function apiUrl(path) {
    const base = String(config.apiBaseUrl || "").replace(/\/+$/, "");
    if (!base) throw new Error("admin/config.js faylında Worker URL-i qeyd edilməyib.");
    return `${base}${path}`;
  }

  async function api(path, options = {}) {
    const result = await fetch(apiUrl(path), {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await result.json().catch(() => ({}));
    if (!result.ok) throw new Error(data.error || `Sorğu uğursuz oldu (${result.status}).`);
    return data;
  }

  function field(label, value, onInput, multiline = false, required = false, wide = false) {
    const wrapper = document.createElement("label");
    wrapper.className = `field${wide ? " field-wide" : ""}`;
    const caption = document.createElement("span");
    caption.textContent = label;
    const control = document.createElement(multiline ? "textarea" : "input");
    if (!multiline) control.type = "text";
    control.value = value || "";
    control.required = required;
    control.addEventListener("input", () => onInput(control.value));
    wrapper.append(caption, control);
    return wrapper;
  }

  function actionButton(text, handler, danger = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = danger ? "button button-small button-danger" : "button button-small";
    button.textContent = text;
    button.addEventListener("click", handler);
    return button;
  }

  function renderSections() {
    sectionsElement.replaceChildren();
    draft.sections.forEach((section, sectionIndex) => {
      const sectionCard = document.createElement("div");
      sectionCard.className = "section-card";
      const sectionHeading = document.createElement("div");
      sectionHeading.className = "card-heading";
      const sectionLabel = document.createElement("strong");
      sectionLabel.textContent = `Bölmə ${sectionIndex + 1}`;
      sectionHeading.append(sectionLabel);
      if (draft.sections.length > 1) {
        sectionHeading.append(actionButton("Bölməni sil", () => {
          draft.sections.splice(sectionIndex, 1);
          renderSections();
        }, true));
      }
      sectionCard.append(sectionHeading, field("Tur/bölmə adı", section.name, (value) => { section.name = value; }, false, true));

      section.groups.forEach((group, groupIndex) => {
        const groupCard = document.createElement("div");
        groupCard.className = "group-card";
        const groupHeading = document.createElement("div");
        groupHeading.className = "card-heading";
        const groupLabel = document.createElement("strong");
        groupLabel.textContent = `Mövzu ${groupIndex + 1}`;
        groupHeading.append(groupLabel);
        if (section.groups.length > 1) {
          groupHeading.append(actionButton("Mövzunu sil", () => {
            section.groups.splice(groupIndex, 1);
            renderSections();
          }, true));
        }
        groupCard.append(groupHeading);
        const groupFields = document.createElement("div");
        groupFields.className = "form-grid";
        groupFields.append(field("Mövzunun adı", group.name, (value) => { group.name = value; }));
        groupFields.append(field(draft.type === "xemse" ? "Müəllif (vacibdir)" : "Müəllif (istəyə görə)", group.author, (value) => { group.author = value; }, false, draft.type === "xemse"));
        groupCard.append(groupFields);

        group.questions.forEach((question, questionIndex) => {
          const questionCard = document.createElement("div");
          questionCard.className = "question-card";
          const questionHeading = document.createElement("div");
          questionHeading.className = "card-heading";
          const questionLabel = document.createElement("strong");
          questionLabel.textContent = `Sual ${questionIndex + 1}`;
          questionHeading.append(questionLabel);
          if (group.questions.length > 1) {
            questionHeading.append(actionButton("Sil", () => {
              group.questions.splice(questionIndex, 1);
              renderSections();
            }, true));
          }
          const questionFields = document.createElement("div");
          questionFields.className = "question-grid";
          questionFields.append(field("Sual mətni", question.question, (value) => { question.question = value; }, true, true, true));
          questionFields.append(field("Cavab", question.answer, (value) => { question.answer = value; }, true, true, true));
          questionFields.append(field("Şərh/qeyd", question.comment, (value) => { question.comment = value; }, true, false, true));
          questionFields.append(field("Mənbə", question.source, (value) => { question.source = value; }));
          questionFields.append(field("Qəbul meyarı", question.criteria, (value) => { question.criteria = value; }));
          questionFields.append(field("Paylama materialı", question.handout, (value) => { question.handout = value; }, true, false, true));
          questionFields.append(field("Rekvizit şəkli (HTTPS və ya / yol)", question.reqImg, (value) => { question.reqImg = value.trim(); }));
          questionFields.append(field("Cavab üçün əlavə şəkil", question.extraImage, (value) => { question.extraImage = value.trim(); }));
          if (draft.type !== "xemse") {
            questionFields.append(field("Sual müəllifi (istəyə görə)", question.author, (value) => { question.author = value; }));
          }
          questionCard.append(questionHeading, questionFields);
          groupCard.append(questionCard);
        });

        const groupActions = document.createElement("div");
        groupActions.className = "inline-actions";
        groupActions.append(actionButton("+ Sual", () => {
          group.questions.push(emptyQuestion());
          renderSections();
        }));
        groupCard.append(groupActions);
        sectionCard.append(groupCard);
      });

      const sectionActions = document.createElement("div");
      sectionActions.className = "inline-actions";
      sectionActions.append(actionButton("+ Mövzu/sual bloku", () => {
        section.groups.push({ name: "", author: "", questions: [emptyQuestion()] });
        renderSections();
      }));
      sectionCard.append(sectionActions);
      sectionsElement.append(sectionCard);
    });
  }

  function syncDraftFromForm() {
    const values = new FormData(form);
    draft = {
      ...draft,
      title: String(values.get("title") || "").trim(),
      id: String(values.get("id") || "").trim().toLowerCase(),
      type: String(values.get("type") || "nhn"),
      date: String(values.get("date") || ""),
      icon: String(values.get("icon") || "").trim(),
    };
  }

  function fillForm(pkg) {
    draft = structuredClone(pkg);
    editingId = pkg.id;
    form.elements.title.value = pkg.title;
    form.elements.id.value = pkg.id;
    form.elements.id.readOnly = true;
    form.elements.type.value = pkg.type;
    form.elements.date.value = pkg.date;
    form.elements.icon.value = pkg.icon || "";
    editorTitle.textContent = "Paketi redaktə et";
    deleteButton.hidden = false;
    renderSections();
    renderPackageList();
    setStatus(cmsStatus, "");
  }

  function resetForm() {
    editingId = "";
    draft = createDraft();
    form.reset();
    form.elements.id.readOnly = false;
    form.elements.type.value = "nhn";
    form.elements.date.value = draft.date;
    editorTitle.textContent = "Yeni paket";
    deleteButton.hidden = true;
    renderSections();
    renderPackageList();
    setStatus(cmsStatus, "");
  }

  function renderPackageList() {
    packageList.replaceChildren();
    if (!packages.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Hələ CMS vasitəsilə yayımlanmış paket yoxdur.";
      packageList.append(empty);
      return;
    }
    packages.forEach((pkg) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "package-item";
      button.setAttribute("aria-current", pkg.id === editingId ? "true" : "false");
      const title = document.createElement("strong");
      title.textContent = pkg.title;
      const meta = document.createElement("small");
      meta.textContent = `${pkg.type.toUpperCase()} · ${pkg.date}`;
      button.append(title, meta);
      button.addEventListener("click", () => fillForm(pkg));
      packageList.append(button);
    });
  }

  async function loadPackages() {
    setStatus(cmsStatus, "Paketlər yüklənir…");
    const data = await api("/api/packages");
    packages = data.packages;
    renderPackageList();
    setStatus(cmsStatus, "");
  }

  async function signIn(credential) {
    token = credential;
    try {
      await loadPackages();
      await hidePanel(loginPanel);
      resetForm();
      showPanel(cmsPanel);
      signOutButton.hidden = false;
    } catch (error) {
      token = "";
      setStatus(loginStatus, error.message, "error");
    }
  }

  form.addEventListener("input", syncDraftFromForm);
  form.elements.type.addEventListener("change", () => {
    syncDraftFromForm();
    renderSections();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncDraftFromForm();
    if (!form.reportValidity()) return;
    const saveButton = form.querySelector('[type="submit"]');
    saveButton.disabled = true;
    setStatus(cmsStatus, "GitHub-a commit hazırlanır…");
    try {
      const result = await api("/api/packages", { method: "POST", body: JSON.stringify(draft) });
      setStatus(cmsStatus, `Yayımlandı. Commit: ${result.commit.slice(0, 7)}`, "success");
      await loadPackages();
      resetForm();
      setStatus(cmsStatus, `Yayımlandı. Commit: ${result.commit.slice(0, 7)}`, "success");
    } catch (error) {
      setStatus(cmsStatus, error.message, "error");
    } finally {
      saveButton.disabled = false;
    }
  });

  document.getElementById("newPackage").addEventListener("click", resetForm);
  document.getElementById("addSection").addEventListener("click", () => {
    draft.sections.push({ name: "", groups: [{ name: "", author: "", questions: [emptyQuestion()] }] });
    renderSections();
  });
  document.getElementById("resetForm").addEventListener("click", resetForm);
  deleteButton.addEventListener("click", async () => {
    if (!editingId || !window.confirm("Bu paketi saytdan və GitHub-dan silmək istəyirsiniz?")) return;
    deleteButton.disabled = true;
    setStatus(cmsStatus, "Paket silinir…");
    try {
      const result = await api(`/api/packages/${encodeURIComponent(editingId)}`, { method: "DELETE" });
      setStatus(cmsStatus, `Silindi. Commit: ${result.commit.slice(0, 7)}`, "success");
      await loadPackages();
      resetForm();
      setStatus(cmsStatus, `Silindi. Commit: ${result.commit.slice(0, 7)}`, "success");
    } catch (error) {
      setStatus(cmsStatus, error.message, "error");
    } finally {
      deleteButton.disabled = false;
    }
  });
  signOutButton.addEventListener("click", async () => {
    token = "";
    packages = [];
    signOutButton.hidden = true;
    window.google?.accounts?.id?.disableAutoSelect();
    await hidePanel(cmsPanel);
    renderPackageList();
    setStatus(loginStatus, "Hesabdan çıxış edildi.");
    showPanel(loginPanel);
  });

  showPanel(loginPanel);
  renderSections();
  if (!config.googleClientId || !config.apiBaseUrl) {
    const warning = document.getElementById("configWarning");
    warning.hidden = false;
    warning.textContent = "Giriş üçün admin/config.js faylında Google Client ID və Cloudflare Worker URL-i doldurulmalıdır.";
  } else {
    const waitForGoogle = window.setInterval(() => {
      if (!window.google?.accounts?.id) return;
      window.clearInterval(waitForGoogle);
      window.google.accounts.id.initialize({
        client_id: config.googleClientId,
        callback: (result) => {
          if (result.credential) signIn(result.credential);
          else setStatus(loginStatus, "Google giriş tokeni alınmadı.", "error");
        },
      });
      window.google.accounts.id.renderButton(googleButton, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 300,
      });
    }, 100);
    window.setTimeout(() => {
      if (!window.google?.accounts?.id) setStatus(loginStatus, "Google giriş xidməti yüklənmədi. Səhifəni yeniləyin.", "error");
    }, 10_000);
  }
})();
