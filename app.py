from flask import Flask
import routes.basic

app = Flask(__name__)
app.register_blueprint(routes.basic.routes)

if __name__ == "__main__":
    app.run(debug=True)
