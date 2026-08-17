/**
 * Convertir une heure au format HH:MM en minutes depuis minuit
 * @param {string} time - Heure au format HH:MM
 * @returns {number} Nombre de minutes depuis minuit
 */
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Vérifier si deux créneaux horaires se chevauchent
 * @param {number} start1 - Heure début 1 en minutes
 * @param {number} end1 - Heure fin 1 en minutes
 * @param {number} start2 - Heure début 2 en minutes
 * @param {number} end2 - Heure fin 2 en minutes
 * @returns {boolean} true si chevauchement
 */
function hoursOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * Trouver tous les conflits pour une nouvelle activité
 * @param {Object} newActivity - L'activité à ajouter
 * @returns {Array} Tableau des conflits trouvés
 */
function findConflicts(newActivity) {
  const conflicts = [];
  const existingActivities = getActivitiesForCraneOnDate(
    newActivity.date,
    newActivity.grue
  );

  const newStart = timeToMinutes(newActivity.heureDebut);
  const newEnd = timeToMinutes(newActivity.heureFin);

  existingActivities.forEach(existing => {
    const existingStart = timeToMinutes(existing.heureDebut);
    const existingEnd = timeToMinutes(existing.heureFin);

    if (hoursOverlap(newStart, newEnd, existingStart, existingEnd)) {
      conflicts.push({
        existing: existing,
        message: `Conflit avec "${existing.activite}" (${existing.element}) de ${existing.heureDebut} à ${existing.heureFin}`
      });
    }
  });

  return conflicts;
}

/**
 * Vérifier s'il y a des conflits pour une activité
 * @param {Object} activity - L'activité à vérifier
 * @returns {boolean} true s'il y a des conflits
 */
function hasConflict(activity) {
  return findConflicts(activity).length > 0;
}

/**
 * Trouver les conflits lors d'une mise à jour (ignore l'activité elle-même)
 * @param {Object} updatedActivity - L'activité mise à jour
 * @returns {Array} Tableau des conflits trouvés
 */
function findConflictsOnUpdate(updatedActivity) {
  const conflicts = [];
  const existingActivities = getActivitiesForCraneOnDate(
    updatedActivity.date,
    updatedActivity.grue
  );

  const newStart = timeToMinutes(updatedActivity.heureDebut);
  const newEnd = timeToMinutes(updatedActivity.heureFin);

  existingActivities.forEach(existing => {
    // Ignorer l'activité elle-même
    if (existing.id === updatedActivity.id) return;

    const existingStart = timeToMinutes(existing.heureDebut);
    const existingEnd = timeToMinutes(existing.heureFin);

    if (hoursOverlap(newStart, newEnd, existingStart, existingEnd)) {
      conflicts.push({
        existing: existing,
        message: `Conflit avec "${existing.activite}" de ${existing.heureDebut} à ${existing.heureFin}`
      });
    }
  });

  return conflicts;
}

/**
 * Obtenir tous les créneaux occupés d'une grue à une date donnée
 * Utile pour la visualisation du planning
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {string} grue - Numéro de la grue
 * @returns {Array} Tableau des créneaux occupés
 */
function getOccupiedSlots(date, grue) {
  const activities = getActivitiesForCraneOnDate(date, grue);
  return activities.map(a => ({
    start: timeToMinutes(a.heureDebut),
    end: timeToMinutes(a.heureFin),
    activity: a
  }));
}
/**
 * =======================================
 * GESTION DES DONNÉES - localStorage
 * =======================================
 * Gère toutes les opérations CRUD pour les activités de levage
 * Stockage en localStorage avec clé "crane_activities"
 */

const STORAGE_KEY = "crane_activities";

/**
 * Modèle de données pour une activité
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
 * Charger toutes les activités depuis localStorage
 * @returns {Array} Tableau d'activités
 */
function loadActivities() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Erreur lors du chargement des activités:", error);
    return [];
  }
}

/**
 * Sauvegarder les activités dans localStorage
 * @param {Array} activities - Tableau d'activités à sauvegarder
 */
function saveActivities(activities) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des activités:", error);
  }
}

/**
 * Créer une nouvelle activité avec les données du formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Activité créée
 */
function createActivity(formData) {
  const activity = { ...activityTemplate };
  activity.id = "ACT_" + Date.now();
  activity.date = formData.date;
  activity.zone = formData.zone;
  activity.activite = formData.activite;
  activity.niveau = formData.niveau;
  activity.typeElement = formData.typeElement;
  activity.element = formData.element;
  activity.grue = formData.grue;
  activity.heureDebut = formData.heureDebut;
  activity.heureFin = formData.heureFin;
  activity.heureLivraison = formData.heureLivraison || "";
  activity.dateCreation = new Date().toISOString();
  return activity;
}

/**
 * Ajouter une nouvelle activité
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Activité ajoutée
 */
function addActivity(formData) {
  const activities = loadActivities();
  const activity = createActivity(formData);
  activities.push(activity);
  saveActivities(activities);
  return activity;
}

/**
 * Récupérer une activité par son ID
 * @param {string} id - ID de l'activité
 * @returns {Object|null} Activité trouvée ou null
 */
function getActivityById(id) {
  const activities = loadActivities();
  return activities.find(a => a.id === id) || null;
}

/**
 * Mettre à jour une activité
 * @param {string} id - ID de l'activité
 * @param {Object} updatedData - Données mises à jour
 * @returns {Object|null} Activité mise à jour ou null
 */
function updateActivity(id, updatedData) {
  const activities = loadActivities();
  const index = activities.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  activities[index] = { ...activities[index], ...updatedData };
  saveActivities(activities);
  return activities[index];
}

/**
 * Supprimer une activité
 * @param {string} id - ID de l'activité
 * @returns {boolean} true si supprimée, false sinon
 */
function deleteActivity(id) {
  const activities = loadActivities();
  const filteredActivities = activities.filter(a => a.id !== id);
  
  if (filteredActivities.length === activities.length) return false;
  
  saveActivities(filteredActivities);
  return true;
}

/**
 * Récupérer toutes les activités
 * @returns {Array} Tableau d'activités
 */
function getAllActivities() {
  return loadActivities();
}

/**
 * Filtrer les activités selon les critères
 * @param {Object} criteria - Critères de filtre
 * @returns {Array} Activités filtrées
 */
function filterActivities(criteria) {
  let activities = loadActivities();
  
  if (criteria.date) {
    activities = activities.filter(a => a.date === criteria.date);
  }
  if (criteria.zone) {
    activities = activities.filter(a => a.zone === criteria.zone);
  }
  if (criteria.grue) {
    activities = activities.filter(a => a.grue === criteria.grue);
  }
  if (criteria.activite) {
    activities = activities.filter(a => a.activite === criteria.activite);
  }
  
  return activities;
}

/**
 * Récupérer les activités d'une grue à une date donnée
 * Utile pour la détection des conflits
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {string} grue - Numéro de la grue
 * @returns {Array} Activités de cette grue ce jour
 */
function getActivitiesForCraneOnDate(date, grue) {
  return loadActivities().filter(a => a.date === date && a.grue === grue);
}
/**
 * Réinitialiser complètement le planning en mémoire
 * @returns {void}
 */
function resetActivities() {
  saveActivities([]);
}