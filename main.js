/**
 * ============================================================
 * MAIN PROCESS - ELECTRON
 * ============================================================
 *
 * Gestion :
 * - Fenêtre Electron
 * - Plan LIDER PowerPoint
 * - Versions v001, v002, v003...
 * - Ouverture automatique de la dernière version
 * - Création d'une nouvelle version à partir du fichier
 *   actuellement utilisé
 *
 * ============================================================
 */

const {
    app,
    BrowserWindow,
    ipcMain,
    shell
} = require("electron");

const path = require("path");
const fs = require("fs");


/* ============================================================
   FENÊTRE PRINCIPALE
   ============================================================ */

let mainWindow = null;


function createWindow() {

    mainWindow = new BrowserWindow({

        width: 1400,

        height: 900,

        webPreferences: {

            preload: path.join(
                __dirname,
                "preload.js"
            ),

            contextIsolation: true,

            nodeIntegration: false
        }
    });


    mainWindow.loadFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

    /*
     * Debug :
     *
     * mainWindow.webContents.openDevTools();
     */
}


/* ============================================================
   INITIALISATION ELECTRON
   ============================================================ */

app.whenReady().then(() => {

    createWindow();


    app.on(
        "activate",
        () => {

            if (
                BrowserWindow
                    .getAllWindows()
                    .length === 0
            ) {

                createWindow();
            }
        }
    );
});


app.on(
    "window-all-closed",
    () => {

        if (
            process.platform !== "darwin"
        ) {

            app.quit();
        }
    }
);


/* ============================================================
   PLAN LIDER
   ============================================================ */

const POWERPOINT_DIRECTORY =
    path.join(
        __dirname,
        "plan-lider"
    );


/*
 * Fichier PowerPoint original.
 *
 * Celui-ci ne doit jamais être écrasé.
 */

const INITIAL_POWERPOINT_FILENAME =
    "Plan_Leader.pptx";


/* ============================================================
   DOSSIER
   ============================================================ */

function ensurePowerPointDirectory() {

    if (
        !fs.existsSync(
            POWERPOINT_DIRECTORY
        )
    ) {

        fs.mkdirSync(
            POWERPOINT_DIRECTORY,
            {
                recursive: true
            }
        );
    }
}


/* ============================================================
   EXTRAIRE NUMÉRO VERSION
   ============================================================ */

function getPowerPointVersionNumber(
    filename
) {

    if (
        typeof filename !== "string"
    ) {

        return null;
    }


    const match =
        filename.match(
            /^Plan_Leader_v(\d+)\.pptx$/i
        );


    if (!match) {

        return null;
    }


    return Number(
        match[1]
    );
}


/* ============================================================
   RÉCUPÉRER TOUTES LES VERSIONS
   ============================================================ */

function getPowerPointVersions() {

    ensurePowerPointDirectory();


    const files =
        fs.readdirSync(
            POWERPOINT_DIRECTORY
        );


    return files

        .map(
            filename => {

                const version =
                    getPowerPointVersionNumber(
                        filename
                    );


                if (
                    version === null
                ) {

                    return null;
                }


                const fullPath =
                    path.join(
                        POWERPOINT_DIRECTORY,
                        filename
                    );


                try {

                    const stats =
                        fs.statSync(
                            fullPath
                        );


                    return {

                        name:
                            filename,

                        version:
                            version,

                        path:
                            fullPath,

                        size:
                            stats.size,

                        modified:
                            stats.mtimeMs
                    };

                } catch (error) {

                    return null;
                }
            }
        )

        .filter(Boolean)

        .sort(
            (a, b) =>
                b.version -
                a.version
        );
}


/* ============================================================
   DERNIÈRE VERSION
   ============================================================ */

function getLatestPowerPoint() {

    const versions =
        getPowerPointVersions();


    if (
        versions.length === 0
    ) {

        return null;
    }


    return versions[0];
}


/* ============================================================
   PROCHAINE VERSION
   ============================================================ */

/*
 * IMPORTANT :
 *
 * On ne fait PAS simplement :
 *
 * latest.version + 1
 *
 * On regarde toutes les versions existantes.
 *
 * Cela évite les problèmes si un fichier a été supprimé.
 *
 */

function getNextPowerPointVersionNumber() {

    const versions =
        getPowerPointVersions();


    if (
        versions.length === 0
    ) {

        return 1;
    }


    const maxVersion =
        Math.max(
            ...versions.map(
                version =>
                    version.version
            )
        );


    return maxVersion + 1;
}


/* ============================================================
   NOM D'UNE VERSION
   ============================================================ */

function buildPowerPointVersionName(
    version
) {

    return (
        "Plan_Leader_v" +
        String(version)
            .padStart(3, "0") +
        ".pptx"
    );
}


/* ============================================================
   CRÉER V001 SI AUCUNE VERSION
   ============================================================ */

function ensureInitialPowerPointVersion() {

    ensurePowerPointDirectory();


    const latest =
        getLatestPowerPoint();


    /*
     * Une version existe déjà.
     */

    if (latest) {

        return latest;
    }


    /*
     * Aucun fichier versionné.
     */

    const initialPath =
        path.join(
            POWERPOINT_DIRECTORY,
            INITIAL_POWERPOINT_FILENAME
        );


    if (
        !fs.existsSync(
            initialPath
        )
    ) {

        return null;
    }


    /*
     * Créer V001.
     */

    const firstVersionPath =
        path.join(
            POWERPOINT_DIRECTORY,
            "Plan_Leader_v001.pptx"
        );


    /*
     * Si V001 n'existe pas,
     * on le crée.
     */

    if (
        !fs.existsSync(
            firstVersionPath
        )
    ) {

        fs.copyFileSync(
            initialPath,
            firstVersionPath
        );
    }


    const stats =
        fs.statSync(
            firstVersionPath
        );


    return {

        name:
            "Plan_Leader_v001.pptx",

        version:
            1,

        path:
            firstVersionPath,

        size:
            stats.size,

        modified:
            stats.mtimeMs
    };
}


/* ============================================================
   COPIE ROBUSTE
   ============================================================ */

function copyPowerPointFile(
    source,
    destination
) {

    if (
        !fs.existsSync(source)
    ) {

        throw new Error(
            "Fichier source introuvable : " +
            source
        );
    }


    /*
     * Copie du fichier.
     */

    fs.copyFileSync(
        source,
        destination
    );


    /*
     * Vérification.
     */

    if (
        !fs.existsSync(destination)
    ) {

        throw new Error(
            "La copie du fichier PowerPoint a échoué."
        );
    }


    /*
     * Vérification supplémentaire
     * de la taille.
     */

    const sourceStats =
        fs.statSync(source);


    const destinationStats =
        fs.statSync(destination);


    if (
        sourceStats.size !==
        destinationStats.size
    ) {

        throw new Error(
            "La copie du PowerPoint est incomplète."
        );
    }
}


/* ============================================================
   IPC :
   OUVRIR LA DERNIÈRE VERSION
   ============================================================ */

ipcMain.handle(
    "open-powerpoint",
    async () => {

        try {

            /*
             * S'il n'existe aucune version,
             * créer V001 depuis le fichier original.
             */

            const latest =
                ensureInitialPowerPointVersion();


            if (!latest) {

                return {

                    success: false,

                    error:
                        "Aucun fichier PowerPoint trouvé. Placez Plan_Leader.pptx dans le dossier plan-lider."
                };
            }


            if (
                !fs.existsSync(
                    latest.path
                )
            ) {

                return {

                    success: false,

                    error:
                        "Le fichier PowerPoint actuel est introuvable."
                };
            }


            console.log(
                "========================================"
            );

            console.log(
                "OUVERTURE PLAN LIDER"
            );

            console.log(
                "Version :",
                latest.version
            );

            console.log(
                "Fichier :",
                latest.path
            );

            console.log(
                "========================================"
            );


            const error =
                await shell.openPath(
                    latest.path
                );


            if (error) {

                return {

                    success: false,

                    error: error
                };
            }


            return {

                success: true,

                path:
                    latest.path,

                filename:
                    latest.name,

                version:
                    latest.version
            };


        } catch (error) {

            console.error(
                "Erreur open-powerpoint :",
                error
            );


            return {

                success: false,

                error:
                    error.message
            };
        }
    }
);


/* ============================================================
   IPC :
   ENREGISTRER UNE NOUVELLE VERSION
   ============================================================ */

ipcMain.handle(
    "save-powerpoint-version",
    async () => {

        try {

            ensurePowerPointDirectory();


            /*
             * Récupérer la dernière version existante.
             */

            const current =
                getLatestPowerPoint();


            if (!current) {

                /*
                 * Si aucune version n'existe,
                 * créer V001.
                 */

                const initial =
                    ensureInitialPowerPointVersion();


                if (!initial) {

                    return {

                        success: false,

                        error:
                            "Aucun fichier PowerPoint disponible."
                    };
                }


                return {

                    success: true,

                    version:
                        initial.version,

                    filename:
                        initial.name,

                    path:
                        initial.path,

                    size:
                        initial.size,

                    modified:
                        initial.modified
                };
            }


            /*
             * Vérifier que le fichier actuel existe.
             */

            if (
                !fs.existsSync(
                    current.path
                )
            ) {

                return {

                    success: false,

                    error:
                        "Le fichier PowerPoint actuel est introuvable."
                };
            }


            /*
             * IMPORTANT
             *
             * Le fichier actuellement ouvert
             * dans PowerPoint est "current.path".
             *
             * L'utilisateur doit avoir fait :
             *
             * Ctrl + S
             *
             * avant de cliquer sur :
             *
             * Enregistrer une nouvelle version.
             *
             * On copie donc CE fichier.
             */


            console.log(
                "========================================"
            );

            console.log(
                "CRÉATION NOUVELLE VERSION"
            );

            console.log(
                "Version actuelle :",
                current.version
            );

            console.log(
                "Source :",
                current.path
            );


            /*
             * Déterminer le prochain numéro
             * disponible.
             */

            const nextVersion =
                getNextPowerPointVersionNumber();


            const nextFilename =
                buildPowerPointVersionName(
                    nextVersion
                );


            const nextPath =
                path.join(
                    POWERPOINT_DIRECTORY,
                    nextFilename
                );


            console.log(
                "Nouvelle version :",
                nextFilename
            );


            /*
             * Sécurité :
             * ne jamais écraser une version existante.
             */

            if (
                fs.existsSync(
                    nextPath
                )
            ) {

                return {

                    success: false,

                    error:
                        `La version ${nextFilename} existe déjà.`
                };
            }


            /*
             * COPIE.
             */

            copyPowerPointFile(
                current.path,
                nextPath
            );


            /*
             * Vérification finale.
             */

            const stats =
                fs.statSync(
                    nextPath
                );


            console.log(
                "Nouvelle version créée :",
                nextPath
            );

            console.log(
                "Taille :",
                stats.size
            );

            console.log(
                "========================================"
            );


            return {

                success: true,

                version:
                    nextVersion,

                filename:
                    nextFilename,

                path:
                    nextPath,

                size:
                    stats.size,

                modified:
                    stats.mtimeMs
            };


        } catch (error) {

            console.error(
                "========================================"
            );

            console.error(
                "ERREUR SAUVEGARDE VERSION"
            );

            console.error(
                error
            );

            console.error(
                "========================================"
            );


            return {

                success: false,

                error:
                    error.message
            };
        }
    }
);


/* ============================================================
   IPC :
   LISTER LES VERSIONS
   ============================================================ */

ipcMain.handle(
    "list-powerpoint-versions",
    async () => {

        try {

            const versions =
                getPowerPointVersions();


            return {

                success: true,

                versions:
                    versions.map(
                        version => ({

                            name:
                                version.name,

                            version:
                                version.version,

                            size:
                                version.size,

                            modified:
                                version.modified
                        })
                    )
            };


        } catch (error) {

            console.error(
                "Erreur list-powerpoint-versions :",
                error
            );


            return {

                success: false,

                error:
                    error.message,

                versions: []
            };
        }
    }
);


/* ============================================================
   IPC :
   OUVRIR UNE VERSION PRÉCISE
   ============================================================ */

ipcMain.handle(
    "open-powerpoint-version",
    async (
        event,
        filename
    ) => {

        try {

            if (
                typeof filename !== "string"
            ) {

                return {

                    success: false,

                    error:
                        "Nom de fichier invalide."
                };
            }


            /*
             * Sécurité contre :
             *
             * ../../fichier.pptx
             */

            const safeFilename =
                path.basename(
                    filename
                );


            /*
             * Vérifier le format.
             */

            const version =
                getPowerPointVersionNumber(
                    safeFilename
                );


            if (
                version === null
            ) {

                return {

                    success: false,

                    error:
                        "Version PowerPoint invalide."
                };
            }


            const filePath =
                path.join(
                    POWERPOINT_DIRECTORY,
                    safeFilename
                );


            if (
                !fs.existsSync(
                    filePath
                )
            ) {

                return {

                    success: false,

                    error:
                        "Cette version PowerPoint n'existe pas."
                };
            }


            console.log(
                "Ouverture version :",
                safeFilename
            );


            const error =
                await shell.openPath(
                    filePath
                );


            if (error) {

                return {

                    success: false,

                    error:
                        error
                };
            }


            return {

                success: true,

                path:
                    filePath,

                filename:
                    safeFilename,

                version:
                    version
            };


        } catch (error) {

            console.error(
                "Erreur open-powerpoint-version :",
                error
            );


            return {

                success: false,

                error:
                    error.message
            };
        }
    }
);