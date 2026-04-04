from flask import Blueprint, render_template

routes = Blueprint("render", __name__, template_folder="templates")


@routes.get("/")
def get_index():
    return render_template("index.html")
