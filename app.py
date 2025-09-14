from flask import Flask, render_template
from flask_socketio import SocketIO
import random
import threading
import time

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

@app.route('/')
def index():
    return render_template("index.html")

# Drone + convoy simulation
def drone_swarm_sim():
    while True:
        # 5 drones
        drones = [{"id": i, "x": random.randint(-50,50), "y":5, "z": random.randint(-50,50)} for i in range(5)]
        # 3 convoy vehicles
        convoys = [{"id": i, "x": random.randint(-50,50), "y":1, "z": random.randint(-50,50)} for i in range(3)]
        socketio.emit("drone_update", drones)
        socketio.emit("convoy_update", convoys)
        time.sleep(0.1)

# Run simulation in a background thread
thread = threading.Thread(target=drone_swarm_sim)
thread.daemon = True
thread.start()

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5002)
