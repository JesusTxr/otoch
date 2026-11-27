// Escenario de carga (Grafana k6) · Otoch v1.0.0
// Uso: k6 run pruebas/k6_carga_feed.js -e BASE_URL=https://[COMPLETAR: URL de staging] -e TOKEN=[JWT de usuario de prueba]
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    sostenida: { executor: "constant-vus", vus: 500, duration: "15m" },
    pico: { executor: "ramping-vus", startTime: "16m", startVUs: 0,
            stages: [{ duration: "2m", target: 800 }, { duration: "3m", target: 800 }, { duration: "1m", target: 0 }] },
  },
  thresholds: {
    "http_req_duration{scenario:sostenida}": ["p(95)<800"],
    "http_req_failed{scenario:sostenida}": ["rate<0.01"],
    "http_req_duration{scenario:pico}": ["p(95)<1500"],
    "http_req_failed{scenario:pico}": ["rate<0.02"],
  },
};

const BASE = __ENV.BASE_URL;
const headers = { Authorization: `Bearer ${__ENV.TOKEN}` };

export default function () {
  const home = http.get(`${BASE}/`);
  check(home, { "inicio 200": (r) => r.status === 200 });
  const feed = http.get(`${BASE}/api/descubrir?universidad=UTM&radio_km=5&presupuesto=3500`, { headers });
  check(feed, { "feed 200": (r) => r.status === 200 });
  sleep(Math.random() * 3 + 2);
}
