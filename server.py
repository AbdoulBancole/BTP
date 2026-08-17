import os
import platform
import subprocess
from pathlib import Path

from flask import Flask, jsonify, send_file, send_from_directory


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

PLAN_DIR = BASE_DIR / "plan-lider"

PLAN_FILE = PLAN_DIR / "Plan_Leader.pptx"


app = Flask(
    __name__,
    static_folder=".",
    static_url_path=""
)


# =========================================================
# VÉRIFICATION DU FICHIER
# =========================================================

def get_plan_info():

    if not PLAN_FILE.exists():

        return {
            "exists": False,
            "filename": "plan-lider.pptx",
            "modified": None,
            "size": 0
        }


    stat = PLAN_FILE.stat()


    return {
        "exists": True,
        "filename": PLAN_FILE.name,
        "modified": stat.st_mtime,
        "size": stat.st_size
    }


# =========================================================
# PAGE APPLICATION
# =========================================================

@app.route("/")
def index():

    return send_from_directory(
        BASE_DIR,
        "index.html"
    )


# =========================================================
# FICHIER POWERPOINT
# =========================================================

@app.route("/plan-lider/plan-lider.pptx")
def get_plan_lider():

    if not PLAN_FILE.exists():

        return jsonify({
            "error": "Le fichier PowerPoint est introuvable."
        }), 404


    return send_file(
        PLAN_FILE,
        as_attachment=False,
        mimetype=(
            "application/vnd.openxmlformats-officedocument."
            "presentationml.presentation"
        )
    )


# =========================================================
# INFORMATIONS SUR LE POWERPOINT
# =========================================================

@app.route("/api/plan-lider/status")
def plan_lider_status():

    return jsonify(
        get_plan_info()
    )


# =========================================================
# OUVRIR POWERPOINT
# =========================================================

@app.route("/api/plan-lider/open", methods=["POST"])
def open_plan_lider():

    if not PLAN_FILE.exists():

        return jsonify({
            "success": False,
            "message": "Le fichier PowerPoint est introuvable."
        }), 404


    try:

        system = platform.system()


        # -------------------------------------------------
        # WINDOWS
        # -------------------------------------------------

        if system == "Windows":

            os.startfile(
                str(PLAN_FILE)
            )


        # -------------------------------------------------
        # MACOS
        # -------------------------------------------------

        elif system == "Darwin":

            subprocess.Popen(
                [
                    "open",
                    "-a",
                    "Microsoft PowerPoint",
                    str(PLAN_FILE)
                ]
            )


        # -------------------------------------------------
        # LINUX
        # -------------------------------------------------

        elif system == "Linux":

            subprocess.Popen(
                [
                    "xdg-open",
                    str(PLAN_FILE)
                ]
            )


        else:

            return jsonify({
                "success": False,
                "message": (
                    "Système d'exploitation non supporté."
                )
            }), 400


        return jsonify({
            "success": True,
            "message": "PowerPoint a été ouvert.",
            "file": "plan-lider.pptx"
        })


    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


# =========================================================
# LANCEMENT
# =========================================================

if __name__ == "__main__":

    print()
    print("==============================================")
    print("   APPLICATION GESTION GRUES")
    print("==============================================")
    print()
    print(
        f"PowerPoint : {PLAN_FILE}"
    )
    print()
    print(
        "Application disponible sur :"
    )
    print(
        "http://127.0.0.1:5000"
    )
    print()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )