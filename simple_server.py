#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
import threading

class TestHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/test':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"status": "success", "message": "Сервер работает!"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/api/proxy/calculator/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                print(f"Получены данные: {data}")
                
                # Простой ответ с тестовыми данными
                result = {
                    "success": True,
                    "result": {
                        "id": "test-123",
                        "age": data.get('age', 35),
                        "gender": data.get('gender', 'Мужской'),
                        "termYears": data.get('termYears', 5),
                        "sumInsured": data.get('sumInsured', 5000000),
                        "totalPremium": 2559.8,
                        "deathPremium": 1000.0,
                        "disabilityPremium": 559.8,
                        "accidentDeathPremium": 500.0,
                        "trafficDeathPremium": 250.0,
                        "injuryPremium": 250.0,
                        "criticalIllnessPremium": 400.0,
                        "sportPremium": 0.0,
                        "totalCostBreakdown": {
                            "death": 1000.0,
                            "disability": 559.8,
                            "accident": 1000.0,
                            "criticalIllness": "60,000,000₽ protection + 400,000₽ rehabilitation"
                        }
                    }
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
                
            except Exception as e:
                print(f"Ошибка: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error_response = {"success": False, "error": str(e)}
                self.wfile.write(json.dumps(error_response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    PORT = 4000
    print(f"🚀 Запускаем простой HTTP сервер на порту {PORT}...")
    
    with socketserver.TCPServer(("", PORT), TestHandler) as httpd:
        print(f"Сервер доступен по адресу http://localhost:{PORT}")
        print("Нажмите Ctrl+C для остановки")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nСервер остановлен")
