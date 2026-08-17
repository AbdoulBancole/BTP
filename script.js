/**
 * ============================================================
 * SCRIPT PRINCIPAL - BTP
 * ============================================================
 *
 * Gestion :
 * - formulaire
 * - ajout / modification / suppression
 * - filtres
 * - conflits
 * - calendrier
 * - planning
 * - Plan LIDER / PowerPoint via Electron
 *
 * LOGIQUE POWERPOINT :
 *
 * Plan LIDER/
 * ├── Plan_LIDER.pptx              <- TOUJOURS la dernière version
 * └── versions/
 *     ├── Plan_LIDER_v001.pptx
 *     ├── Plan_LIDER_v002.pptx
 *     ├── Plan_LIDER_v003.pptx
 *     └── ...
 *
 * L'utilisateur ouvre toujours Plan_LIDER.pptx.
 *
 * Lorsqu'une nouvelle version est enregistrée :
 * 1. PowerPoint est sauvegardé.
 * 2. Une nouvelle copie versionnée est créée.
 * 3. Plan_LIDER.pptx est remplacé par cette nouvelle version.
 *
 * ============================================================
 */


/* ============================================================
   ÉLÉMENTS DOM
   ============================================================ */

const form =
  document.getElementById("activity-form");

const messageContainer =
  document.getElementById("message-container");

const activitiesBody =
  document.getElementById("activities-body");

const emptyMessage =
  document.getElementById("empty-message");

const conflictModal =
  document.getElementById("conflict-modal");

const conflictMessage =
  document.getElementById("conflict-message");

const conflictConfirm =
  document.getElementById("conflict-confirm");

const conflictCancel =
  document.getElementById("conflict-cancel");

const navLinks =
  document.querySelectorAll(".nav-link");

const pages =
  document.querySelectorAll(".page");

const planningContent =
  document.getElementById("planning-content");

const activityFormPanel =
  document.getElementById("activity-form-panel");

const openActivityFormBtn =
  document.getElementById("open-activity-form");

const closeActivityFormBtn =
  document.getElementById("close-activity-form");

const resetPlanningBtn =
  document.getElementById("reset-planning-btn");

const calendarDateInput =
  document.getElementById("calendar-date");

const planningCalendar =
  document.getElementById("planning-calendar");


/* ============================================================
   PLAN LIDER
   ============================================================ */

const planLiderPage =
  document.getElementById("plan-lider-page");

const planLiderViewer =
  document.getElementById("plan-lider-viewer");

const openPlanLiderBtn =
  document.getElementById("open-plan-lider");


/* ============================================================
   VARIABLES GLOBALES
   ============================================================ */

let pendingActivity = null;


/* ============================================================
   FORMULAIRE
   ============================================================ */

function showActivityForm(prefill = {}) {

  if (!activityFormPanel) {
    return;
  }

  activityFormPanel.classList.remove("hidden");

  if (openActivityFormBtn) {
    openActivityFormBtn.textContent =
      "Masquer le formulaire";
  }

  if (prefill.date) {

    const element =
      document.getElementById("date");

    if (element) {
      element.value = prefill.date;
    }
  }

  if (prefill.grue) {

    const element =
      document.getElementById("grue");

    if (element) {
      element.value = prefill.grue;
    }
  }

  if (prefill.start) {

    const input =
      document.getElementById("heure-debut");

    const display =
      document.getElementById(
        "heure-debut-display"
      );

    if (input) {
      input.value = prefill.start;
    }

    if (display) {
      display.value = prefill.start;
    }
  }

  if (prefill.end) {

    const input =
      document.getElementById("heure-fin");

    const display =
      document.getElementById(
        "heure-fin-display"
      );

    if (input) {
      input.value = prefill.end;
    }

    if (display) {
      display.value = prefill.end;
    }
  }

  if (prefill.heureLivraison) {

    const input =
      document.getElementById("heure-livraison");

    const display =
      document.getElementById(
        "heure-livraison-display"
      );

    if (input) {
      input.value = prefill.heureLivraison;
    }

    if (display) {
      display.value = prefill.heureLivraison;
    }
  }
}


/* ============================================================
   CACHER FORMULAIRE
   ============================================================ */

function hideActivityForm() {

  if (!activityFormPanel) {
    return;
  }

  activityFormPanel.classList.add("hidden");

  if (openActivityFormBtn) {
    openActivityFormBtn.textContent =
      "Ajouter une activité";
  }

  if (form) {

    form.reset();

    form.dataset.editId = "";

    const submitBtn =
      form.querySelector(
        'button[type="submit"]'
      );

    if (submitBtn) {
      submitBtn.textContent =
        "Enregistrer";
    }
  }

  [
    "heure-debut-display",
    "heure-fin-display",
    "heure-livraison-display"
  ].forEach(id => {

    const element =
      document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });
}


/* ============================================================
   BOUTON AJOUTER
   ============================================================ */

if (openActivityFormBtn) {

  openActivityFormBtn.addEventListener(
    "click",
    () => {

      if (
        activityFormPanel &&
        activityFormPanel.classList.contains("hidden")
      ) {

        showActivityForm();

      } else {

        hideActivityForm();
      }
    }
  );
}


/* ============================================================
   BOUTON FERMER
   ============================================================ */

if (closeActivityFormBtn) {

  closeActivityFormBtn.addEventListener(
    "click",
    hideActivityForm
  );
}


/* ============================================================
   SOUMISSION FORMULAIRE
   ============================================================ */

if (form) {

  form.addEventListener(
    "submit",
    handleFormSubmit
  );

  form.addEventListener(
    "reset",
    clearMessages
  );
}


/* ============================================================
   TRAITEMENT FORMULAIRE
   ============================================================ */

function handleFormSubmit(event) {

  event.preventDefault();

  const formData =
    new FormData(form);

  const data = {

    date:
      formData.get("date"),

    zone:
      formData.get("zone"),

    activite:
      formData.get("activite"),

    niveau:
      formData.get("niveau"),

    typeElement:
      formData.get("typeElement"),

    element:
      formData.get("element"),

    grue:
      formData.get("grue"),

    heureDebut:
      formData.get("heureDebut"),

    heureFin:
      formData.get("heureFin"),

    heureLivraison:
      formData.get("heureLivraison") || ""
  };


  /* ==========================================================
     VALIDATION
     ========================================================== */

  if (
    !data.date ||
    !data.zone ||
    !data.activite ||
    !data.niveau ||
    !data.typeElement ||
    !data.element ||
    !data.grue ||
    !data.heureDebut ||
    !data.heureFin
  ) {

    showMessage(
      "Veuillez remplir tous les champs obligatoires.",
      "error"
    );

    return;
  }


  const start =
    timeToMinutes(data.heureDebut);

  const end =
    timeToMinutes(data.heureFin);


  if (
    Number.isNaN(start) ||
    Number.isNaN(end)
  ) {

    showMessage(
      "Veuillez sélectionner des heures valides.",
      "error"
    );

    return;
  }


  if (end <= start) {

    showMessage(
      "L'heure de fin doit être après l'heure de début.",
      "error"
    );

    return;
  }


  /* ==========================================================
     MODE ÉDITION
     ========================================================== */

  const editId =
    form.dataset.editId;


  if (editId) {

    handleUpdate(
      editId,
      data
    );

    return;
  }


  /* ==========================================================
     MODE CRÉATION
     ========================================================== */

  const newActivity =
    createActivity(data);


  const conflicts =
    findConflicts(newActivity);


  if (conflicts.length > 0) {

    pendingActivity = {

      type: "create",

      data,

      activity: newActivity
    };

    showConflictModal(conflicts);

    return;
  }


  const saved =
    addActivity(data);


  if (!saved) {

    showMessage(
      "Erreur lors de l'enregistrement de l'activité.",
      "error"
    );

    return;
  }


  showMessage(
    "Activité enregistrée avec succès.",
    "success"
  );


  resetFormAfterSave();

  refreshActivitiesTable();

  refreshCalendar();
}


/* ============================================================
   MISE À JOUR
   ============================================================ */

function handleUpdate(
  editId,
  data
) {

  const updatedActivity = {

    ...data,

    id: editId
  };


  const conflicts =
    findConflictsOnUpdate(
      updatedActivity
    );


  if (conflicts.length > 0) {

    pendingActivity = {

      type: "update",

      id: editId,

      data,

      activity: updatedActivity
    };

    showConflictModal(conflicts);

    return;
  }


  const updated =
    updateActivity(
      editId,
      data
    );


  if (!updated) {

    showMessage(
      "Impossible de mettre à jour l'activité.",
      "error"
    );

    return;
  }


  showMessage(
    "Activité mise à jour avec succès.",
    "success"
  );


  resetFormAfterSave();

  refreshActivitiesTable();

  refreshCalendar();
}


/* ============================================================
   RESET FORMULAIRE
   ============================================================ */

function resetFormAfterSave() {

  if (!form) {
    return;
  }

  form.reset();

  form.dataset.editId = "";


  const submitBtn =
    form.querySelector(
      'button[type="submit"]'
    );


  if (submitBtn) {

    submitBtn.textContent =
      "Enregistrer";
  }


  [
    "heure-debut-display",
    "heure-fin-display",
    "heure-livraison-display"
  ].forEach(id => {

    const element =
      document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });
}


/* ============================================================
   MODAL CONFLIT
   ============================================================ */

function showConflictModal(
  conflicts
) {

  if (
    !conflictModal ||
    !conflictMessage
  ) {
    return;
  }


  let message =
    "<strong>Chevauchements détectés :</strong><ul>";


  conflicts.forEach(
    conflict => {

      message +=
        `<li>${escapeHtml(
          conflict.message
        )}</li>`;
    }
  );


  message +=
    "</ul><p>Voulez-vous enregistrer malgré tout ?</p>";


  conflictMessage.innerHTML =
    message;


  conflictModal.classList.add(
    "active"
  );
}


/* ============================================================
   CONFIRMER CONFLIT
   ============================================================ */

if (conflictConfirm) {

  conflictConfirm.addEventListener(
    "click",
    () => {

      if (!pendingActivity) {
        return;
      }


      const pending =
        pendingActivity;


      if (
        pending.type === "create"
      ) {

        const saved =
          addActivity(
            pending.data
          );


        if (!saved) {

          showMessage(
            "Erreur lors de l'enregistrement.",
            "error"
          );

        } else {

          showMessage(
            "Activité enregistrée malgré le conflit.",
            "success"
          );
        }
      }


      if (
        pending.type === "update"
      ) {

        const updated =
          updateActivity(
            pending.id,
            pending.data
          );


        if (!updated) {

          showMessage(
            "Erreur lors de la mise à jour.",
            "error"
          );

        } else {

          showMessage(
            "Activité mise à jour malgré le conflit.",
            "success"
          );
        }
      }


      resetFormAfterSave();

      refreshActivitiesTable();

      refreshCalendar();


      conflictModal.classList.remove(
        "active"
      );


      pendingActivity = null;
    }
  );
}


/* ============================================================
   ANNULER CONFLIT
   ============================================================ */

if (conflictCancel) {

  conflictCancel.addEventListener(
    "click",
    () => {

      conflictModal.classList.remove(
        "active"
      );

      pendingActivity = null;
    }
  );
}


/* ============================================================
   FERMER MODAL CONFLIT
   ============================================================ */

const conflictClose =
  document.querySelector(
    "#conflict-modal .modal-close"
  );


if (conflictClose) {

  conflictClose.addEventListener(
    "click",
    () => {

      conflictModal.classList.remove(
        "active"
      );

      pendingActivity = null;
    }
  );
}


/* ============================================================
   FILTRES
   ============================================================ */

let currentFilters = {

  date: "",
  zone: "",
  grue: "",
  activite: ""
};


function applyFilters() {

  const date =
    document.getElementById("filter-date");

  const zone =
    document.getElementById("filter-zone");

  const grue =
    document.getElementById("filter-grue");

  const activite =
    document.getElementById("filter-activite");


  currentFilters = {

    date:
      date ? date.value : "",

    zone:
      zone ? zone.value : "",

    grue:
      grue ? grue.value : "",

    activite:
      activite ? activite.value : ""
  };


  refreshActivitiesTable();
}


function clearFilters() {

  currentFilters = {

    date: "",
    zone: "",
    grue: "",
    activite: ""
  };


  [
    "filter-date",
    "filter-zone",
    "filter-grue",
    "filter-activite"
  ].forEach(id => {

    const element =
      document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });


  refreshActivitiesTable();
}


/* ============================================================
   TABLEAU ACTIVITÉS
   ============================================================ */

function refreshActivitiesTable() {

  if (
    !activitiesBody ||
    !emptyMessage
  ) {
    return;
  }


  let activities =
    getAllActivities();


  if (currentFilters.date) {

    activities =
      activities.filter(
        activity =>
          activity.date ===
          currentFilters.date
      );
  }


  if (currentFilters.zone) {

    activities =
      activities.filter(
        activity =>
          activity.zone ===
          currentFilters.zone
      );
  }


  if (currentFilters.grue) {

    activities =
      activities.filter(
        activity =>
          activity.grue ===
          currentFilters.grue
      );
  }


  if (currentFilters.activite) {

    activities =
      activities.filter(
        activity =>
          activity.activite ===
          currentFilters.activite
      );
  }


  activitiesBody.innerHTML = "";


  if (activities.length === 0) {

    emptyMessage.style.display =
      "block";

    return;
  }


  emptyMessage.style.display =
    "none";


  activities.sort(
    (a, b) => {

      if (a.date !== b.date) {

        return a.date.localeCompare(
          b.date
        );
      }


      return a.heureDebut.localeCompare(
        b.heureDebut
      );
    }
  );


  activities.forEach(
    activity => {

      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          ${formatDateFr(activity.date)}
        </td>

        <td>
          ${escapeHtml(activity.zone)}
        </td>

        <td>
          ${escapeHtml(activity.activite)}
        </td>

        <td>
          <strong>
            ${escapeHtml(activity.grue)}
          </strong>
        </td>

        <td>
          ${escapeHtml(activity.heureDebut)}
          -
          ${escapeHtml(activity.heureFin)}
        </td>

        <td>
          ${escapeHtml(activity.element)}
        </td>

        <td>

          <button
            type="button"
            class="btn-danger"
            onclick="editActivity('${escapeJs(activity.id)}')"
            style="margin-right: 0.5rem;"
          >
            Éditer
          </button>

          <button
            type="button"
            class="btn-danger"
            onclick="deleteRow('${escapeJs(activity.id)}')"
          >
            Supprimer
          </button>

        </td>
      `;


      activitiesBody.appendChild(row);
    }
  );
}


/* ============================================================
   ÉDITER ACTIVITÉ
   ============================================================ */

function editActivity(id) {

  const activity =
    getActivityById(id);


  if (!activity) {

    showMessage(
      "Activité introuvable.",
      "error"
    );

    return;
  }


  const fields = {

    date:
      activity.date,

    zone:
      activity.zone,

    activite:
      activity.activite,

    niveau:
      activity.niveau,

    "type-element":
      activity.typeElement,

    element:
      activity.element,

    grue:
      activity.grue,

    "heure-debut":
      activity.heureDebut,

    "heure-fin":
      activity.heureFin,

    "heure-livraison":
      activity.heureLivraison || ""
  };


  Object.entries(fields)
    .forEach(
      ([id, value]) => {

        const element =
          document.getElementById(id);

        if (element) {
          element.value = value;
        }
      }
    );


  const startDisplay =
    document.getElementById(
      "heure-debut-display"
    );

  const endDisplay =
    document.getElementById(
      "heure-fin-display"
    );

  const deliveryDisplay =
    document.getElementById(
      "heure-livraison-display"
    );


  if (startDisplay) {
    startDisplay.value =
      activity.heureDebut;
  }


  if (endDisplay) {
    endDisplay.value =
      activity.heureFin;
  }


  if (deliveryDisplay) {
    deliveryDisplay.value =
      activity.heureLivraison || "";
  }


  if (form) {

    form.dataset.editId =
      id;


    const submitBtn =
      form.querySelector(
        'button[type="submit"]'
      );


    if (submitBtn) {
      submitBtn.textContent =
        "Mettre à jour";
    }
  }


  showActivityForm();


  if (activityFormPanel) {

    activityFormPanel.scrollIntoView({
      behavior: "smooth"
    });
  }


  showMessage(
    "Formulaire en mode édition. Modifiez les informations puis cliquez sur « Mettre à jour ».",
    "info"
  );
}


/* ============================================================
   SUPPRIMER
   ============================================================ */

function deleteRow(id) {

  if (
    !confirm(
      "Êtes-vous sûr de vouloir supprimer cette activité ?"
    )
  ) {
    return;
  }


  const deleted =
    deleteActivity(id);


  if (!deleted) {

    showMessage(
      "Impossible de supprimer l'activité.",
      "error"
    );

    return;
  }


  showMessage(
    "Activité supprimée.",
    "success"
  );


  refreshActivitiesTable();

  refreshCalendar();
}


/* ============================================================
   MESSAGES
   ============================================================ */

function showMessage(
  text,
  type = "info"
) {

  if (!messageContainer) {
    return;
  }


  const alertDiv =
    document.createElement("div");


  alertDiv.className =
    `alert alert-${type}`;


  alertDiv.textContent =
    text;


  messageContainer.innerHTML =
    "";


  messageContainer.appendChild(
    alertDiv
  );


  setTimeout(
    () => {

      if (alertDiv.parentNode) {
        alertDiv.remove();
      }

    },
    4000
  );
}


function clearMessages() {

  if (messageContainer) {
    messageContainer.innerHTML = "";
  }
}


/* ============================================================
   NAVIGATION
   ============================================================ */

navLinks.forEach(
  link => {

    link.addEventListener(
      "click",
      event => {

        event.preventDefault();


        const page =
          link.dataset.page;


        navLinks.forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );


        link.classList.add(
          "active"
        );


        pages.forEach(
          pageElement =>
            pageElement.classList.add(
              "hidden"
            )
        );


        const targetPage =
          document.getElementById(
            `${page}-page`
          );


        if (targetPage) {

          targetPage.classList.remove(
            "hidden"
          );
        }


        if (page === "planning") {

          loadPlanning();

          refreshCalendar();
        }


        if (page === "plan-lider") {

          loadPowerPoint();
        }
      }
    );
  }
);


/* ============================================================
   PLANNING
   ============================================================ */

function loadPlanning() {

  if (!planningContent) {
    return;
  }


  const activities =
    getAllActivities();


  if (activities.length === 0) {

    planningContent.innerHTML =
      "<p class='text-center'>Aucune activité pour afficher le planning.</p>";

    return;
  }


  const planningData = {};


  activities.forEach(
    activity => {

      const key =
        `${activity.date}__${activity.grue}`;


      if (!planningData[key]) {
        planningData[key] = [];
      }


      planningData[key].push(activity);
    }
  );


  let html = "";


  Object.entries(
    planningData
  ).forEach(
    ([key, acts]) => {

      const separator =
        key.indexOf("__");


      const date =
        key.substring(
          0,
          separator
        );


      const grue =
        key.substring(
          separator + 2
        );


      acts.sort(
        (a, b) =>
          a.heureDebut.localeCompare(
            b.heureDebut
          )
      );


      html += `

        <div
          style="
            margin-bottom: 2rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 0.5rem;
          "
        >

          <h3>
            ${escapeHtml(grue)}
            -
            ${formatDateFr(date)}
          </h3>

          <ul
            style="
              list-style: none;
              padding: 0;
            "
          >
      `;


      acts.forEach(
        act => {

          html += `

            <li
              style="
                padding: 0.5rem;
                border-left: 3px solid #1d4ed8;
              "
            >

              <strong>
                ${escapeHtml(act.heureDebut)}
                -
                ${escapeHtml(act.heureFin)}
              </strong>

              :

              ${escapeHtml(act.activite)}

              (${escapeHtml(act.element)})

              -

              Zone
              ${escapeHtml(act.zone)}

            </li>

          `;
        }
      );


      html += `
          </ul>
        </div>
      `;
    }
  );


  planningContent.innerHTML =
    html;
}


/* ============================================================
   CALENDRIER
   ============================================================ */

function getWeekDates(dateString) {

  const baseDate =
    new Date(
      `${dateString}T00:00:00`
    );


  const day =
    baseDate.getDay();


  const diff =
    day === 0
      ? -6
      : 1 - day;


  const monday =
    new Date(baseDate);


  monday.setDate(
    baseDate.getDate() + diff
  );


  return Array.from(
    { length: 7 },
    (_, index) => {

      const date =
        new Date(monday);


      date.setDate(
        monday.getDate() + index
      );


      return date;
    }
  );
}


function formatDayShort(date) {

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      weekday: "short",
      day: "numeric"
    }
  ).format(date);
}


function formatDayLong(date) {

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit"
    }
  ).format(date);
}


/* ============================================================
   CALENDRIER
   ============================================================ */

if (calendarDateInput) {

  if (!calendarDateInput.value) {
    calendarDateInput.value =
      getTodayISO();
  }


  calendarDateInput.addEventListener(
    "change",
    refreshCalendar
  );
}


function refreshCalendar() {

  if (
    !calendarDateInput ||
    !planningCalendar
  ) {
    return;
  }


  const selectedDate =
    calendarDateInput.value;


  if (!selectedDate) {
    return;
  }


  const weekDates =
    getWeekDates(
      selectedDate
    );


  const cranes = [
    "G1",
    "G2",
    "G3"
  ];


  const allActivities =
    getAllActivities();


  let html = `

    <div class="week-planner-header">

      <div class="week-planner-title">
        Planning de la semaine
      </div>

      <div class="week-planner-range">
        ${formatDayLong(weekDates[0])}
        -
        ${formatDayLong(weekDates[6])}
      </div>

    </div>


    <div class="week-planner-grid">

      <div class="planner-corner">
        Grues
      </div>
  `;


  weekDates.forEach(
    date => {

      const isoDate =
        dateToISO(date);


      const count =
        allActivities.filter(
          activity =>
            activity.date === isoDate
        ).length;


      html += `

        <div class="planner-day-header">

          <div>
            ${new Intl.DateTimeFormat(
              "fr-FR",
              {
                weekday: "short"
              }
            ).format(date)}
          </div>

          <div class="planner-day-number">
            ${date.getDate()}
          </div>

          <div class="planner-day-count">
            ${count} activ.
          </div>

        </div>
      `;
    }
  );


  html += `
    </div>

    <div class="week-planner-body">
  `;


  cranes.forEach(
    grue => {

      html += `

        <div class="planner-row">

          <div class="planner-grue">
            ${escapeHtml(grue)}
          </div>
      `;


      weekDates.forEach(
        date => {

          const isoDate =
            dateToISO(date);


          const activities =
            allActivities.filter(
              activity =>
                activity.grue === grue &&
                activity.date === isoDate
            );


          html += `
            <div class="planner-day-cell">
          `;


          if (activities.length > 0) {

            activities.sort(
              (a, b) =>
                a.heureDebut.localeCompare(
                  b.heureDebut
                )
            );


            activities.forEach(
              activity => {

                html += `

                  <div
                    class="planner-activity"
                    onclick="showActivityDetail('${escapeJs(activity.id)}')"
                  >

                    <div class="planner-activity-title">
                      ${escapeHtml(activity.activite)}
                    </div>

                    <div class="planner-activity-time">

                      ${escapeHtml(activity.heureDebut)}
                      -
                      ${escapeHtml(activity.heureFin)}

                    </div>

                    <div class="planner-activity-zone">
                      ${escapeHtml(activity.zone)}
                    </div>

                    <div class="planner-activity-element">
                      ${escapeHtml(activity.element)}
                    </div>

                  </div>
                `;
              }
            );

          } else {

            html += `
              <div class="planner-empty">
                Libre
              </div>
            `;
          }


          html += `
            </div>
          `;
        }
      );


      html += `
        </div>
      `;
    }
  );


  html += `
    </div>
  `;


  planningCalendar.innerHTML =
    html;
}


/* ============================================================
   DÉTAIL ACTIVITÉ
   ============================================================ */

function showActivityDetail(activityId) {

  const activity =
    getActivityById(activityId);


  if (!activity) {
    return;
  }


  closeActivityDetail();


  const modal =
    document.createElement("div");


  modal.className =
    "modal active";


  modal.id =
    "activity-detail-modal";


  modal.style.zIndex =
    "1500";


  modal.innerHTML = `

    <div
      class="modal-content"
      style="max-width: 500px;"
    >

      <div class="modal-header">

        <h2>
          Détails de l'activité
        </h2>

        <button
          class="modal-close"
          type="button"
          onclick="closeActivityDetail()"
        >
          &times;
        </button>

      </div>


      <div class="modal-body">

        <h3>
          ${escapeHtml(activity.activite)}
        </h3>

        <div class="detail-row">

          <div class="detail-label">
            Date
          </div>

          <div class="detail-value">
            ${formatDateFr(activity.date)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Zone
          </div>

          <div class="detail-value">
            ${escapeHtml(activity.zone)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Niveau
          </div>

          <div class="detail-value">
            ${escapeHtml(activity.niveau)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Type élément
          </div>

          <div class="detail-value">
            ${escapeHtml(activity.typeElement)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Élément
          </div>

          <div class="detail-value">
            ${escapeHtml(activity.element)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Grue
          </div>

          <div class="detail-value">
            <strong>
              ${escapeHtml(activity.grue)}
            </strong>
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Horaires
          </div>

          <div class="detail-value">

            ${escapeHtml(activity.heureDebut)}
            -
            ${escapeHtml(activity.heureFin)}

          </div>

        </div>


        ${
          activity.heureLivraison
            ? `

              <div class="detail-row">

                <div class="detail-label">
                  Livraison
                </div>

                <div class="detail-value">
                  ${escapeHtml(
                    activity.heureLivraison
                  )}
                </div>

              </div>

            `
            : ""
        }


        <div
          style="
            margin-top: 1.5rem;
            display: flex;
            gap: 0.5rem;
          "
        >

          <button
            type="button"
            class="btn-primary"
            onclick="
              editActivity('${escapeJs(activity.id)}');
              closeActivityDetail();
            "
          >
            Éditer
          </button>


          <button
            type="button"
            class="btn-danger"
            onclick="
              deleteRow('${escapeJs(activity.id)}');
              closeActivityDetail();
            "
          >
            Supprimer
          </button>

        </div>

      </div>

    </div>
  `;


  document.body.appendChild(
    modal
  );
}


function closeActivityDetail() {

  const modal =
    document.getElementById(
      "activity-detail-modal"
    );


  if (modal) {
    modal.remove();
  }
}


/* ============================================================
   SAISIE RAPIDE
   ============================================================ */

function setQuickTime(
  hour,
  date,
  grue
) {

  const startTime =
    String(hour).padStart(
      2,
      "0"
    ) + ":00";


  const endTime =
    String(hour + 1).padStart(
      2,
      "0"
    ) + ":00";


  showActivityForm({

    date,

    grue,

    start: startTime,

    end: endTime
  });


  if (activityFormPanel) {

    activityFormPanel.scrollIntoView({
      behavior: "smooth"
    });
  }


  showMessage(
    `Saisie rapide avec ${grue} de ${startTime} à ${endTime}`,
    "info"
  );
}


/* ============================================================
   ============================================================
   PLAN LIDER / POWERPOINT
   ============================================================
   ============================================================ */


/*
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * Le JavaScript NE manipule PAS directement les fichiers.
 *
 * Il communique avec Electron via :
 *
 * window.electronAPI
 *
 * Electron est responsable de :
 *
 * - trouver le dossier Plan LIDER
 * - trouver le fichier maître
 * - sauvegarder PowerPoint
 * - créer les versions
 * - remplacer le fichier maître
 * - ouvrir le fichier maître
 *
 */


/* ============================================================
   VÉRIFIER ELECTRON
   ============================================================ */

function isElectronPowerPointAvailable() {

  return (
    window.electronAPI &&
    typeof window.electronAPI.openPowerPoint === "function" &&
    typeof window.electronAPI.savePowerPointVersion === "function"
  );
}


/* ============================================================
   OUVRIR LE PLAN LIDER
   ============================================================ */

async function openBundledPowerPoint() {

  try {

    if (
      !window.electronAPI ||
      typeof window.electronAPI.openPowerPoint !== "function"
    ) {

      showMessage(
        "L'interface Electron n'est pas disponible.",
        "error"
      );

      return;
    }


    showMessage(
      "Recherche de la dernière version du Plan LIDER...",
      "info"
    );


    /*
     * IMPORTANT :
     *
     * Cette fonction NE reçoit aucun nom de fichier.
     *
     * Electron doit lui-même :
     *
     * 1. déterminer le fichier maître ;
     * 2. vérifier qu'il correspond à la dernière version ;
     * 3. ouvrir ce fichier.
     *
     * Exemple :
     *
     * Plan_LIDER.pptx
     *
     * qui contient toujours la dernière version.
     */

    const result =
      await window.electronAPI.openPowerPoint();


    if (
      !result ||
      !result.success
    ) {

      showMessage(
        "Impossible d'ouvrir PowerPoint : " +
        (
          result?.error ||
          "Erreur inconnue."
        ),
        "error"
      );

      return;
    }


    console.log(
      "Plan LIDER ouvert :",
      result
    );


    const versionText =
      result.version
        ? ` Version ${result.version}.`
        : "";


    showMessage(
      `Le dernier Plan LIDER a été ouvert dans PowerPoint.${versionText}`,
      "success"
    );


  } catch (error) {

    console.error(
      "Erreur ouverture PowerPoint :",
      error
    );


    showMessage(
      "Erreur lors de l'ouverture du Plan LIDER.",
      "error"
    );
  }
}


/* ============================================================
   ENREGISTRER UNE NOUVELLE VERSION
   ============================================================ */

async function savePowerPointVersion() {

  try {

    if (
      !window.electronAPI ||
      typeof window.electronAPI.savePowerPointVersion !== "function"
    ) {

      showMessage(
        "L'interface Electron n'est pas disponible.",
        "error"
      );

      return;
    }


    /*
     * IMPORTANT
     * --------------------------------------------------------
     *
     * On demande à Electron de faire TOUT le processus :
     *
     * 1. sauvegarder le document actuellement ouvert ;
     *
     * 2. déterminer le prochain numéro :
     *
     *      v001
     *      v002
     *      v003
     *
     * 3. créer la nouvelle version dans :
     *
     *      Plan LIDER/versions/
     *
     * 4. mettre cette version à jour comme :
     *
     *      Plan LIDER/Plan_LIDER.pptx
     *
     * 5. retourner le numéro de version.
     *
     */


    showMessage(
      "Enregistrement de la nouvelle version...",
      "info"
    );


    const result =
      await window.electronAPI
        .savePowerPointVersion();


    if (
      !result ||
      !result.success
    ) {

      showMessage(
        "Impossible d'enregistrer la version : " +
        (
          result?.error ||
          "Erreur inconnue."
        ),
        "error"
      );

      return;
    }


    console.log(
      "Nouvelle version PowerPoint :",
      result
    );


    /*
     * Exemple de réponse Electron :
     *
     * {
     *   success: true,
     *   version: "v003",
     *   filename: "Plan_LIDER_v003.pptx"
     * }
     */


    const filename =
      result.filename ||
      "nouvelle version";


    const version =
      result.version ||
      "";


    showMessage(
      `Nouvelle version enregistrée : ${filename}${version ? ` (${version})` : ""}. Le fichier maître est maintenant à jour.`,
      "success"
    );


    /*
     * Recharge la liste des versions
     */

    await loadPowerPointVersions();


  } catch (error) {

    console.error(
      "Erreur sauvegarde PowerPoint :",
      error
    );


    showMessage(
      "Erreur lors de la sauvegarde de la nouvelle version.",
      "error"
    );
  }
}


/* ============================================================
   LISTER LES VERSIONS POWERPOINT
   ============================================================ */

async function loadPowerPointVersions() {

  const container =
    document.getElementById(
      "powerpoint-versions"
    );


  if (!container) {
    return;
  }


  if (
    !window.electronAPI ||
    typeof window.electronAPI.listPowerPointVersions !== "function"
  ) {

    container.innerHTML = `
      <p>
        L'interface Electron n'est pas disponible.
      </p>
    `;

    return;
  }


  try {

    container.innerHTML = `
      <p>
        Chargement des versions...
      </p>
    `;


    const result =
      await window.electronAPI
        .listPowerPointVersions();


    if (
      !result ||
      !result.success
    ) {

      container.innerHTML = `
        <p>
          Impossible de charger les versions.
        </p>
      `;

      return;
    }


    const versions =
      result.versions || [];


    if (versions.length === 0) {

      container.innerHTML = `
        <p style="opacity: 0.7;">
          Aucune version enregistrée.
        </p>
      `;

      return;
    }


    container.innerHTML = "";


    /*
     * Les versions doivent être fournies par Electron
     * dans l'ordre décroissant.
     */

    versions.forEach(
      version => {

        const wrapper =
          document.createElement("div");


        wrapper.className =
          "powerpoint-version";


        wrapper.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
        `;


        const date =
          version.modified
            ? new Date(
                version.modified
              ).toLocaleString(
                "fr-FR"
              )
            : "";


        const size =
          version.size
            ? (
                version.size /
                1024 /
                1024
              ).toFixed(2)
            : "0";


        const info =
          document.createElement("div");


        info.innerHTML = `

          <strong>
            ${escapeHtml(version.name)}
          </strong>

          <div
            style="
              font-size: 0.85rem;
              opacity: 0.7;
              margin-top: 0.25rem;
            "
          >

            ${escapeHtml(date)}

            -

            ${size} Mo

          </div>
        `;


        const button =
          document.createElement("button");


        button.type =
          "button";


        button.className =
          "btn-secondary";


        button.textContent =
          "Ouvrir";


        button.addEventListener(
          "click",
          () => {

            openPowerPointVersion(
              version.name
            );

          }
        );


        wrapper.appendChild(
          info
        );


        wrapper.appendChild(
          button
        );


        container.appendChild(
          wrapper
        );
      }
    );


  } catch (error) {

    console.error(
      "Erreur chargement versions :",
      error
    );


    container.innerHTML = `
      <p>
        Erreur lors du chargement des versions.
      </p>
    `;
  }
}


/* ============================================================
   OUVRIR UNE VERSION HISTORIQUE
   ============================================================ */

async function openPowerPointVersion(
  filename
) {

  try {

    if (
      !window.electronAPI ||
      typeof window.electronAPI.openPowerPointVersion !== "function"
    ) {

      showMessage(
        "L'interface Electron n'est pas disponible.",
        "error"
      );

      return;
    }


    if (!filename) {

      showMessage(
        "Nom de fichier invalide.",
        "error"
      );

      return;
    }


    /*
     * Sécurité supplémentaire :
     *
     * On n'accepte ici qu'un nom de fichier,
     * jamais un chemin complet fourni par la page.
     */

    if (
      filename.includes("/") ||
      filename.includes("\\") ||
      filename.includes("..")
    ) {

      showMessage(
        "Nom de fichier invalide.",
        "error"
      );

      return;
    }


    const result =
      await window.electronAPI
        .openPowerPointVersion(
          filename
        );


    if (
      !result ||
      !result.success
    ) {

      showMessage(
        "Impossible d'ouvrir cette version : " +
        (
          result?.error ||
          "Erreur inconnue."
        ),
        "error"
      );

      return;
    }


    showMessage(
      `${filename} a été ouvert dans PowerPoint.`,
      "success"
    );


    console.log(
      "Version historique ouverte :",
      result
    );


  } catch (error) {

    console.error(
      "Erreur ouverture version :",
      error
    );


    showMessage(
      "Erreur lors de l'ouverture de la version.",
      "error"
    );
  }
}


/* ============================================================
   CHARGER PAGE PLAN LIDER
   ============================================================ */

async function loadPowerPoint() {

  if (!planLiderViewer) {
    return;
  }


  planLiderViewer.innerHTML = `

    <div
      style="
        padding: 2rem;
        text-align: center;
      "
    >

      <div class="plan-lider-icon">
        PPT
      </div>

      <h2>
        Plan LIDER
      </h2>

      <p>
        Gestion du fichier PowerPoint
      </p>

      <p
        style="
          max-width: 700px;
          margin: 1rem auto;
          opacity: 0.8;
        "
      >
        Le fichier ouvert par défaut correspond toujours
        à la dernière version enregistrée.
        Les anciennes versions restent conservées
        dans l'historique.
      </p>


      <div
        style="
          margin-top: 1.5rem;
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        "
      >

        <button
          type="button"
          id="open-bundled-powerpoint"
          class="btn-primary"
        >
          Ouvrir le dernier Plan LIDER
        </button>


        <button
          type="button"
          id="save-powerpoint-version"
          class="btn-primary"
        >
          Enregistrer une nouvelle version
        </button>

      </div>


      <div
        style="
          margin-top: 2rem;
          text-align: left;
        "
      >

        <h3>
          Versions enregistrées
        </h3>


        <div
          id="powerpoint-versions"
          style="
            margin-top: 1rem;
          "
        >
          Chargement...
        </div>

      </div>

    </div>

  `;


  const openButton =
    document.getElementById(
      "open-bundled-powerpoint"
    );


  const saveButton =
    document.getElementById(
      "save-powerpoint-version"
    );


  if (openButton) {

    openButton.addEventListener(
      "click",
      openBundledPowerPoint
    );
  }


  if (saveButton) {

    saveButton.addEventListener(
      "click",
      savePowerPointVersion
    );
  }


  await loadPowerPointVersions();
}


/* ============================================================
   RESET PLANNING
   ============================================================ */

if (resetPlanningBtn) {

  resetPlanningBtn.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Voulez-vous vraiment réinitialiser le planning ? Toutes les activités enregistrées seront supprimées."
        );


      if (!confirmed) {
        return;
      }


      resetActivities();


      refreshActivitiesTable();

      refreshCalendar();


      if (planningContent) {
        loadPlanning();
      }


      showMessage(
        "Le planning a été réinitialisé.",
        "success"
      );
    }
  );
}


/* ============================================================
   INITIALISATION
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (calendarDateInput) {

      if (!calendarDateInput.value) {

        calendarDateInput.value =
          getTodayISO();
      }
    }


    refreshCalendar();

    refreshActivitiesTable();


    if (planningContent) {
      loadPlanning();
    }


    if (planLiderPage) {

      console.log(
        "Module Plan LIDER initialisé."
      );
    }
  }
);


/* ============================================================
   UTILITAIRES
   ============================================================ */

function timeToMinutes(time) {

  if (
    typeof time !== "string"
  ) {
    return NaN;
  }


  const parts =
    time.split(":");


  if (parts.length !== 2) {
    return NaN;
  }


  const hours =
    Number(parts[0]);


  const minutes =
    Number(parts[1]);


  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {

    return NaN;
  }


  return (
    hours * 60 +
    minutes
  );
}


function getTodayISO() {

  const date =
    new Date();


  return dateToISO(date);
}


function dateToISO(date) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;
}


function formatDateFr(dateString) {

  if (
    !dateString ||
    typeof dateString !== "string"
  ) {
    return "";
  }


  const parts =
    dateString.split("-");


  if (parts.length !== 3) {
    return dateString;
  }


  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";
  }


  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );
}


function escapeJs(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  return String(value)

    .replace(
      /\\/g,
      "\\\\"
    )

    .replace(
      /'/g,
      "\\'"
    )

    .replace(
      /"/g,
      '\\"'
    )

    .replace(
      /\r/g,
      "\\r"
    )

    .replace(
      /\n/g,
      "\\n"
    );
}


/* ============================================================
   EXPORTS GLOBAUX
   ============================================================ */

window.editActivity =
  editActivity;

window.deleteRow =
  deleteRow;

window.showActivityDetail =
  showActivityDetail;

window.closeActivityDetail =
  closeActivityDetail;

window.setQuickTime =
  setQuickTime;

window.applyFilters =
  applyFilters;

window.clearFilters =
  clearFilters;

window.showActivityForm =
  showActivityForm;

window.hideActivityForm =
  hideActivityForm;

window.loadPlanning =
  loadPlanning;

window.refreshCalendar =
  refreshCalendar;


/* ============================================================
   EXPORTS POWERPOINT
   ============================================================ */

window.openBundledPowerPoint =
  openBundledPowerPoint;

window.savePowerPointVersion =
  savePowerPointVersion;

window.loadPowerPointVersions =
  loadPowerPointVersions;

window.openPowerPointVersion =
  openPowerPointVersion;