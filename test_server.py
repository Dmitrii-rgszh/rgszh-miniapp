#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

# Устанавливаем переменные кодировки для Python
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['LANG'] = 'C.UTF-8'

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"status": "success", "message": "Сервер работает!"})

@app.route('/api/proxy/calculator/save', methods=['POST'])
def proxy_calculator():
    try:
        data = request.get_json()
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
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Ошибка: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = 4000
    print(f"🚀 Запускаем тестовый сервер на порту {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
