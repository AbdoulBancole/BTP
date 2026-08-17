/**
 * =======================================
 * GESTION DES DONNÉES - localStorage
 * =======================================
 *
 * Stockage des activités dans localStorage.
 *
 * Clé utilisée :
 * "crane_activities"
 */

const STORAGE_KEY = "crane_activities";

/**
 * =======================================
 * MODÈLE D'UNE ACTIVITÉ
 * =======================================
 */

const activityTemplate = {
  id: "",
  date: "",
  zone: "",
  activite: "",
  niveau: "",
  typeElement: "",
  element: "",
  grue: "",
  heureDebut: "",
  heureFin: "",
  heureLivraison: "",
  dateCreation: ""
};


/**
 * =======================================
 * CHARGER LES ACTIVITÉS
 * =======================================
 */

function loadActivities() {

  try {

    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    const activities = JSON.parse(data);

    // Sécurité : on vérifie que c'est bien un tableau
    if (!Array.isArray(activities)) {
      console.warn("Les données du planning ne sont pas un tableau.");
      return [];
    }

    return activities;

  } catch (error) {

    console.error(
      "Erreur lors du chargement des activités :",
      error
    );

    return [];
  }
}


/**
 * =======================================
 * SAUVEGARDER LES ACTIVITÉS
 * =======================================
 */

function saveActivities(activities) {

  try {

    if (!Array.isArray(activities)) {
      console.error(
        "saveActivities() attend un tableau."
      );
      return false;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(activities)
    );

    return true;

  } catch (error) {

    console.error(
      "Erreur lors de la sauvegarde des activités :",
      error
    );

    return false;
  }
}


/**
 * =======================================
 * CRÉER UNE ACTIVITÉ
 * =======================================
 */

function createActivity(formData) {

  const activity = {
    ...activityTemplate
  };

  activity.id =
    "ACT_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .substring(2, 8);

  activity.date =
    formData.date || "";

  activity.zone =
    formData.zone || "";

  activity.activite =
    formData.activite || "";

  activity.niveau =
    formData.niveau || "";

  activity.typeElement =
    formData.typeElement || "";

  activity.element =
    formData.element || "";

  activity.grue =
    formData.grue || "";

  activity.heureDebut =
    formData.heureDebut || "";

  activity.heureFin =
    formData.heureFin || "";

  activity.heureLivraison =
    formData.heureLivraison || "";

  activity.dateCreation =
    new Date().toISOString();

  return activity;
}


/**
 * =======================================
 * AJOUTER UNE ACTIVITÉ
 * =======================================
 */

function addActivity(formData) {

  const activities =
    loadActivities();

  const activity =
    createActivity(formData);

  activities.push(activity);

  const saved =
    saveActivities(activities);

  if (!saved) {
    return null;
  }

  return activity;
}


/**
 * =======================================
 * RÉCUPÉRER UNE ACTIVITÉ PAR ID
 * =======================================
 */

function getActivityById(id) {

  const activities =
    loadActivities();

  return (
    activities.find(
      activity => activity.id === id
    ) || null
  );
}


/**
 * =======================================
 * METTRE À JOUR UNE ACTIVITÉ
 * =======================================
 */

function updateActivity(id, updatedData) {

  const activities =
    loadActivities();

  const index =
    activities.findIndex(
      activity => activity.id === id
    );

  if (index === -1) {

    console.warn(
      "Activité introuvable :",
      id
    );

    return null;
  }

  activities[index] = {
    ...activities[index],
    ...updatedData
  };

  const saved =
    saveActivities(activities);

  if (!saved) {
    return null;
  }

  return activities[index];
}


/**
 * =======================================
 * SUPPRIMER UNE ACTIVITÉ
 * =======================================
 */

function deleteActivity(id) {

  const activities =
    loadActivities();

  const filteredActivities =
    activities.filter(
      activity => activity.id !== id
    );

  if (
    filteredActivities.length ===
    activities.length
  ) {

    return false;
  }

  const saved =
    saveActivities(filteredActivities);

  return saved;
}


/**
 * =======================================
 * RÉCUPÉRER TOUTES LES ACTIVITÉS
 * =======================================
 */

function getAllActivities() {

  return loadActivities();
}


/**
 * =======================================
 * FILTRER LES ACTIVITÉS
 * =======================================
 */

function filterActivities(criteria = {}) {

  let activities =
    loadActivities();

  if (criteria.date) {

    activities =
      activities.filter(
        activity =>
          activity.date === criteria.date
      );
  }

  if (criteria.zone) {

    activities =
      activities.filter(
        activity =>
          activity.zone === criteria.zone
      );
  }

  if (criteria.grue) {

    activities =
      activities.filter(
        activity =>
          activity.grue === criteria.grue
      );
  }

  if (criteria.activite) {

    activities =
      activities.filter(
        activity =>
          activity.activite === criteria.activite
      );
  }

  return activities;
}


/**
 * =======================================
 * ACTIVITÉS D'UNE GRUE À UNE DATE
 * =======================================
 */

function getActivitiesForCraneOnDate(
  date,
  grue
) {

  return loadActivities().filter(
    activity =>
      activity.date === date &&
      activity.grue === grue
  );
}


/**
 * =======================================
 * RÉINITIALISER LE PLANNING
 * =======================================
 */

function resetActivities() {

  return saveActivities([]);
}


/**
 * =======================================
 * UTILITAIRES HEURE
 * =======================================
 */

/**
 * Convertir HH:MM en minutes.
 */

function timeToMinutes(time) {

  if (!time || !time.includes(":")) {
    return NaN;
  }

  const [
    hours,
    minutes
  ] =
    time.split(":").map(Number);

  return (
    hours * 60 +
    minutes
  );
}


/**
 * Vérifier le chevauchement
 * entre deux créneaux.
 */

function hoursOverlap(
  start1,
  end1,
  start2,
  end2
) {

  return (
    start1 < end2 &&
    start2 < end1
  );
}


/**
 * =======================================
 * CONFLITS - NOUVELLE ACTIVITÉ
 * =======================================
 */

function findConflicts(newActivity) {

  const conflicts = [];

  const existingActivities =
    getActivitiesForCraneOnDate(
      newActivity.date,
      newActivity.grue
    );

  const newStart =
    timeToMinutes(
      newActivity.heureDebut
    );

  const newEnd =
    timeToMinutes(
      newActivity.heureFin
    );

  if (
    Number.isNaN(newStart) ||
    Number.isNaN(newEnd)
  ) {

    return conflicts;
  }

  existingActivities.forEach(
    existing => {

      const existingStart =
        timeToMinutes(
          existing.heureDebut
        );

      const existingEnd =
        timeToMinutes(
          existing.heureFin
        );

      if (
        hoursOverlap(
          newStart,
          newEnd,
          existingStart,
          existingEnd
        )
      ) {

        conflicts.push({

          existing,

          message:
            `Conflit avec "${existing.activite}" ` +
            `(${existing.element}) ` +
            `de ${existing.heureDebut} ` +
            `à ${existing.heureFin}`
        });
      }
    }
  );

  return conflicts;
}


/**
 * =======================================
 * VÉRIFIER S'IL EXISTE UN CONFLIT
 * =======================================
 */

function hasConflict(activity) {

  return (
    findConflicts(activity).length > 0
  );
}


/**
 * =======================================
 * CONFLITS - MODIFICATION
 * =======================================
 *
 * On ignore l'activité actuellement modifiée.
 */

function findConflictsOnUpdate(
  updatedActivity
) {

  const conflicts = [];

  const existingActivities =
    getActivitiesForCraneOnDate(
      updatedActivity.date,
      updatedActivity.grue
    );

  const newStart =
    timeToMinutes(
      updatedActivity.heureDebut
    );

  const newEnd =
    timeToMinutes(
      updatedActivity.heureFin
    );

  if (
    Number.isNaN(newStart) ||
    Number.isNaN(newEnd)
  ) {

    return conflicts;
  }

  existingActivities.forEach(
    existing => {

      // Ne pas comparer l'activité avec elle-même
      if (
        existing.id ===
        updatedActivity.id
      ) {

        return;
      }

      const existingStart =
        timeToMinutes(
          existing.heureDebut
        );

      const existingEnd =
        timeToMinutes(
          existing.heureFin
        );

      if (
        hoursOverlap(
          newStart,
          newEnd,
          existingStart,
          existingEnd
        )
      ) {

        conflicts.push({

          existing,

          message:
            `Conflit avec "${existing.activite}" ` +
            `(${existing.element}) ` +
            `de ${existing.heureDebut} ` +
            `à ${existing.heureFin}`
        });
      }
    }
  );

  return conflicts;
}


/**
 * =======================================
 * CRÉNEAUX OCCUPÉS
 * =======================================
 */

function getOccupiedSlots(
  date,
  grue
) {

  const activities =
    getActivitiesForCraneOnDate(
      date,
      grue
    );

  return activities.map(
    activity => ({

      start:
        timeToMinutes(
          activity.heureDebut
        ),

      end:
        timeToMinutes(
          activity.heureFin
        ),

      activity
    })
  );
}