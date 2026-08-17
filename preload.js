/**
 * ============================================================
 * PRELOAD - ELECTRON
 * ============================================================
 */

const {
    contextBridge,
    ipcRenderer
} = require("electron");


contextBridge.exposeInMainWorld(
    "electronAPI",
    {

        /* ====================================================
           OUVRIR LA DERNIÈRE VERSION
           ==================================================== */

        openPowerPoint:
            () => {

                return ipcRenderer.invoke(
                    "open-powerpoint"
                );
            },


        /* ====================================================
           ENREGISTRER UNE NOUVELLE VERSION
           ==================================================== */

        savePowerPointVersion:
            () => {

                return ipcRenderer.invoke(
                    "save-powerpoint-version"
                );
            },


        /* ====================================================
           LISTER LES VERSIONS
           ==================================================== */

        listPowerPointVersions:
            () => {

                return ipcRenderer.invoke(
                    "list-powerpoint-versions"
                );
            },


        /* ====================================================
           OUVRIR UNE VERSION PRÉCISE
           ==================================================== */

        openPowerPointVersion:
            filename => {

                return ipcRenderer.invoke(
                    "open-powerpoint-version",
                    filename
                );
            }
    }
);