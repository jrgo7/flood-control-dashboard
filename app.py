from flask import Flask
import routes.render
import routes.regions
import routes.projects
import routes.city

app = Flask(__name__)

blueprints = [
    routes.render.routes,
    routes.regions.routes,
    routes.projects.routes,
    routes.city.routes,
]

for blueprint in blueprints:
    app.register_blueprint(blueprint)

if __name__ == "__main__":
    app.run(debug=True)
