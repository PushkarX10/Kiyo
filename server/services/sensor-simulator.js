// ─── Sensor Simulator Service ───

const SENSORS = [
  { id: "temp-lab1", type: "temperature", location: "Lab 1", unit: "°C", base: 21.5, amplitude: 1.2, safe: [20, 23], warn: [19, 24] },
  { id: "temp-lab2", type: "temperature", location: "Lab 2", unit: "°C", base: 22.0, amplitude: 0.8, safe: [20, 23], warn: [19, 24] },
  { id: "temp-lab3", type: "temperature", location: "Lab 3", unit: "°C", base: 21.0, amplitude: 1.5, safe: [20, 23], warn: [19, 24] },
  { id: "temp-vault", type: "temperature", location: "Cold Vault A", unit: "°C", base: -18.0, amplitude: 2.0, safe: [-20, -15], warn: [-22, -12] },
  { id: "hum-lab1", type: "humidity", location: "Lab 1", unit: "%", base: 45, amplitude: 5, safe: [40, 55], warn: [35, 60] },
  { id: "hum-lab2", type: "humidity", location: "Lab 2", unit: "%", base: 48, amplitude: 4, safe: [40, 55], warn: [35, 60] },
  { id: "hum-lab3", type: "humidity", location: "Lab 3", unit: "%", base: 44, amplitude: 6, safe: [40, 55], warn: [35, 60] },
  { id: "press-cr1", type: "pressure", location: "Cleanroom CR-1", unit: "atm", base: 1.012, amplitude: 0.005, safe: [1.005, 1.02], warn: [1.0, 1.025] },
  { id: "press-cr2", type: "pressure", location: "Cleanroom CR-2", unit: "atm", base: 1.015, amplitude: 0.004, safe: [1.005, 1.02], warn: [1.0, 1.025] },
];

let tick = 0;
const sensorHistory = {};

// Initialize history with 24 hours of data (one per minute, 1440 points)
SENSORS.forEach((s) => {
  sensorHistory[s.id] = [];
  for (let i = 0; i < 1440; i++) {
    const t = i / 60; // hours
    const noise = (Math.random() - 0.5) * s.amplitude * 0.3;
    const value = s.base + Math.sin(t / 4) * s.amplitude * 0.5 + noise;
    sensorHistory[s.id].push({
      timestamp: new Date(Date.now() - (1440 - i) * 60000).toISOString(),
      value: Number(value.toFixed(3)),
    });
  }
});

function generateReading(sensor) {
  tick++;
  const noise = (Math.random() - 0.5) * sensor.amplitude * 0.4;
  const drift = Math.sin(tick / 30) * sensor.amplitude * 0.5;
  // Occasional anomaly (1% chance)
  const anomaly = Math.random() < 0.01 ? sensor.amplitude * 2 * (Math.random() > 0.5 ? 1 : -1) : 0;
  const value = sensor.base + drift + noise + anomaly;

  const reading = {
    sensorId: sensor.id,
    type: sensor.type,
    location: sensor.location,
    unit: sensor.unit,
    value: Number(value.toFixed(3)),
    timestamp: new Date().toISOString(),
    safe: sensor.safe,
    warn: sensor.warn,
  };

  // Determine status
  if (value < sensor.safe[0] || value > sensor.safe[1]) {
    if (value < sensor.warn[0] || value > sensor.warn[1]) {
      reading.status = "critical";
    } else {
      reading.status = "warning";
    }
  } else {
    reading.status = "safe";
  }

  // Push to history
  sensorHistory[sensor.id].push({ timestamp: reading.timestamp, value: reading.value });
  if (sensorHistory[sensor.id].length > 2880) sensorHistory[sensor.id].shift(); // keep 48h

  return reading;
}

export function startSensorSimulator(wss) {
  setInterval(() => {
    const readings = SENSORS.map(generateReading);

    // Broadcast to all connected WebSocket clients
    const message = JSON.stringify({ type: "sensor_update", readings, timestamp: new Date().toISOString() });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }, 2000); // Every 2 seconds

  console.log("  🌡️  Sensor simulator started (2s interval, 9 sensors)");
}

export function getCurrentReadings() {
  return SENSORS.map((s) => {
    const history = sensorHistory[s.id];
    const latest = history[history.length - 1];
    return {
      sensorId: s.id,
      type: s.type,
      location: s.location,
      unit: s.unit,
      value: latest.value,
      timestamp: latest.timestamp,
      safe: s.safe,
      warn: s.warn,
      status: latest.value < s.safe[0] || latest.value > s.safe[1]
        ? latest.value < s.warn[0] || latest.value > s.warn[1] ? "critical" : "warning"
        : "safe",
    };
  });
}

export function getSensorHistory(sensorId, hours = 24) {
  const history = sensorHistory[sensorId];
  if (!history) return [];
  const cutoff = Date.now() - hours * 3600000;
  return history.filter((h) => new Date(h.timestamp).getTime() > cutoff);
}

export { SENSORS };
