import emma.config.globals as EMMA_GLOBALS
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
import os
import json
import logging
import threading


class app:
    def __init__(self, queue_handler, console_handler):
        self.app = Flask(__name__)
        self.history = self.json_history()
        self.console_handler = console_handler
        self.queue = queue_handler
        self.event = threading.Event()
        self.tag = "WEB_APP Thread"
        self.socketio = SocketIO(self.app)
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)
        global time_breakout
        time_breakout = 0

    def json_history(self):
        module_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(module_dir)
        date = EMMA_GLOBALS.task_msc.date_clock(2)
        history_dir = os.path.join(
            parent_dir, "web_server", "history")  # Relative folder path
        history_path = os.path.join(history_dir, f"{date}.json")

        if not os.path.exists(history_dir):
            # Create the directory if it doesn't exist
            os.makedirs(history_dir)
        if not os.path.exists(history_path):
            # Create the file if it doesn't exist
            with open(history_path, "w") as f:
                json.dump({}, f, indent=4)

        return history_path

    def register_routes(self):
        self.event.wait()

        @self.app.route("/")
        def home():
            return render_template("index.html")

        @self.app.route("/", methods=["POST"])
        def process_form():
            # Process the form data here
            data = request.form["text_input"]
            self.queue.add_to_queue("CURRENT_INPUT", data)
            self.queue.add_to_queue("COMMANDS", data)
            # Return a JSON response with the data
            return jsonify({"result": "success", "data": data})

        @self.socketio.on("connect")
        def connect():
            f = open(self.history)
            jsoni = json.load(f)
            f.close()

            # emit the data to the client
            self.socketio.emit("connect", jsoni)

        @self.socketio.on("get_data")
        def get_data():
            global time_breakout
            data = self.queue.get_queue("SERVERDATA")

            # emit the data to the client
            time_breakout += 1
            if time_breakout >= 1000:
                self.restart_websocket_server()
                time_breakout = 0
            self.socketio.emit("get_data", data)

        @self.socketio.on("get_console")
        def get_console():
            global time_breakout

            j_data = {}
            f = open(self.history)
            json_data = json.load(f)
            try:
                data = self.queue.get_queue("CONSOLE", 1)
                if data != None:
                    json_data[f"{EMMA_GLOBALS.task_msc.date_clock(3)}"] = data
                    with open(self.history, "w") as f:
                        j = json.dumps(json_data, indent=4)
                        f.write(j)
                    j_data[f"{EMMA_GLOBALS.task_msc.date_clock(3)}"] = data
            except:
                pass

            f.close()
            # emit the data to the client
            time_breakout += 1
            if time_breakout >= 1000:
                self.restart_websocket_server()
                time_breakout = 0
            self.socketio.emit("get_console", j_data)

    def main(self):
        self.event.wait()
        self.register_routes()

        try:
            self.socketio.run(self.app, port=3018)
            self.console_handler.write(self.tag, "WEB SERVER LOADED")
        except Exception as e:
            self.console_handler.write(self.tag, str(e))

    def run(self):
        self.event.set()

    def stop(self):
        self.stop_flag = True


if __name__ == "__main__":
    pass
