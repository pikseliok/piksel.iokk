(function () {
  "use strict";

  var API = "https://piksel-nhn.pikseliok.workers.dev";
  var SESSION_KEY = "piksel-account-session-v1";
  var state = { clientId: "", session: null, profile: null, favorites: [], results: [], packages: [] };
  var currentWelcomeText = null;
  var welcomeAnimationTimer = null;
  var queue = window.PikselAccountQueue = window.PikselAccountQueue || [];
  var favoriteItems = window.PikselQuestionFavoriteItems = window.PikselQuestionFavoriteItems || {};
  var selectedFavoriteIds = new Set();
  var expandedPackageIds = new Set();
  var activeView = "signin";
  var trigger, triggerName, triggerAvatar, menu, dialog, dialogTitle, statusNode, googleButton;
  var signInPanel, accountPanel, profilePanel, statsPanel, favoritesPanel, profileNameInput;
  var profileInitial, profileDisplayName, profileEmail, profilePackagesList, favoriteList, resultList;
  var packageComposer, packageTitleInput, packageSelection, saveProfileButton;
  var statsGamesValue, statsFavoritesValue, statsPackagesValue, statsPointsValue;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function initialOf(name) {
    var first = Array.from(String(name || "").trim())[0];
    return first ? first.toLocaleUpperCase("az") : "π";
  }

  function setStatus(message, isError) {
    if (!statusNode) return;
    statusNode.textContent = message || "";
    statusNode.classList.toggle("pa-error", !!isError);
  }

  function readSession() {
    try {
      var value = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (value && typeof value.uid === "string" && typeof value.token === "string") return value;
    } catch (error) {
      console.error("Hesab sessiyasını oxumaq mümkün olmadı.", error);
    }
    return null;
  }

  function storeSession() {
    try {
      if (state.session) {
        state.session.profile = state.profile;
        localStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
      }
      else localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("Hesab sessiyasını saxlamaq mümkün olmadı.", error);
      setStatus("Bu brauzerdə hesab sessiyasını saxlamaq mümkün olmadı.", true);
    }
  }

  async function api(path, options) {
    options = options || {};
    var headers = Object.assign({}, options.headers || {});
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (state.session) headers.Authorization = "Bearer " + state.session.token;
    var response = await fetch(API + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "omit"
    });
    var data;
    try { data = await response.json(); } catch (error) {
      throw new Error("Hesab serverindən etibarsız cavab alındı.");
    }
    if (!response.ok) throw new Error(data.error || "Sorğu tamamlanmadı.");
    return data;
  }

  function syncNameInputs() {
    if (!state.profile || !state.profile.name) return;
    document.querySelectorAll("#fName, input[name='playerName'], input[name='username'], input[autocomplete='name']").forEach(function (input) {
      if ((!input.value || input.dataset.pikselAutofilled === "true") && input.value !== state.profile.name) {
        input.value = state.profile.name;
        input.dataset.pikselAutofilled = "true";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  }

  function syncFavoriteButtons() {
    var ids = new Set(state.favorites.map(function (item) { return item.id; }));
    document.querySelectorAll("[data-piksel-fav]").forEach(function (button) {
      var active = ids.has(button.dataset.pikselFav);
      button.dataset.active = active ? "true" : "false";
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.setAttribute("aria-label", active ? "Favorilərdən sil" : "Favorilərə əlavə et");
      button.title = active ? "Favorilərdən sil" : "Favorilərə əlavə et";
      button.textContent = active ? "★" : "☆";
    });
  }

  function renderFavorites() {
    favoriteList.replaceChildren();
    if (!state.favorites.length) {
      favoriteList.appendChild(element("p", "pa-empty", "Hələ favori sualınız yoxdur."));
      return;
    }
    state.favorites.forEach(function (item) {
      var card = element("article", "pa-item");
      var title = element("strong", "", item.packageName || "Sual");
      var question = element("p", "", item.question || "");
      var meta = element("p", "pa-meta", [item.topic, item.type].filter(Boolean).join(" · "));
      var remove = element("button", "pa-remove", "Favorilərdən sil");
      remove.type = "button";
      remove.addEventListener("click", function () { toggleFavorite(item); });
      if (!packageComposer.hidden) {
        var select = element("label", "pa-package-select");
        var checkbox = element("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedFavoriteIds.has(item.id);
        checkbox.addEventListener("change", function () {
          if (checkbox.checked && selectedFavoriteIds.size >= 100) {
            checkbox.checked = false;
            setStatus("Bir paketə ən çox 100 sual əlavə etmək olar.", true);
            return;
          }
          if (checkbox.checked) selectedFavoriteIds.add(item.id);
          else selectedFavoriteIds.delete(item.id);
        });
        select.append(checkbox, element("span", "", "Paketə daxil et"));
        card.appendChild(select);
      }
      card.append(title, meta, question);
      if (item.answer) card.appendChild(element("p", "pa-answer", "Cavab: " + item.answer));
      card.appendChild(remove);
      favoriteList.appendChild(card);
    });
  }

  function renderResults() {
    resultList.replaceChildren();
    if (!state.results.length) {
      resultList.appendChild(element("p", "pa-empty", "Hələ yadda saxlanmış oyun nəticəsi yoxdur."));
      return;
    }
    state.results.forEach(function (item) {
      var card = element("article", "pa-item");
      var heading = element("strong", "", item.title || "Oyun nəticəsi");
      var when = new Date(item.playedAt);
      var meta = element("p", "pa-meta", Number.isNaN(when.getTime()) ? "" : when.toLocaleString("az"));
      card.append(heading, meta);
      (item.teams || []).forEach(function (team) {
        card.appendChild(element("p", "pa-score", (team.name || "Komanda") + ": " + team.score + " xal"));
      });
      resultList.appendChild(card);
    });
  }

  function renderPackages() {
    profilePackagesList.replaceChildren();
    if (!state.packages.length) {
      profilePackagesList.appendChild(element("p", "pa-empty", "Hələ şəxsi paket yaratmamısınız."));
      return;
    }
    state.packages.forEach(function (item) {
      var card = element("article", "pa-item");
      var title = element("strong", "", item.title || "Sual paketi");
      var count = Array.isArray(item.questions) ? item.questions.length : 0;
      var toggle = element("button", "pa-remove", expandedPackageIds.has(item.id) ? "Sualları gizlət" : "Sualları göstər");
      toggle.type = "button";
      toggle.addEventListener("click", function () {
        if (expandedPackageIds.has(item.id)) expandedPackageIds.delete(item.id);
        else expandedPackageIds.add(item.id);
        renderPackages();
      });
      card.append(title, element("p", "pa-meta", count + " sual · Şəxsi paket"), toggle);
      if (expandedPackageIds.has(item.id)) {
        var questions = element("div", "pa-package-questions");
        (item.questions || []).forEach(function (question, index) {
          var row = element("div", "pa-package-question");
          row.appendChild(element("strong", "", (index + 1) + ". " + (question.question || "")));
          if (question.answer) row.appendChild(element("p", "", "Cavab: " + question.answer));
          questions.appendChild(row);
        });
        card.appendChild(questions);
      }
      profilePackagesList.appendChild(card);
    });
  }

  function renderStats() {
    var points = state.results.reduce(function (sum, result) {
      return sum + (result.teams || []).reduce(function (teamSum, team) {
        return teamSum + (Number(team.score) || 0);
      }, 0);
    }, 0);
    statsGamesValue.textContent = String(state.results.length);
    statsFavoritesValue.textContent = String(state.favorites.length);
    statsPackagesValue.textContent = String(state.packages.length);
    statsPointsValue.textContent = String(points);
  }

  function showView(view) {
    if (!state.profile) view = "signin";
    activeView = view;
    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    signInPanel.hidden = view !== "signin";
    accountPanel.hidden = view === "signin";
    profilePanel.hidden = view !== "profile";
    statsPanel.hidden = view !== "stats";
    favoritesPanel.hidden = view !== "favorites";
    dialogTitle.textContent = {
      signin: "Google hesabı ilə giriş",
      profile: "Profil",
      stats: "Statistika",
      favorites: "Favori suallarım"
    }[view] || "πksel hesabı";
    if (!dialog.open) dialog.showModal();
  }

  function setWelcomeText(text, animate) {
    if (!triggerName || currentWelcomeText === text) return;
    currentWelcomeText = text;
    if (welcomeAnimationTimer) window.clearTimeout(welcomeAnimationTimer);
    welcomeAnimationTimer = null;
    triggerName.dataset.typing = "false";
    if (!animate || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      triggerName.textContent = text;
      return;
    }
    var characters = Array.from(text);
    var index = 0;
    triggerName.textContent = "";
    triggerName.dataset.typing = "true";
    function typeNextCharacter() {
      if (currentWelcomeText !== text) return;
      if (index >= characters.length) {
        triggerName.dataset.typing = "false";
        welcomeAnimationTimer = null;
        return;
      }
      triggerName.textContent += characters[index++];
      welcomeAnimationTimer = window.setTimeout(typeNextCharacter, 32);
    }
    typeNextCharacter();
  }

  function syncPanels() {
    var signedIn = !!state.profile;
    if (triggerName) setWelcomeText(signedIn ? "Xoş gəlmisiniz, " + state.profile.name + "!" : "Google ilə daxil ol", signedIn);
    if (triggerAvatar) triggerAvatar.textContent = signedIn ? initialOf(state.profile.name) : "π";
    if (trigger) {
      trigger.setAttribute("aria-label", signedIn ? "Hesab menyusu: " + state.profile.name : "Google ilə daxil ol");
      trigger.title = signedIn ? state.profile.name : "Google ilə daxil ol";
    }
    signInPanel.hidden = signedIn;
    accountPanel.hidden = !signedIn;
    if (signedIn) {
      profileInitial.textContent = initialOf(state.profile.name);
      profileDisplayName.textContent = state.profile.name;
      profileEmail.textContent = state.profile.email || "";
      if (document.activeElement !== profileNameInput && profileNameInput.dataset.dirty !== "true") {
        profileNameInput.value = state.profile.name;
      }
      renderFavorites();
      renderResults();
      renderPackages();
      renderStats();
      syncNameInputs();
    }
    syncFavoriteButtons();
  }

  async function refreshAccount() {
    if (!state.session) return;
    var data = await api("/account/" + encodeURIComponent(state.session.uid));
    state.profile = data.profile;
    state.session.profile = state.profile;
    state.favorites = Array.isArray(data.favorites) ? data.favorites : [];
    state.results = Array.isArray(data.results) ? data.results : [];
    state.packages = Array.isArray(data.packages) ? data.packages : [];
    storeSession();
    syncPanels();
  }

  function loadGoogleScript() {
    if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      script.onerror = function () { reject(new Error("Google giriş xidməti yüklənmədi.")); };
      document.head.appendChild(script);
    });
  }

  async function beginGoogleSignIn(credential) {
    setStatus("Google hesabı yoxlanılır...");
    try {
      var data = await api("/account/session", {
        method: "POST",
        headers: {},
        body: { credential: credential }
      });
      state.session = { uid: data.profile.id, token: data.token };
      state.profile = data.profile;
      storeSession();
      await refreshAccount();
      showView("profile");
      setStatus("Giriş uğurla tamamlandı.");
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function setupGoogleSignIn() {
    try {
      var config = await api("/account/config");
      state.clientId = config.googleClientId || "";
      if (!state.clientId) {
        if (!state.profile) setStatus("Google Client ID əlavə edilməyib. Əvvəlcə nhn-server Worker konfiqurasiyasını tamamlayın.", true);
        return;
      }
      await loadGoogleScript();
      window.google.accounts.id.initialize({
        client_id: state.clientId,
        callback: function (response) {
          if (response.credential) beginGoogleSignIn(response.credential);
          else setStatus("Google giriş tokeni alınmadı.", true);
        }
      });
      window.google.accounts.id.renderButton(googleButton, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 260
      });
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function toggleFavorite(item) {
    if (!state.profile) {
      setStatus("Sualı favoriləmək üçün əvvəlcə Google hesabınızla daxil olun.", true);
      showView("signin");
      return;
    }
    var favorite = !state.favorites.some(function (value) { return value.id === item.id; });
    setStatus(favorite ? "Favorilərə əlavə edilir..." : "Favorilərdən silinir...");
    try {
      var data = await api("/account/" + encodeURIComponent(state.session.uid) + "/favorites", {
        method: "PUT",
        body: { favorite: favorite, item: item }
      });
      state.favorites = data.favorites;
      selectedFavoriteIds.delete(item.id);
      renderFavorites();
      renderStats();
      syncFavoriteButtons();
      setStatus(favorite ? "Favorilərə əlavə edildi." : "Favorilərdən silindi.");
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function saveProfile() {
    var name = profileNameInput.value.trim();
    if (!name || name.length > 40) {
      setStatus("Ad 1-40 simvol arasında olmalıdır.", true);
      return;
    }
    saveProfileButton.disabled = true;
    setStatus("Profil yadda saxlanılır...");
    try {
      var data = await api("/account/" + encodeURIComponent(state.session.uid) + "/profile", {
        method: "PUT",
        body: { name: name }
      });
      state.profile = data.profile;
      state.session.profile = state.profile;
      profileNameInput.dataset.dirty = "false";
      storeSession();
      syncPanels();
      setStatus("Profil yadda saxlanıldı.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      saveProfileButton.disabled = false;
    }
  }

  function startPackageCreation() {
    if (!state.favorites.length) {
      setStatus("Paket yaratmaq üçün əvvəlcə sualları favoriləyin.", true);
      return;
    }
    selectedFavoriteIds = new Set(state.favorites.slice(0, 100).map(function (item) { return item.id; }));
    packageComposer.hidden = false;
    packageTitleInput.value = "";
    renderFavorites();
    packageTitleInput.focus();
  }

  async function createPackage() {
    var title = packageTitleInput.value.trim();
    var favoriteIds = Array.from(selectedFavoriteIds);
    if (!title || title.length > 60) {
      setStatus("Paket adı 1-60 simvol arasında olmalıdır.", true);
      packageTitleInput.focus();
      return;
    }
    if (!favoriteIds.length) {
      setStatus("Paket üçün ən azı bir favori sual seçin.", true);
      return;
    }
    packageSelection.disabled = true;
    setStatus("Şəxsi paket yaradılır...");
    try {
      var data = await api("/account/" + encodeURIComponent(state.session.uid) + "/packages", {
        method: "POST",
        body: { title: title, favoriteIds: favoriteIds }
      });
      state.packages = data.packages;
      selectedFavoriteIds.clear();
      packageComposer.hidden = true;
      renderFavorites();
      renderPackages();
      renderStats();
      setStatus("Şəxsi paket yaradıldı. Paket yalnız sizin profilinizdə görünür.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      packageSelection.disabled = false;
    }
  }

  async function saveResult(result) {
    if (!state.profile || !result) return false;
    try {
      var data = await api("/account/" + encodeURIComponent(state.session.uid) + "/results", {
        method: "POST",
        body: { result: result }
      });
      state.results = data.results;
      renderResults();
      return true;
    } catch (error) {
      console.error("Oyun nəticəsini saxlamaq mümkün olmadı.", error);
      setStatus(error.message, true);
      return false;
    }
  }

  async function favoriteId(key) {
    if (window.crypto && window.crypto.subtle) {
      var digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
      return "q_" + Array.from(new Uint8Array(digest)).map(function (byte) {
        return byte.toString(16).padStart(2, "0");
      }).join("");
    }
    var hash = 2166136261;
    for (var i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
    return "q_" + (hash >>> 0).toString(16);
  }

  async function addQuestionFavoriteButton(card) {
    if (card.querySelector(".fav-btn") || card.dataset.pikselFavPending === "true") return;
    var questionNode = card.querySelector(".q-text");
    var answerNode = card.querySelector(".ans-row .ans-label");
    var parent = card.closest(".q-group");
    var packageNode = (parent || card).querySelector(".pkg-link");
    var actionRow = card.querySelector(".author-row");
    if (!questionNode || !packageNode || !actionRow) return;
    var question = questionNode.textContent.replace(/^\s*\d+\.\s*/, "").trim();
    if (!question) return;
    card.dataset.pikselFavPending = "true";
    var answer = answerNode && answerNode.parentElement
      ? answerNode.parentElement.textContent.replace(/^\s*Cavab:\s*/, "").trim()
      : "";
    var topicNode = parent && parent.querySelector(".topic-line");
    var topic = topicNode ? topicNode.textContent.replace(/^\s*\d+\.\s*/, "").trim() : "";
    var packageLink = packageNode.getAttribute("href") || "";
    var packageNameNode = packageNode.querySelector(".pkg-name");
    var item = {
      question: question,
      answer: answer,
      packageName: packageNameNode ? packageNameNode.textContent.trim() : "Sual",
      packageLink: packageLink,
      topic: topic,
      type: ""
    };
    var id;
    try { id = await favoriteId([packageLink, topic, question].join("|")); } catch (error) {
      delete card.dataset.pikselFavPending;
      throw error;
    }
    delete card.dataset.pikselFavPending;
    if (!card.isConnected || card.querySelector(".fav-btn")) return;
    item.id = id;
    favoriteItems[id] = item;
    var button = element("button", "copy-btn fav-btn", "☆");
    button.type = "button";
    button.dataset.pikselFav = id;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "Favorilərə əlavə et");
    button.title = "Favorilərə əlavə et";
    actionRow.appendChild(button);
    actionRow.classList.add("has-favorite-action");
    syncFavoriteButtons();
  }

  function scanQuestionCards() {
    if (!document.getElementById("qc")) return;
    document.querySelectorAll("#qc .q-card:not(.q-group)").forEach(function (card) {
      addQuestionFavoriteButton(card).catch(function (error) {
        console.error("Sual favori düyməsini yaratmaq mümkün olmadı.", error);
      });
    });
  }

  function saveGameResult(result) {
    if (window.PikselAccount) window.PikselAccount.saveResult(result);
    else queue.push(result);
  }

  function hashResult(value) {
    var hash = 2166136261;
    for (var i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(16);
  }

  function normalizedTeams(value) {
    var rows = Array.isArray(value) ? value : Object.keys(value || {}).map(function (key) { return value[key]; });
    return rows.map(function (team) {
      var score = team && (team.score != null
        ? team.score
        : team.points != null
          ? team.points
          : team.pts != null
            ? team.pts
            : team.sc);
      return {
        name: String(team && (team.name || team.n || team.title) || "Komanda").slice(0, 80),
        score: Number(score)
      };
    }).filter(function (team) {
      return Number.isInteger(team.score) && team.score >= 0;
    }).slice(0, 8);
  }

  function reportResult(game, room, teams) {
    var scores = normalizedTeams(teams);
    if (!room || !scores.length) return;
    var id = hashResult(game + "|" + room);
    saveGameResult({
      id: game.replace(/[^A-Za-z0-9_-]/g, "") + "_" + id,
      game: game,
      title: {
        "nhn-voice": "Nə? Harada? Nə zaman? — səsli oyun",
        "breyn-voice": "Breyn Rinq — səsli oyun",
        "xemse-voice": "Xəmsə — səsli oyun"
      }[game],
      teams: scores
    });
  }

  function trackNhnWebSockets() {
    var NativeWebSocket = window.WebSocket;
    if (!NativeWebSocket || NativeWebSocket.__pikselTracked) return;
    function TrackedWebSocket(url, protocols) {
      var socket = protocols === undefined
        ? new NativeWebSocket(url)
        : new NativeWebSocket(url, protocols);
      if (String(url).indexOf("wss://piksel-nhn.pikseliok.workers.dev/room/") === 0) {
        socket.addEventListener("message", function (event) {
          var message;
          try { message = JSON.parse(event.data); } catch (error) { return; }
          if (message.t === "state" && message.phase === "ended") {
            var code = String(url).split("/").pop().split("?")[0];
            reportResult("nhn-voice", code, message.teams);
          }
        });
      }
      return socket;
    }
    TrackedWebSocket.prototype = NativeWebSocket.prototype;
    Object.setPrototypeOf(TrackedWebSocket, NativeWebSocket);
    TrackedWebSocket.__pikselTracked = true;
    window.WebSocket = TrackedWebSocket;
  }

  function trackFirebaseGame(game, storageKey, databasePath, isFinished) {
    var attachedRoom = "";
    var ref = null;
    window.setInterval(function () {
      if (!window.firebase || !firebase.apps || !firebase.apps.length) return;
      var stored;
      try { stored = JSON.parse(sessionStorage.getItem(storageKey) || "null"); } catch (error) { return; }
      if (!stored || !stored.room || stored.room === attachedRoom) return;
      if (ref) ref.off("value");
      attachedRoom = String(stored.room);
      try {
        ref = firebase.database().ref(databasePath + "/" + attachedRoom);
        ref.on("value", function (snapshot) {
          var data = snapshot.val();
          if (!data || !isFinished(data)) return;
          reportResult(game, attachedRoom, data.teams);
        }, function (error) {
          console.error("Oyun nəticəsini izləmək mümkün olmadı.", error);
        });
      } catch (error) {
        attachedRoom = "";
        console.error("Oyun nəticəsi üçün Firebase bağlantısı alınmadı.", error);
      }
    }, 1000);
  }

  function trackGameResults() {
    trackNhnWebSockets();
    if (/\/sesli-breyn-rinq(?:\.html)?\/?$/.test(location.pathname)) {
      trackFirebaseGame("breyn-voice", "piksel-br-sess", "rooms", function (data) {
        return data.status === "finished";
      });
    } else if (/\/sesli_xemse(?:\.html)?\/?$/.test(location.pathname)) {
      trackFirebaseGame("xemse-voice", "pxr-sess", "xr", function (data) {
        return data.ph === "end";
      });
    }
  }

  function buildUi() {
    var style = element("style");
    style.textContent = [
      ".pa-homebar{width:100%;min-height:56px;margin:0 auto 10px;display:flex;align-items:center;justify-content:flex-start;position:relative;z-index:20}",
      ".pa-account-root{position:relative;z-index:10001;font-family:inherit;color:var(--fg,#9DC3FF)}",
      ".pa-trigger{display:flex;align-items:center;gap:12px;max-width:100%;padding:0;border:0;border-radius:0;background:transparent;color:var(--accent,#001E6F);font:inherit;font-size:15px;font-weight:700;line-height:1.3;box-shadow:none;cursor:pointer;transition:opacity .2s ease}",
      ".pa-trigger:hover{opacity:.82}.pa-trigger-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:min(480px,calc(100vw - 100px))}",
      ".pa-avatar{width:56px;height:56px;flex:0 0 56px;display:grid;place-items:center;border-radius:50%;background:var(--c1,#00269C);color:var(--fg,#b8d5ff);font-size:17px;font-weight:700}",
      ".pa-trigger-name[data-typing=true]::after{content:\"\";display:inline-block;height:1em;margin-left:2px;border-left:2px solid currentColor;vertical-align:-.12em;animation:pa-caret .75s steps(2,start) infinite}",
      "@keyframes pa-caret{to{visibility:hidden}}",
      ".pa-menu{position:absolute;top:calc(100% + 8px);left:0;width:min(360px,calc(100vw - 32px));padding:8px;border:1px solid color-mix(in srgb,var(--fg,#9DC3FF) 20%,transparent);border-radius:18px;background:var(--grad,linear-gradient(135deg,#001E6F,#002E92));box-shadow:0 14px 35px rgba(0,10,60,.28);transform-origin:top left}.pa-menu[hidden]{display:none}.pa-menu:not([hidden]){animation:pa-menu-in .3s cubic-bezier(.16,1,.3,1) both}",
      ".pa-menu button{display:block;width:100%;padding:12px 14px;border:0;border-radius:12px;background:transparent;color:var(--fg,#9DC3FF);text-align:left;font:inherit;font-size:var(--ct,25px);font-weight:600;line-height:1.15;cursor:pointer;animation:pa-menu-item-in .28s ease both}.pa-menu button:nth-child(2){animation-delay:35ms}.pa-menu button:nth-child(3){animation-delay:70ms}.pa-menu button:hover,.pa-menu button:focus-visible{background:color-mix(in srgb,var(--fg,#9DC3FF) 13%,transparent);outline:none}",
      "@keyframes pa-menu-in{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}@keyframes pa-menu-item-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}",
      ".pa-dialog{--pa-dialog-bg:var(--c1,var(--mode-bg-light,var(--deep,var(--page,#001E6F))));--pa-dialog-color:var(--c1,var(--page,var(--deep,#001E6F)));--pa-dialog-fg:var(--fg,var(--accent,var(--ink,#b8d5ff)));--pa-surface:color-mix(in srgb,var(--pa-dialog-color) 88%,var(--pa-dialog-fg));width:min(590px,calc(100vw - 24px));max-height:min(86vh,780px);margin:auto;padding:0;overflow:hidden;border:1px solid color-mix(in srgb,var(--pa-dialog-fg) 24%,transparent);border-radius:26px;background:var(--pa-dialog-bg);color:var(--pa-dialog-fg);box-shadow:0 22px 70px rgba(0,0,0,.4);font:14px/1.55 Poppins,system-ui,sans-serif}.pa-dialog[open]{animation:pa-dialog-in .32s cubic-bezier(.16,1,.3,1) both}.pa-dialog[open] .pa-panel:not([hidden]),.pa-dialog[open] .pa-section:not([hidden]){animation:pa-panel-in .3s ease both}@keyframes pa-dialog-in{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}@keyframes pa-panel-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
      "html.dark .pa-dialog,body.dark .pa-dialog{--pa-dialog-bg:var(--c1,var(--mode-bg-dark,var(--dark-bg,#00072C)));--pa-dialog-color:var(--c1,var(--page,var(--dark-bg,#00072C)));--pa-dialog-fg:var(--fg,var(--accent,var(--dark-light,#9DC3FF)))}",
      ".pa-dialog::backdrop{background:rgba(0,7,44,.58);-webkit-backdrop-filter:none;backdrop-filter:none}.pa-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 20px;background:var(--pa-dialog-bg);color:var(--pa-dialog-fg)}",
      ".pa-head h2{margin:0;font-size:18px;font-weight:700}.pa-close{width:34px;height:34px;border:0;border-radius:50%;background:color-mix(in srgb,var(--pa-dialog-fg) 12%,transparent);color:inherit;font-size:24px;line-height:1;cursor:pointer}",
      ".pa-body{padding:19px 20px;overflow:auto;max-height:calc(86vh - 64px)}.pa-dialog button,.pa-dialog input{font-family:inherit}.pa-panel[hidden],.pa-section[hidden]{display:none}",
      ".pa-intro{margin:0 0 16px;opacity:1}.pa-google-button{min-height:44px}.pa-profile-card{display:flex;align-items:center;gap:13px;margin-bottom:18px;padding:14px;border:1px solid color-mix(in srgb,var(--pa-dialog-fg) 18%,transparent);border-radius:18px;background:var(--pa-surface)}",
      ".pa-profile-initial{width:48px;height:48px;flex:0 0 48px;display:grid;place-items:center;border-radius:50%;background:var(--pa-dialog-bg);color:var(--pa-dialog-fg);font-size:20px;font-weight:700}.pa-profile-name{display:block;font-size:15px}.pa-profile-email{display:block;max-width:100%;overflow-wrap:anywhere;font-size:12px;opacity:.9}",
      ".pa-label{display:block;margin:12px 0 6px;font-size:12px;font-weight:600}.pa-input{width:100%;min-height:42px;padding:9px 12px;border:1px solid color-mix(in srgb,var(--pa-dialog-fg) 28%,transparent);border-radius:13px;background:var(--pa-surface);color:var(--pa-dialog-fg);font:inherit;outline:none}.pa-input:focus{border-color:var(--accent,#001E6F);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent,#001E6F) 16%,transparent)}",
      ".pa-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0 18px}.pa-primary,.pa-secondary,.pa-signout,.pa-remove{border:1px solid color-mix(in srgb,var(--pa-dialog-fg) 24%,transparent);border-radius:999px;padding:9px 14px;background:var(--pa-dialog-bg);color:var(--pa-dialog-fg);font:inherit;font-size:12px;font-weight:600;line-height:1.3;cursor:pointer;transition:transform .18s ease,filter .18s ease}.pa-primary:hover,.pa-secondary:hover,.pa-signout:hover,.pa-remove:hover{transform:translateY(-1px);filter:brightness(1.06)}.pa-secondary,.pa-remove{background:transparent;color:var(--pa-dialog-fg)}.pa-primary:disabled,.pa-secondary:disabled{opacity:.55;cursor:wait;transform:none}",
      ".pa-subtitle{margin:18px 0 9px;font-size:14px;font-weight:700}.pa-list{display:grid;gap:10px;max-height:40vh;overflow:auto;padding:1px}.pa-item{min-width:0;padding:13px;border:1px solid color-mix(in srgb,var(--pa-dialog-fg) 16%,transparent);border-radius:17px;background:var(--pa-surface)}.pa-item p{margin:5px 0;overflow-wrap:anywhere}.pa-meta,.pa-empty{opacity:.9;font-size:12px}.pa-empty{padding:8px 2px}.pa-answer{opacity:.92}.pa-score{font-weight:600}.pa-remove{margin-top:7px;font-size:11px}.pa-package-select{display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:12px}.pa-package-select input{accent-color:var(--accent,#001E6F)}",
      ".pa-package-box{margin:0 0 13px;padding:13px;border:1px solid color-mix(in srgb,var(--pa-dialog-fg) 20%,transparent);border-radius:17px;background:var(--pa-surface)}.pa-package-box[hidden]{display:none}.pa-package-box p{margin:5px 0;font-size:12px;opacity:.9}.pa-package-questions{margin-top:10px;border-top:1px solid color-mix(in srgb,var(--pa-dialog-fg) 14%,transparent)}.pa-package-question{padding:9px 0;border-bottom:1px solid color-mix(in srgb,var(--pa-dialog-fg) 12%,transparent)}.pa-package-question:last-child{border-bottom:0}.pa-package-question p{margin:4px 0 0;font-size:12px;opacity:.9}",
      ".pa-stat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:19px}.pa-stat{padding:14px;border:1px solid color-mix(in srgb,var(--pa-dialog-fg) 16%,transparent);border-radius:17px;background:var(--pa-surface)}.pa-stat strong{display:block;font-size:23px;line-height:1.2}.pa-stat span{font-size:12px;opacity:.9}",
      ".pa-status{min-height:22px;margin:12px 2px 0;font-size:13px;opacity:1}.pa-error{display:inline-block;max-width:100%;padding:6px 10px;border-radius:8px;background:#8f172d;color:#fff!important;opacity:1}.pa-signout{margin-top:14px}.pa-menu button:focus-visible,.pa-trigger:focus-visible,.pa-dialog button:focus-visible{outline:2px solid currentColor;outline-offset:2px}",
      ".fav-btn[data-active=true]{background:#ffdf75;color:#624800;border-radius:10px}.fav-btn{cursor:pointer}",
      "@media(max-width:1000px){.pa-avatar{width:52px;height:52px;flex-basis:52px}}",
      "@media(max-width:700px){.pa-menu button{font-size:14px}}",
      "@media(max-width:600px){.pa-dialog{width:calc(100vw - 18px);max-height:90vh;border-radius:21px}.pa-body{padding:15px;max-height:calc(90vh - 60px)}.pa-head{padding:13px 16px}.pa-homebar{min-height:52px;margin-bottom:8px}.pa-trigger{gap:9px}.pa-trigger-name{max-width:calc(100vw - 100px)}.pa-list{max-height:43vh}}",
      "@media(max-width:360px){.pa-avatar{width:46px;height:46px;flex-basis:46px}}",
      "@media(min-width:1001px){.pa-menu button{font-size:calc(var(--ct,25px) - 2px)}}",
      ".pa-menu{border-color:color-mix(in srgb,var(--fg,#b8d5ff) 42%,transparent)}",
      ".pa-dialog{--pa-surface:color-mix(in srgb,var(--pa-dialog-color) 88%,var(--pa-dialog-fg));border-color:color-mix(in srgb,var(--pa-dialog-fg) 42%,transparent);background:var(--pa-dialog-bg)}",
      ".pa-head{background:var(--pa-dialog-bg);border-bottom:1px solid color-mix(in srgb,var(--pa-dialog-fg) 30%,transparent)}",
      ".pa-profile-card,.pa-item,.pa-package-box,.pa-stat{border-color:color-mix(in srgb,var(--pa-dialog-fg) 30%,transparent);background:var(--pa-surface)}.pa-input{border-color:color-mix(in srgb,var(--pa-dialog-fg) 38%,transparent);background:var(--pa-surface)}",
      ".pa-score{display:inline-flex;max-width:100%;margin:6px 0!important;padding:6px 10px;border:1px solid color-mix(in srgb,var(--pa-dialog-fg) 38%,transparent);border-radius:12px;background:var(--pa-surface)}",
      ".pa-primary,.pa-secondary,.pa-signout,.pa-remove{border-color:color-mix(in srgb,var(--pa-dialog-fg) 34%,transparent);background:var(--pa-dialog-bg)}",
      ".pa-error{border:1px solid rgba(255,255,255,.38)}",
      ".author-row.has-favorite-action{align-items:center;padding:8px 10px;border:1px solid color-mix(in srgb,currentColor 42%,transparent);border-radius:16px;background:transparent}",
      ".fav-btn{border:1px solid color-mix(in srgb,var(--ink,var(--fg,#9DC3FF)) 42%,transparent)}html.dark .fav-btn,body.dark .fav-btn{border-color:color-mix(in srgb,var(--dark-ink,var(--dark-light,var(--fg,#9DC3FF))) 42%,transparent)}.fav-btn[data-active=true]{border-color:rgba(98,72,0,.55)}",
      ".pa-menu:not([hidden]){animation-duration:.2s}.pa-menu button{animation-duration:.16s}.pa-menu button:nth-child(2){animation-delay:20ms}.pa-menu button:nth-child(3){animation-delay:40ms}.pa-dialog[open]{animation-duration:.22s}.pa-dialog[open] .pa-panel:not([hidden]),.pa-dialog[open] .pa-section:not([hidden]){animation-duration:.2s}",
      "@media(prefers-reduced-motion:reduce){.pa-trigger-name[data-typing=true]::after,.pa-menu:not([hidden]),.pa-menu button,.pa-dialog[open],.pa-dialog[open] .pa-panel:not([hidden]),.pa-dialog[open] .pa-section:not([hidden]){animation:none!important}}"
    ].join("");
    document.head.appendChild(style);

    var homePage = document.querySelector(".page");
    var path = location.pathname.replace(/\/+$/, "").toLowerCase();
    var home = (path === "" || path === "/index.html") &&
      homePage && homePage.querySelector(".hero") && homePage.querySelector(".dock");
    if (home) {
      var root = element("div", "pa-account-root");
      trigger = element("button", "pa-trigger");
      trigger.type = "button";
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-expanded", "false");
      triggerName = element("span", "pa-trigger-name");
      triggerAvatar = element("span", "pa-avatar");
      triggerAvatar.setAttribute("aria-hidden", "true");
      trigger.append(triggerAvatar, triggerName);
      menu = element("div", "pa-menu");
      menu.hidden = true;
      menu.setAttribute("role", "menu");
      [
        ["profile", "Profil"],
        ["stats", "Statistika"],
        ["favorites", "Favori suallarım"]
      ].forEach(function (item) {
        var option = element("button", "", item[1]);
        option.type = "button";
        option.setAttribute("role", "menuitem");
        option.addEventListener("click", function () { showView(item[0]); });
        menu.appendChild(option);
      });
      trigger.addEventListener("click", function () {
        if (!state.profile) {
          showView("signin");
          return;
        }
        menu.hidden = !menu.hidden;
        trigger.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
      });
      root.append(trigger, menu);
      var homebar = element("div", "pa-homebar");
      homebar.appendChild(root);
      var main = homePage.querySelector("main");
      homePage.insertBefore(homebar, main || homePage.firstChild);
      document.addEventListener("click", function (event) {
        if (!root.contains(event.target) && !menu.hidden) {
          menu.hidden = true;
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    }

    dialog = element("dialog", "pa-dialog");
    var head = element("div", "pa-head");
    dialogTitle = element("h2", "", "Google hesabı ilə giriş");
    head.appendChild(dialogTitle);
    var close = element("button", "pa-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Bağla");
    close.addEventListener("click", function () { dialog.close(); });
    head.appendChild(close);
    var body = element("div", "pa-body");
    signInPanel = element("section", "pa-panel");
    signInPanel.appendChild(element("p", "pa-intro", "Favoriləri və oyun nəticələrini yadda saxlayın, oyunlara isə adınızı avtomatik əlavə edin."));
    googleButton = element("div", "pa-google-button");
    signInPanel.appendChild(googleButton);

    accountPanel = element("section", "pa-panel");
    accountPanel.hidden = true;
    profilePanel = element("section", "pa-section");
    profilePanel.hidden = true;
    var profileCard = element("div", "pa-profile-card");
    profileInitial = element("span", "pa-profile-initial");
    profileInitial.setAttribute("aria-hidden", "true");
    var identity = element("div");
    profileDisplayName = element("strong", "pa-profile-name");
    identity.appendChild(profileDisplayName);
    profileEmail = element("span", "pa-profile-email");
    identity.appendChild(profileEmail);
    profileCard.append(profileInitial, identity);
    profilePanel.appendChild(profileCard);
    profilePanel.appendChild(element("label", "pa-label", "Adınız"));
    profileNameInput = element("input", "pa-input");
    profileNameInput.type = "text";
    profileNameInput.maxLength = 40;
    profileNameInput.autocomplete = "nickname";
    profileNameInput.dataset.dirty = "false";
    profileNameInput.addEventListener("input", function () { profileNameInput.dataset.dirty = "true"; });
    profilePanel.appendChild(profileNameInput);
    saveProfileButton = element("button", "pa-primary", "Adı yadda saxla");
    saveProfileButton.type = "button";
    saveProfileButton.addEventListener("click", saveProfile);
    var profileActions = element("div", "pa-actions");
    profileActions.appendChild(saveProfileButton);
    profilePanel.appendChild(profileActions);
    profilePanel.appendChild(element("h3", "pa-subtitle", "Yaratdığım şəxsi paketlər"));
    profilePackagesList = element("div", "pa-list");
    profilePanel.appendChild(profilePackagesList);
    var signOut = element("button", "pa-signout", "Hesabdan çıx");
    signOut.type = "button";
    signOut.addEventListener("click", signOutUser);
    profilePanel.appendChild(signOut);

    statsPanel = element("section", "pa-section");
    statsPanel.hidden = true;
    var statsGrid = element("div", "pa-stat-grid");
    function stat(label) {
      var tile = element("div", "pa-stat");
      var value = element("strong", "", "0");
      tile.append(value, element("span", "", label));
      statsGrid.appendChild(tile);
      return value;
    }
    statsGamesValue = stat("Oyun nəticəsi");
    statsFavoritesValue = stat("Favori sual");
    statsPackagesValue = stat("Şəxsi paket");
    statsPointsValue = stat("Toplam xal");
    statsPanel.appendChild(statsGrid);
    statsPanel.appendChild(element("h3", "pa-subtitle", "Son oyun nəticələri"));
    resultList = element("div", "pa-list");
    statsPanel.appendChild(resultList);

    favoritesPanel = element("section", "pa-section");
    favoritesPanel.hidden = true;
    var favoritesHeading = element("h3", "pa-subtitle", "Favori suallarım");
    var createPackageButton = element("button", "pa-primary", "Paketini yarat");
    createPackageButton.type = "button";
    createPackageButton.addEventListener("click", startPackageCreation);
    var packageHeader = element("div", "pa-actions");
    packageHeader.appendChild(createPackageButton);
    packageComposer = element("div", "pa-package-box");
    packageComposer.hidden = true;
    packageComposer.appendChild(element("label", "pa-label", "Paketin adı"));
    packageTitleInput = element("input", "pa-input");
    packageTitleInput.type = "text";
    packageTitleInput.maxLength = 60;
    packageTitleInput.placeholder = "Məsələn, Seçilmiş suallarım";
    packageComposer.appendChild(packageTitleInput);
    packageComposer.appendChild(element("p", "", "Paket şəxsi olacaq və yalnız profilinizdə görünəcək. Paketə daxil etmək istədiyiniz favoriləri seçin."));
    var packageActions = element("div", "pa-actions");
    packageSelection = element("button", "pa-primary", "Şəxsi paketi yarat");
    packageSelection.type = "button";
    packageSelection.addEventListener("click", createPackage);
    var cancelPackage = element("button", "pa-secondary", "Ləğv et");
    cancelPackage.type = "button";
    cancelPackage.addEventListener("click", function () {
      packageComposer.hidden = true;
      selectedFavoriteIds.clear();
      renderFavorites();
    });
    packageActions.append(packageSelection, cancelPackage);
    packageComposer.appendChild(packageActions);
    favoriteList = element("div", "pa-list");
    favoritesPanel.append(favoritesHeading, packageHeader, packageComposer, favoriteList);

    accountPanel.append(profilePanel, statsPanel, favoritesPanel);
    statusNode = element("p", "pa-status");
    statusNode.setAttribute("role", "status");
    body.append(signInPanel, accountPanel, statusNode);
    dialog.append(head, body);
    document.body.appendChild(dialog);
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  }

  async function signOutUser() {
    try {
      if (state.session) await api("/account/" + encodeURIComponent(state.session.uid) + "/session", { method: "DELETE" });
    } catch (error) {
      setStatus(error.message, true);
      return;
    }
    state.session = null;
    state.profile = null;
    state.favorites = [];
    state.results = [];
    state.packages = [];
    selectedFavoriteIds.clear();
    storeSession();
    syncPanels();
    setStatus("Hesabdan çıxıldı.");
  }

  function init() {
    buildUi();
    state.session = readSession();
    state.profile = state.session && state.session.profile ? state.session.profile : null;
    syncPanels();
    if (state.session) {
      refreshAccount().catch(function (error) {
        state.session = null;
        state.profile = null;
        storeSession();
        syncPanels();
        setStatus(error.message, true);
      });
    }
    setupGoogleSignIn();
    var observer = new MutationObserver(syncNameInputs);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("click", function (event) {
      var button = event.target.closest && event.target.closest("[data-piksel-fav]");
      if (!button) return;
      event.preventDefault();
      var item = favoriteItems[button.dataset.pikselFav];
      if (item) toggleFavorite(item);
    });
    document.addEventListener("input", function (event) {
      var input = event.target;
      if (input && input.dataset && input.dataset.pikselAutofilled === "true" && state.profile && input.value !== state.profile.name) {
        delete input.dataset.pikselAutofilled;
      }
    });
    scanQuestionCards();
    var questionObserver = new MutationObserver(scanQuestionCards);
    var questionContainer = document.getElementById("qc");
    if (questionContainer) questionObserver.observe(questionContainer, { childList: true, subtree: true });
    window.PikselAccount = {
      saveResult: saveResult,
      syncFavoriteButtons: syncFavoriteButtons,
      getProfile: function () { return state.profile; },
      getFavorites: function () { return state.favorites.slice(); }
    };
    while (queue.length) saveGameResult(queue.shift());
    trackGameResults();
    window.addEventListener("piksel:game-result", function (event) {
      if (event.detail) saveGameResult(event.detail);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
