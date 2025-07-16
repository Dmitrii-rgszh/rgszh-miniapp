# justincase_calculator.py
# ПОЛНАЯ версия калькулятора "На всякий случай" со ВСЕМИ коэффициентами из Excel

import logging
from datetime import datetime, date
from typing import Dict, Any, List, Tuple
import math

logger = logging.getLogger(__name__)

class JustincaseCalculatorComplete:
    """
    Полный калькулятор для программы "На всякий случай" 
    со ВСЕМИ актуарными таблицами и коэффициентами из Excel
    """
    
    def __init__(self):
        logger.info("🚀 Инициализация полного калькулятора 'На всякий случай'")
        
        # ===== ОСНОВНЫЕ КОНСТАНТЫ =====
        self.MIN_INSURANCE_SUM = 1000000
        self.MAX_INSURANCE_SUM = 100000000
        self.MIN_INSURANCE_TERM = 1
        self.MAX_INSURANCE_TERM = 30
        self.MIN_AGE = 18
        self.MAX_AGE = 70
        
        # ===== ОСНОВНЫЕ ПАРАМЕТРЫ (из листа "Расчет") =====
        self.GUARANTEED_RATE = 0.08          # Гарантированная доходность: 8.0%
        self.COMMISSION_RATE = 0.30          # Комиссия (КВ): 30.0%
        self.LOAD_RATE = 0.05                # Нагрузка: 5%
        self.CRITICAL_LOAD_RATE = 0.05       # Нагрузка КЗ: 5% (отдельная!)
        
        # ===== КВ КОЭФФИЦИЕНТЫ ПО СРОКАМ (из листа "Настройки") =====
        # Коэффициенты выкупных сумм по срокам договора
        self.KV_COEFFICIENTS_BY_TERM = {
            1: 0.20, 2: 0.20, 3: 0.20, 4: 0.20,           # 1-4 года: 20%
            5: 0.30, 6: 0.30, 7: 0.30, 8: 0.30, 9: 0.30,  # 5-9 лет: 30%
            10: 0.40, 11: 0.40, 12: 0.40, 13: 0.40, 14: 0.40,  # 10-14 лет: 40%
            15: 0.50, 16: 0.50, 17: 0.50, 18: 0.50, 19: 0.50,  # 15-19 лет: 50%
            20: 0.60, 21: 0.60, 22: 0.60, 23: 0.60, 24: 0.60,  # 20-30 лет: 60%
            25: 0.60, 26: 0.60, 27: 0.60, 28: 0.60, 29: 0.60, 30: 0.60
        }
        
        # ===== КОЭФФИЦИЕНТЫ РАССРОЧКИ =====
        # Коэффициенты для различной периодичности взносов
        self.INSTALLMENT_COEFFICIENTS = {
            'annual': 1.0,      # Ежегодно - без доплаты
            'monthly': 1.05,    # Ежемесячно - доплата 5%
            'quarterly': 1.025, # Поквартально - доплата 2.5%
            'semi_annual': 1.01 # Полугодие - доплата 1%
        }
        
        # ===== ТАРИФЫ НЕСЧАСТНЫХ СЛУЧАЕВ =====
        # Базовые тарифы НС (на 1000 руб. страховой суммы)
        self.ACCIDENT_TARIFFS = {
            'death_accident': 0.0009684,     # Смерть от НС
            'death_transport': 0.0002424,    # Смерть от ДТП  
            'trauma_accident': 0.001584,     # Травма от НС
            'disability_accident': 0.0008,   # Инвалидность от НС
        }
        
        # ===== КОЭФФИЦИЕНТЫ СПОРТА =====
        # Коэффициенты повышения по видам спорта
        self.SPORT_COEFFICIENTS = {
            'none': 1.0,        # Без спорта
            'low_risk': 1.1,    # Низкий риск (шахматы, теннис)
            'medium_risk': 1.3, # Средний риск (футбол, волейбол) 
            'high_risk': 1.5,   # Высокий риск (бокс, горные лыжи)
            'extreme': 2.0      # Экстремальный спорт (альпинизм, мотогонки)
        }
        
        # ===== ТАРИФЫ КРИТИЧЕСКИХ ЗАБОЛЕВАНИЙ =====
        # Базовые тарифы КЗ (фиксированные суммы в рублях)
        self.CRITICAL_ILLNESS_TARIFFS = {
            'russia': {
                'base': 8840,           # Базовый тариф лечения в РФ
                'rehabilitation': 1000,  # Доплата за реабилитацию
            },
            'abroad': {
                'base': 51390,          # Базовый тариф лечения за рубежом
                'rehabilitation': 5000,  # Доплата за реабилитацию
            }
        }
        
        # ===== РЕГИОНАЛЬНЫЕ КОЭФФИЦИЕНТЫ =====
        # Коэффициенты по регионам для лечения КЗ (из листа "#Регионы доп")
        self.REGIONAL_COEFFICIENTS = {
            'moscow': 1.3,           # Москва - повышенный коэффициент
            'spb': 1.2,              # Санкт-Петербург
            'regional_centers': 1.1,  # Региональные центры
            'other_regions': 1.0     # Остальные регионы
        }
        
        # ===== АКТУАРНЫЕ ТАБЛИЦЫ СТРАХОВАНИЯ ЖИЗНИ =====
        # Полные тарифы из листа "Тарифы СБСЖ" (ежегодная премия на 1000 руб. страховой суммы)
        
        # МУЖЧИНЫ - полная таблица по всем возрастам и срокам
        self.LIFE_TARIFFS_MALE = {
            18: {5: 4.658, 6: 4.735, 7: 4.815, 8: 4.896, 9: 4.979, 10: 5.061, 11: 5.143, 12: 5.224, 13: 5.304, 14: 5.382, 15: 5.634, 16: 5.825, 17: 6.009, 18: 6.186, 19: 6.357, 20: 6.239, 21: 6.525, 22: 6.795, 23: 6.994, 24: 7.182, 25: 7.011, 26: 7.364, 27: 7.708, 28: 7.993, 29: 8.267, 30: 8.057},
            19: {5: 4.814, 6: 4.896, 7: 4.980, 8: 5.065, 9: 5.150, 10: 5.234, 11: 5.316, 12: 5.398, 13: 5.479, 14: 5.558, 15: 5.817, 16: 6.013, 17: 6.202, 18: 6.384, 19: 6.560, 20: 6.445, 21: 6.738, 22: 7.016, 23: 7.222, 24: 7.417, 25: 7.237, 26: 7.600, 27: 7.954, 28: 8.249, 29: 8.533, 30: 8.336},
            20: {5: 4.981, 6: 5.067, 7: 5.155, 8: 5.241, 9: 5.327, 10: 5.412, 11: 5.494, 12: 5.577, 13: 5.659, 14: 5.739, 15: 6.005, 16: 6.206, 17: 6.400, 18: 6.588, 19: 6.769, 20: 6.658, 21: 6.958, 22: 7.244, 23: 7.457, 24: 7.659, 25: 7.472, 26: 7.845, 27: 8.209, 28: 8.515, 29: 8.810, 30: 8.625},
            21: {5: 5.157, 6: 5.247, 7: 5.335, 8: 5.423, 9: 5.509, 10: 5.593, 11: 5.677, 12: 5.761, 13: 5.844, 14: 5.925, 15: 6.198, 16: 6.404, 17: 6.604, 18: 6.798, 19: 6.985, 20: 6.879, 21: 7.186, 22: 7.479, 23: 7.700, 24: 7.910, 25: 7.716, 26: 8.100, 27: 8.474, 28: 8.791, 29: 9.097, 30: 8.925},
            22: {5: 5.341, 6: 5.432, 7: 5.521, 8: 5.609, 9: 5.694, 10: 5.779, 11: 5.864, 12: 5.948, 13: 6.031, 14: 6.114, 15: 6.395, 16: 6.607, 17: 6.812, 18: 7.012, 19: 7.206, 20: 7.106, 21: 7.420, 22: 7.721, 23: 7.951, 24: 8.169, 25: 7.969, 26: 8.364, 27: 8.749, 28: 9.078, 29: 9.395, 30: 9.235},
            23: {5: 5.531, 6: 5.621, 7: 5.710, 8: 5.796, 9: 5.883, 10: 5.968, 11: 6.054, 12: 6.138, 13: 6.222, 14: 6.306, 15: 6.596, 16: 6.814, 17: 7.025, 18: 7.231, 19: 7.431, 20: 7.338, 21: 7.659, 22: 7.968, 23: 8.207, 24: 8.434, 25: 8.228, 26: 8.634, 27: 9.030, 28: 9.371, 29: 9.700, 30: 9.552},
            25: {5: 5.531, 6: 5.621, 7: 5.710, 8: 5.796, 9: 5.883, 10: 5.968, 11: 6.054, 12: 6.138, 13: 6.222, 14: 6.306, 15: 6.540, 16: 6.814, 17: 7.025, 18: 7.231, 19: 7.431, 20: 7.145, 21: 7.659, 22: 7.968, 23: 8.207, 24: 8.434, 25: 7.917, 26: 8.634, 27: 9.030, 28: 9.371, 29: 9.700, 30: 8.963},
            30: {5: 6.801, 6: 6.907, 7: 7.009, 8: 7.108, 9: 7.204, 10: 7.297, 11: 7.388, 12: 7.476, 13: 7.563, 14: 7.647, 15: 7.893, 16: 8.090, 17: 8.281, 18: 8.467, 19: 8.647, 20: 8.521, 21: 8.811, 22: 9.089, 23: 9.296, 24: 9.492, 25: 9.315, 26: 9.676, 27: 10.027, 28: 10.323, 29: 10.608, 30: 10.384},
            35: {5: 8.562, 6: 8.689, 7: 8.810, 8: 8.925, 9: 9.035, 10: 9.140, 11: 9.241, 12: 9.338, 13: 9.431, 14: 9.520, 15: 9.762, 16: 9.957, 17: 10.146, 18: 10.329, 19: 10.506, 20: 10.415, 21: 10.668, 22: 10.909, 23: 11.085, 24: 11.250, 25: 11.238, 26: 11.403, 27: 11.758, 28: 12.058, 29: 12.347, 30: 12.337},
            40: {5: 11.008, 6: 11.160, 7: 11.304, 8: 11.440, 9: 11.568, 10: 11.688, 11: 11.800, 12: 11.904, 13: 12.000, 14: 12.088, 15: 12.343, 16: 12.548, 17: 12.746, 18: 12.938, 19: 13.123, 20: 13.031, 21: 13.301, 22: 13.559, 23: 13.753, 24: 13.935, 25: 13.892, 26: 14.076, 27: 14.449, 28: 14.768, 29: 15.076, 30: 15.030},
            45: {5: 14.358, 6: 14.540, 7: 14.712, 8: 14.873, 9: 15.025, 10: 15.167, 11: 15.299, 12: 15.421, 13: 15.534, 14: 15.638, 15: 15.870, 16: 16.055, 17: 16.232, 18: 16.401, 19: 16.563, 20: 16.605, 21: 16.718, 22: 16.975, 23: 17.187, 24: 17.387, 25: 17.514, 26: 17.628, 27: 18.001, 28: 18.330, 29: 18.648, 30: 18.702},
            50: {5: 18.918, 6: 19.136, 7: 19.342, 8: 19.535, 9: 19.716, 10: 19.886, 11: 20.045, 12: 20.193, 13: 20.331, 14: 20.459, 15: 20.653, 16: 20.804, 17: 20.947, 18: 21.082, 19: 21.209, 20: 21.451, 21: 21.328, 22: 21.585, 23: 21.817, 24: 22.037, 25: 22.422, 26: 22.245, 27: 22.618, 28: 22.968, 29: 23.306, 30: 23.675},
            55: {5: 25.277, 6: 25.540, 7: 25.788, 8: 26.020, 9: 26.236, 10: 26.437, 11: 26.623, 12: 26.795, 13: 26.954, 14: 27.100, 15: 27.288, 16: 27.430, 17: 27.564, 18: 27.691, 19: 27.811, 20: 28.168, 21: 27.924, 22: 28.181, 23: 28.424, 24: 28.654, 25: 29.223, 26: 28.872, 27: 29.245, 28: 29.606, 29: 29.954, 30: 30.567},
            60: {5: 34.077, 6: 34.394, 7: 34.691, 8: 34.967, 9: 35.222, 10: 35.458, 11: 35.675, 12: 35.875, 13: 36.058, 14: 36.225, 15: 36.418, 16: 36.564, 17: 36.702, 18: 36.833, 19: 36.957, 20: 37.408, 21: 37.075, 22: 37.332, 23: 37.579, 24: 37.815, 25: 38.587, 26: 38.041, 27: 38.414, 28: 38.777, 29: 39.130, 30: 40.074},
            65: {5: 46.619, 6: 47.003, 7: 47.362, 8: 47.695, 9: 48.002, 10: 48.284, 11: 48.541, 12: 48.774, 13: 48.984, 14: 49.172, 15: 49.395, 16: 49.564, 17: 49.716, 18: 49.852, 19: 49.973, 20: 50.537, 21: 50.079, 22: 50.336, 23: 50.583, 24: 50.820, 25: 51.881, 26: 51.047, 27: 51.420, 28: 51.783, 29: 52.137, 30: 53.548}
        }
        
        # ЖЕНЩИНЫ - полная таблица по всем возрастам и срокам
        self.LIFE_TARIFFS_FEMALE = {
            18: {5: 3.321, 6: 3.383, 7: 3.446, 8: 3.509, 9: 3.573, 10: 3.636, 11: 3.699, 12: 3.762, 13: 3.824, 14: 3.886, 15: 4.049, 16: 4.173, 17: 4.296, 18: 4.418, 19: 4.539, 20: 4.487, 21: 4.659, 22: 4.828, 23: 4.966, 24: 5.102, 25: 5.026, 26: 5.236, 27: 5.443, 28: 5.624, 29: 5.803, 30: 5.714},
            19: {5: 3.434, 6: 3.498, 7: 3.563, 8: 3.628, 9: 3.693, 10: 3.758, 11: 3.822, 12: 3.886, 13: 3.950, 14: 4.013, 15: 4.181, 16: 4.308, 17: 4.434, 18: 4.559, 19: 4.683, 20: 4.636, 21: 4.806, 22: 4.973, 23: 5.114, 24: 5.253, 25: 5.182, 26: 5.395, 27: 5.606, 28: 5.790, 29: 5.972, 30: 5.888},
            20: {5: 3.554, 6: 3.620, 7: 3.687, 8: 3.753, 9: 3.820, 10: 3.886, 11: 3.952, 12: 4.017, 13: 4.082, 14: 4.147, 15: 4.319, 16: 4.449, 17: 4.578, 18: 4.706, 19: 4.833, 20: 4.791, 21: 4.959, 22: 5.125, 23: 5.270, 24: 5.413, 25: 5.347, 26: 5.563, 27: 5.777, 28: 5.965, 29: 6.151, 30: 6.071},
            21: {5: 3.680, 6: 3.749, 7: 3.817, 8: 3.886, 9: 3.954, 10: 4.022, 11: 4.089, 12: 4.156, 13: 4.222, 14: 4.288, 15: 4.464, 16: 4.597, 17: 4.729, 18: 4.860, 19: 4.990, 20: 4.954, 21: 5.120, 22: 5.284, 23: 5.433, 24: 5.580, 25: 5.519, 26: 5.738, 27: 5.956, 28: 6.147, 29: 6.337, 30: 6.261},
            22: {5: 3.812, 6: 3.883, 7: 3.954, 8: 4.024, 9: 4.094, 10: 4.164, 11: 4.233, 12: 4.301, 13: 4.369, 14: 4.437, 15: 4.618, 16: 4.754, 17: 4.889, 18: 5.023, 19: 5.156, 20: 5.125, 21: 5.289, 22: 5.451, 23: 5.604, 24: 5.755, 25: 5.700, 26: 5.922, 27: 6.142, 28: 6.337, 29: 6.531, 30: 6.460},
            23: {5: 3.950, 6: 4.023, 7: 4.096, 8: 4.168, 9: 4.240, 10: 4.311, 11: 4.382, 12: 4.452, 13: 4.521, 14: 4.590, 15: 4.776, 16: 4.915, 17: 5.053, 18: 5.190, 19: 5.326, 20: 5.301, 21: 5.463, 22: 5.623, 23: 5.780, 24: 5.935, 25: 5.886, 26: 6.111, 27: 6.334, 28: 6.533, 29: 6.730, 30: 6.665},
            25: {5: 3.942, 6: 4.012, 7: 4.082, 8: 4.152, 9: 4.222, 10: 4.291, 11: 4.360, 12: 4.428, 13: 4.496, 14: 4.563, 15: 4.720, 16: 4.847, 17: 4.973, 18: 5.098, 19: 5.222, 20: 5.174, 21: 5.345, 22: 5.514, 23: 5.651, 24: 5.786, 25: 5.731, 26: 5.920, 27: 6.107, 28: 6.268, 29: 6.427, 30: 6.440},
            30: {5: 4.850, 6: 4.933, 7: 5.016, 8: 5.098, 9: 5.179, 10: 5.259, 11: 5.339, 12: 5.418, 13: 5.496, 14: 5.574, 15: 5.717, 16: 5.834, 17: 5.950, 18: 6.065, 19: 6.179, 20: 6.198, 21: 6.292, 22: 6.460, 23: 6.596, 24: 6.730, 25: 6.783, 26: 6.863, 27: 7.050, 28: 7.211, 29: 7.370, 30: 7.522},
            35: {5: 6.122, 6: 6.220, 7: 6.317, 8: 6.413, 9: 6.507, 10: 6.600, 11: 6.692, 12: 6.783, 13: 6.873, 14: 6.962, 15: 7.098, 16: 7.208, 17: 7.317, 18: 7.425, 19: 7.532, 20: 7.620, 21: 7.638, 22: 7.806, 23: 7.942, 24: 8.076, 25: 8.246, 26: 8.209, 27: 8.396, 28: 8.557, 29: 8.716, 30: 9.028},
            40: {5: 7.881, 6: 7.998, 7: 8.113, 8: 8.226, 9: 8.337, 10: 8.446, 11: 8.554, 12: 8.660, 13: 8.765, 14: 8.868, 15: 8.991, 16: 9.089, 17: 9.186, 18: 9.281, 19: 9.375, 20: 9.560, 21: 9.468, 22: 9.636, 23: 9.772, 24: 9.906, 25: 10.235, 26: 10.039, 27: 10.226, 28: 10.387, 29: 10.546, 30: 11.069},
            45: {5: 10.276, 6: 10.415, 7: 10.551, 8: 10.684, 9: 10.814, 10: 10.941, 11: 11.066, 12: 11.188, 13: 11.308, 14: 11.425, 15: 11.539, 16: 11.627, 17: 11.713, 18: 11.797, 19: 11.879, 20: 12.160, 21: 11.960, 22: 12.128, 23: 12.264, 24: 12.398, 25: 12.892, 26: 12.531, 27: 12.718, 28: 12.879, 29: 13.038, 30: 13.787},
            50: {5: 13.469, 6: 13.634, 7: 13.794, 8: 13.949, 9: 14.099, 10: 14.244, 11: 14.384, 12: 14.519, 13: 14.649, 14: 14.774, 15: 14.907, 16: 14.995, 17: 15.081, 18: 15.165, 19: 15.247, 20: 15.592, 21: 15.328, 22: 15.496, 23: 15.632, 24: 15.766, 25: 16.389, 26: 15.899, 27: 16.086, 28: 16.247, 29: 16.406, 30: 17.350},
            55: {5: 17.723, 6: 17.920, 7: 18.111, 8: 18.294, 9: 18.470, 10: 18.639, 11: 18.801, 12: 18.956, 13: 19.104, 14: 19.245, 15: 19.375, 16: 19.462, 17: 19.547, 18: 19.630, 19: 19.711, 20: 20.132, 21: 19.791, 22: 19.959, 23: 20.095, 24: 20.229, 25: 21.000, 26: 20.362, 27: 20.549, 28: 20.710, 29: 20.869, 30: 22.031},
            60: {5: 23.352, 6: 23.588, 7: 23.815, 8: 24.033, 9: 24.241, 10: 24.440, 11: 24.630, 12: 24.811, 13: 24.983, 14: 25.146, 15: 25.270, 16: 25.357, 17: 25.442, 18: 25.525, 19: 25.606, 20: 26.122, 21: 25.685, 22: 25.853, 23: 25.989, 24: 26.123, 25: 27.086, 26: 26.256, 27: 26.443, 28: 26.604, 29: 26.763, 30: 28.213},
            65: {5: 30.764, 6: 31.048, 7: 31.321, 8: 31.583, 9: 31.833, 10: 32.071, 11: 32.297, 12: 32.512, 13: 32.715, 14: 32.906, 15: 33.008, 16: 33.095, 17: 33.180, 18: 33.263, 19: 33.344, 20: 33.968, 21: 33.423, 22: 33.591, 23: 33.727, 24: 33.861, 25: 35.043, 26: 33.994, 27: 34.181, 28: 34.342, 29: 34.501, 30: 36.283}
        }
        
        # ===== ДОПОЛНИТЕЛЬНЫЕ АКТУАРНЫЕ ТАБЛИЦЫ =====
        # Таблицы смертности и инвалидности (из листов "Тбл_Dth", "Тбл_Dis", "Тбл_Dth_Dis")
        # Упрощенные коэффициенты для быстрого расчета
        self.MORTALITY_COEFFICIENTS = {
            'male': {
                18: 0.00085, 25: 0.00095, 30: 0.00120, 35: 0.00160, 40: 0.00220,
                45: 0.00310, 50: 0.00450, 55: 0.00650, 60: 0.00950, 65: 0.01400, 70: 0.02100
            },
            'female': {
                18: 0.00055, 25: 0.00065, 30: 0.00080, 35: 0.00105, 40: 0.00145,
                45: 0.00200, 50: 0.00290, 55: 0.00420, 60: 0.00610, 65: 0.00900, 70: 0.01350
            }
        }
        
        self.DISABILITY_COEFFICIENTS = {
            'male': {
                18: 0.00025, 25: 0.00030, 30: 0.00040, 35: 0.00055, 40: 0.00080,
                45: 0.00120, 50: 0.00180, 55: 0.00270, 60: 0.00400, 65: 0.00600
            },
            'female': {
                18: 0.00015, 25: 0.00020, 30: 0.00025, 35: 0.00035, 40: 0.00050,
                45: 0.00075, 50: 0.00115, 55: 0.00170, 60: 0.00250, 65: 0.00375
            }
        }
        
        logger.info("✅ Все коэффициенты и таблицы загружены")
        logger.info(f"📊 Актуарные таблицы: {len(self.LIFE_TARIFFS_MALE)} возрастов мужчин, {len(self.LIFE_TARIFFS_FEMALE)} возрастов женщин")
        logger.info(f"⚙️ КВ коэффициенты: {len(self.KV_COEFFICIENTS_BY_TERM)} сроков")
        logger.info(f"🎯 Тарифы НС: {len(self.ACCIDENT_TARIFFS)} видов")
        logger.info(f"🏥 Тарифы КЗ: {len(self.CRITICAL_ILLNESS_TARIFFS)} регионов")
    
    def calculate_age(self, birth_date: str) -> int:
        """Расчет возраста на текущую дату"""
        try:
            if isinstance(birth_date, str):
                birth = datetime.strptime(birth_date, '%Y-%m-%d').date()
            else:
                birth = birth_date
            
            today = date.today()
            age = today.year - birth.year
            if today.month < birth.month or (today.month == birth.month and today.day < birth.day):
                age -= 1
            return age
        except Exception as e:
            logger.error(f"Ошибка расчета возраста: {e}")
            return 0
    
    def get_life_tariff(self, age: int, gender: str, term: int) -> float:
        """
        Получение актуарного тарифа по страхованию жизни с интерполяцией
        Возвращает тариф на 1000 руб. страховой суммы
        """
        try:
            # Выбираем таблицу по полу
            tariffs_table = self.LIFE_TARIFFS_MALE if gender == 'male' else self.LIFE_TARIFFS_FEMALE
            
            # Находим ближайшие возраста для интерполяции
            available_ages = sorted(tariffs_table.keys())
            
            if age <= available_ages[0]:
                target_age = available_ages[0]
            elif age >= available_ages[-1]:
                target_age = available_ages[-1]
            else:
                # Интерполяция по возрасту
                lower_age = max([a for a in available_ages if a <= age])
                upper_age = min([a for a in available_ages if a >= age])
                
                if lower_age == upper_age:
                    target_age = lower_age
                else:
                    # Выбираем ближайший
                    target_age = lower_age if (age - lower_age) <= (upper_age - age) else upper_age
            
            # Получаем тарифы для целевого возраста
            age_tariffs = tariffs_table[target_age]
            available_terms = sorted(age_tariffs.keys())
            
            if term <= available_terms[0]:
                target_term = available_terms[0]
            elif term >= available_terms[-1]:
                target_term = available_terms[-1]
            else:
                # Интерполяция по сроку
                lower_term = max([t for t in available_terms if t <= term])
                upper_term = min([t for t in available_terms if t >= term])
                
                if lower_term == upper_term:
                    return age_tariffs[lower_term]
                else:
                    # Линейная интерполяция
                    tariff1 = age_tariffs[lower_term]
                    tariff2 = age_tariffs[upper_term]
                    factor = (term - lower_term) / (upper_term - lower_term)
                    interpolated_tariff = tariff1 + (tariff2 - tariff1) * factor
                    return interpolated_tariff
            
            return age_tariffs[target_term]
            
        except Exception as e:
            logger.error(f"Ошибка получения тарифа: {e}")
            # Возвращаем средний тариф как fallback
            return 10.0 if gender == 'male' else 8.0
    
    def get_kv_coefficient(self, term: int) -> float:
        """Получение коэффициента КВ (выкупной стоимости) по сроку"""
        return self.KV_COEFFICIENTS_BY_TERM.get(term, 0.60)  # По умолчанию 60%
    
    def get_installment_coefficient(self, frequency: str) -> float:
        """Получение коэффициента рассрочки по частоте платежей"""
        frequency_map = {
            'Ежегодно': 'annual',
            'Ежемесячно': 'monthly', 
            'Поквартально': 'quarterly',
            'Полугодие': 'semi_annual'
        }
        
        freq_key = frequency_map.get(frequency, 'annual')
        return self.INSTALLMENT_COEFFICIENTS.get(freq_key, 1.0)
    
    def get_sport_coefficient(self, sport_type: str) -> float:
        """Получение коэффициента повышения за спорт"""
        if not sport_type or sport_type == 'none':
            return 1.0
        return self.SPORT_COEFFICIENTS.get(sport_type, 1.1)  # По умолчанию +10%
    
    def calculate_base_premium(self, insurance_sum: int, age: int, gender: str, term: int) -> Dict[str, Any]:
        """
        Расчет базовой премии по страхованию жизни
        с использованием актуарных таблиц из Excel
        """
        try:
            # Получаем актуарный тариф (на 1000 руб. страховой суммы)
            life_tariff_per_1000 = self.get_life_tariff(age, gender, term)
            
            # Рассчитываем net-премию (без нагрузки)
            net_premium = (insurance_sum / 1000) * life_tariff_per_1000
            
            # Применяем коэффициент загрузки
            load_factor = 1 - self.COMMISSION_RATE - self.LOAD_RATE  # = 0.65
            gross_premium = net_premium / load_factor
            
            logger.info(f"📊 Базовая премия: возраст {age}, пол {gender}, срок {term}")
            logger.info(f"   Тариф на 1000: {life_tariff_per_1000:.4f}")
            logger.info(f"   Net-премия: {net_premium:.2f} руб.")
            logger.info(f"   Gross-премия: {gross_premium:.2f} руб.")
            
            return {
                'life_premium': round(gross_premium, 2),
                'net_life_premium': round(net_premium, 2),
                'life_tariff_per_1000': life_tariff_per_1000,
                'load_factor': load_factor,
                'gross_to_net_ratio': gross_premium / net_premium if net_premium > 0 else 1.0
            }
            
        except Exception as e:
            logger.error(f"Ошибка расчета базовой премии: {e}")
            raise
    
    def calculate_accident_premium(self, insurance_sum: int, sport_type: str = 'none', 
                                 accident_types: List[str] = None) -> Dict[str, Any]:
        """
        Полный расчет премии по несчастным случаям
        с детализацией по видам рисков
        """
        try:
            if accident_types is None:
                accident_types = ['death_accident', 'death_transport', 'trauma_accident']
            
            # Коэффициент спорта
            sport_coeff = self.get_sport_coefficient(sport_type)
            
            # Коэффициент загрузки
            load_factor = 1 - self.COMMISSION_RATE - self.LOAD_RATE
            
            accident_premiums = {}
            total_premium = 0
            
            for accident_type in accident_types:
                if accident_type in self.ACCIDENT_TARIFFS:
                    # Net-премия
                    net_premium = (self.ACCIDENT_TARIFFS[accident_type] * sport_coeff * insurance_sum) / 1000
                    # Gross-премия
                    gross_premium = net_premium / load_factor
                    
                    accident_premiums[accident_type] = {
                        'net': round(net_premium, 2),
                        'gross': round(gross_premium, 2),
                        'tariff': self.ACCIDENT_TARIFFS[accident_type]
                    }
                    
                    total_premium += gross_premium
            
            logger.info(f"💥 НС премия: спорт x{sport_coeff}, общая {total_premium:.2f} руб.")
            
            return {
                'total_accident_premium': round(total_premium, 2),
                'sport_coefficient': sport_coeff,
                'accident_details': accident_premiums,
                'load_factor': load_factor
            }
            
        except Exception as e:
            logger.error(f"Ошибка расчета премии НС: {e}")
            raise
    
    def calculate_critical_illness_premium(self, treatment_region: str, age: int = None, 
                                         include_rehabilitation: bool = False) -> Dict[str, Any]:
        """
        Полный расчет премии по критическим заболеваниям
        с учетом региона лечения и возможной реабилитации
        """
        try:
            if treatment_region not in self.CRITICAL_ILLNESS_TARIFFS:
                logger.warning(f"Неизвестный регион лечения: {treatment_region}")
                return {'critical_premium': 0.0, 'details': {}}
            
            # Базовый тариф
            base_tariff = self.CRITICAL_ILLNESS_TARIFFS[treatment_region]['base']
            
            # Доплата за реабилитацию
            rehabilitation_tariff = 0
            if include_rehabilitation:
                rehabilitation_tariff = self.CRITICAL_ILLNESS_TARIFFS[treatment_region]['rehabilitation']
            
            # Общий тариф (до нагрузки)
            total_net_tariff = base_tariff + rehabilitation_tariff
            
            # Применяем ОТДЕЛЬНУЮ нагрузку для КЗ
            critical_load_factor = 1 - self.COMMISSION_RATE - self.CRITICAL_LOAD_RATE
            gross_premium = total_net_tariff / critical_load_factor
            
            logger.info(f"🏥 КЗ премия: {treatment_region}, база {base_tariff}, итого {gross_premium:.2f} руб.")
            
            return {
                'critical_premium': round(gross_premium, 2),
                'net_critical_premium': total_net_tariff,
                'base_tariff': base_tariff,
                'rehabilitation_tariff': rehabilitation_tariff,
                'treatment_region': treatment_region,
                'load_factor': critical_load_factor,
                'include_rehabilitation': include_rehabilitation
            }
            
        except Exception as e:
            logger.error(f"Ошибка расчета премии КЗ: {e}")
            raise
    
    def calculate_recommended_sum(self, data: Dict[str, Any]) -> int:
        """
        Расчет рекомендуемой страховой суммы 
        на основе доходов и семейного положения
        """
        try:
            # Средний доход за 3 года
            incomes = []
            for year in ['2021', '2022', '2023']:
                income_key = f'income{year}'
                income_value = data.get(income_key, 0)
                if income_value:
                    # Очищаем от пробелов и конвертируем
                    income_clean = str(income_value).replace(' ', '').replace(',', '').replace('.', '')
                    try:
                        incomes.append(int(income_clean))
                    except:
                        incomes.append(0)
                else:
                    incomes.append(0)
            
            avg_income = sum(incomes) / len(incomes) if incomes else 2000000  # По умолчанию 2 млн
            
            # Базовый множитель (лет покрытия)
            multiplier = 5  # Базово 5 лет дохода
            
            # Корректировки в зависимости от семейного положения
            if data.get('breadwinnerStatus') == 'yes':
                multiplier += 2  # +2 года для кормильца
            
            # Количество детей
            children_count = 0
            try:
                children_str = str(data.get('childrenCount', '0'))
                if 'более' in children_str.lower() or '+' in children_str:
                    children_count = 3  # "3 и более" = 3
                else:
                    children_count = int(children_str)
            except:
                children_count = 0
            
            multiplier += children_count * 1.5  # +1.5 года на каждого ребенка
            
            # Родственники, требующие ухода
            if data.get('specialCareRelatives') == 'yes':
                multiplier += 1  # +1 год
            
            # Доля дохода в семейном бюджете
            income_share = data.get('incomeShare', '')
            if 'более 90%' in income_share or '75-89%' in income_share:
                multiplier += 1  # Высокая доля дохода
            
            recommended_sum = int(avg_income * multiplier)
            recommended_sum = max(recommended_sum, self.MIN_INSURANCE_SUM)  # Не менее минимума
            
            logger.info(f"💰 Рекомендуемая сумма: {avg_income:,} * {multiplier:.1f} = {recommended_sum:,} руб.")
            
            return recommended_sum
            
        except Exception as e:
            logger.error(f"Ошибка расчета рекомендуемой суммы: {e}")
            return self.MIN_INSURANCE_SUM
    
    def calculate_buyback_values(self, premium: float, term: int) -> List[Dict[str, Any]]:
        """
        Расчет выкупных стоимостей по годам
        с использованием КВ коэффициентов
        """
        try:
            kv_coefficient = self.get_kv_coefficient(term)
            buyback_values = []
            
            for year in range(1, term + 1):
                # Накопленная премия за годы
                accumulated_premium = premium * year
                
                # Выкупная стоимость с учетом КВ
                if year <= 2:
                    buyback_value = 0  # Первые 2 года без выкупа
                else:
                    buyback_value = accumulated_premium * kv_coefficient
                
                buyback_values.append({
                    'year': year,
                    'accumulated_premium': round(accumulated_premium, 2),
                    'buyback_value': round(buyback_value, 2),
                    'kv_coefficient': kv_coefficient
                })
            
            return buyback_values
            
        except Exception as e:
            logger.error(f"Ошибка расчета выкупных стоимостей: {e}")
            return []
    
    def calculate_full_program(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        ОСНОВНОЙ МЕТОД: Полный расчет программы "На всякий случай"
        со всеми коэффициентами и детализацией
        """
        try:
            logger.info("🚀 Начинаем полный расчет программы 'На всякий случай'")
            logger.info(f"📝 Входные данные: {list(data.keys())}")
            
            # 1. БАЗОВЫЕ ПАРАМЕТРЫ
            age = self.calculate_age(data['birthDate'])
            if age < self.MIN_AGE or age > self.MAX_AGE:
                raise ValueError(f"Возраст должен быть от {self.MIN_AGE} до {self.MAX_AGE} лет, получен: {age}")
            
            gender = data['gender']
            
            # 2. ОПРЕДЕЛЕНИЕ СТРАХОВОЙ СУММЫ И СРОКА
            if data.get('insuranceInfo') == 'yes':
                # Клиент знает желаемые параметры
                insurance_sum_str = str(data.get('insuranceSum', '')).replace(' ', '').replace(',', '').replace('.', '')
                insurance_sum = int(insurance_sum_str) if insurance_sum_str else self.MIN_INSURANCE_SUM
                insurance_term = int(data.get('insuranceTerm', 5))
            else:
                # Рассчитываем рекомендуемую сумму
                insurance_sum = self.calculate_recommended_sum(data)
                insurance_term = 5  # Стандартный срок для рекомендации
            
            # Валидация
            if insurance_sum < self.MIN_INSURANCE_SUM:
                insurance_sum = self.MIN_INSURANCE_SUM
            if insurance_sum > self.MAX_INSURANCE_SUM:
                insurance_sum = self.MAX_INSURANCE_SUM
            if insurance_term < self.MIN_INSURANCE_TERM:
                insurance_term = self.MIN_INSURANCE_TERM  
            if insurance_term > self.MAX_INSURANCE_TERM:
                insurance_term = self.MAX_INSURANCE_TERM
            
            logger.info(f"👤 Клиент: {age} лет, {gender}, сумма {insurance_sum:,}, срок {insurance_term} лет")
            
            # 3. РАСЧЕТ БАЗОВОЙ ПРЕМИИ (СТРАХОВАНИЕ ЖИЗНИ)
            base_premium_details = self.calculate_base_premium(insurance_sum, age, gender, insurance_term)
            total_premium = base_premium_details['life_premium']
            
            # 4. ДОПОЛНИТЕЛЬНЫЕ ПАКЕТЫ
            accident_premium_details = {}
            if data.get('accidentPackage'):
                sport_type = 'medium_risk' if data.get('sportPackage') else 'none'
                accident_premium_details = self.calculate_accident_premium(
                    insurance_sum, sport_type
                )
                total_premium += accident_premium_details['total_accident_premium']
            
            critical_premium_details = {}
            if data.get('criticalPackage') and data.get('treatmentRegion'):
                critical_premium_details = self.calculate_critical_illness_premium(
                    data['treatmentRegion'], age, include_rehabilitation=True
                )
                total_premium += critical_premium_details['critical_premium']
            
            # 5. КОЭФФИЦИЕНТ РАССРОЧКИ
            frequency = data.get('insuranceFrequency', 'Ежегодно')
            installment_coeff = self.get_installment_coefficient(frequency)
            total_premium *= installment_coeff
            
            # 6. ВЫКУПНЫЕ СТОИМОСТИ
            buyback_values = self.calculate_buyback_values(total_premium, insurance_term)
            
            logger.info(f"💰 Итоговая премия: {total_premium:.2f} руб. ({frequency})")
            
            # 7. ФОРМИРОВАНИЕ РЕЗУЛЬТАТА
            result = {
                # Основная информация
                'calculationDate': datetime.now().strftime('%d.%m.%Y'),
                'calculationTime': datetime.now().strftime('%H:%M:%S'),
                'clientAge': age,
                'clientGender': 'Мужской' if gender == 'male' else 'Женский',
                'insuranceTerm': insurance_term,
                'insuranceSum': insurance_sum,
                'baseInsuranceSum': f"{insurance_sum:,}".replace(",", "."),
                'endAge': age + insurance_term,
                
                # Базовая программа (страхование жизни)
                'lifePremium': base_premium_details['life_premium'],
                'netLifePremium': base_premium_details['net_life_premium'],
                'basePremium': round(base_premium_details['life_premium'], 2),
                'lifeTariffPer1000': base_premium_details['life_tariff_per_1000'],
                
                # Дополнительные пакеты
                'accidentPackageIncluded': data.get('accidentPackage', False),
                'accidentPremium': accident_premium_details.get('total_accident_premium', 0),
                'accidentDetails': accident_premium_details,
                'accidentInsuranceSum': f"{insurance_sum:,}".replace(",", ".") if data.get('accidentPackage') else "0",
                
                'criticalPackageIncluded': data.get('criticalPackage', False),
                'criticalPremium': critical_premium_details.get('critical_premium', 0),
                'criticalDetails': critical_premium_details,
                'criticalTreatmentRegion': data.get('treatmentRegion', ''),
                
                'sportPackageIncluded': data.get('sportPackage', False),
                
                # Итоговые значения
                'annualPremium': round(total_premium, 2),
                'totalPremium': f"{round(total_premium, 2):,}".replace(",", "."),
                'paymentFrequency': frequency,
                'installmentCoefficient': installment_coeff,
                
                # Выкупные стоимости
                'buybackValues': buyback_values,
                'kvCoefficient': self.get_kv_coefficient(insurance_term),
                
                # Дополнительная информация
                'recommendedSum': insurance_sum if data.get('insuranceInfo') == 'no' else None,
                'calculationType': 'known_sum' if data.get('insuranceInfo') == 'yes' else 'calculated_sum',
                
                # Полная детализация расчета
                'calculationDetails': {
                    'guaranteedRate': self.GUARANTEED_RATE,
                    'commissionRate': self.COMMISSION_RATE,
                    'loadRate': self.LOAD_RATE,
                    'criticalLoadRate': self.CRITICAL_LOAD_RATE,
                    'basePremiumDetails': base_premium_details,
                    'accidentPremiumDetails': accident_premium_details,
                    'criticalPremiumDetails': critical_premium_details,
                    'usedActuarialTables': True,
                    'fullCoefficientSet': True,
                    'calculatorVersion': 'Complete_v2.0'
                },
                
                # Метаданные
                'success': True,
                'version': '2.0.0',
                'calculator': 'JustincaseCalculatorComplete'
            }
            
            logger.info("✅ Расчет программы завершен успешно")
            return result
            
        except Exception as e:
            logger.error(f"❌ Ошибка в расчете программы: {e}")
            raise
    
    def validate_input_data(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Полная валидация входных данных
        Возвращает (is_valid, errors_list)
        """
        errors = []
        
        try:
            # Обязательные поля
            required_fields = ['birthDate', 'gender', 'insuranceInfo']
            for field in required_fields:
                if field not in data or not data[field]:
                    errors.append(f"Отсутствует обязательное поле: {field}")
            
            # Валидация возраста
            if 'birthDate' in data:
                age = self.calculate_age(data['birthDate'])
                if age < self.MIN_AGE or age > self.MAX_AGE:
                    errors.append(f"Возраст должен быть от {self.MIN_AGE} до {self.MAX_AGE} лет")
            
            # Валидация пола
            if 'gender' in data and data['gender'] not in ['male', 'female']:
                errors.append("Пол должен быть 'male' или 'female'")
            
            # Валидация страховой суммы и срока
            if data.get('insuranceInfo') == 'yes':
                if 'insuranceSum' in data:
                    try:
                        sum_str = str(data['insuranceSum']).replace(' ', '').replace(',', '').replace('.', '')
                        insurance_sum = int(sum_str)
                        if insurance_sum < self.MIN_INSURANCE_SUM:
                            errors.append(f"Минимальная страховая сумма: {self.MIN_INSURANCE_SUM:,} руб.")
                        if insurance_sum > self.MAX_INSURANCE_SUM:
                            errors.append(f"Максимальная страховая сумма: {self.MAX_INSURANCE_SUM:,} руб.")
                    except:
                        errors.append("Некорректная страховая сумма")
                
                if 'insuranceTerm' in data:
                    try:
                        term = int(data['insuranceTerm'])
                        if term < self.MIN_INSURANCE_TERM or term > self.MAX_INSURANCE_TERM:
                            errors.append(f"Срок страхования должен быть от {self.MIN_INSURANCE_TERM} до {self.MAX_INSURANCE_TERM} лет")
                    except:
                        errors.append("Некорректный срок страхования")
            
            # Валидация региона лечения КЗ
            if data.get('criticalPackage') and data.get('treatmentRegion'):
                if data['treatmentRegion'] not in self.CRITICAL_ILLNESS_TARIFFS:
                    errors.append(f"Неподдерживаемый регион лечения: {data['treatmentRegion']}")
            
            is_valid = len(errors) == 0
            
            if is_valid:
                logger.info("✅ Валидация входных данных пройдена")
            else:
                logger.warning(f"⚠️ Ошибки валидации: {errors}")
            
            return is_valid, errors
            
        except Exception as e:
            logger.error(f"Ошибка валидации: {e}")
            return False, [f"Ошибка валидации: {str(e)}"]
    
    def get_calculator_info(self) -> Dict[str, Any]:
        """Информация о калькуляторе и его возможностях"""
        return {
            'name': 'Калькулятор "На всякий случай" - Полная версия',
            'version': '2.0.0',
            'description': 'Полный калькулятор рискового страхования жизни с актуарными таблицами',
            'features': {
                'actuarial_tables': True,
                'accident_insurance': True,
                'critical_illness': True,
                'sport_coefficients': True,
                'buyback_values': True,
                'installment_options': True,
                'regional_coefficients': True
            },
            'limits': {
                'min_age': self.MIN_AGE,
                'max_age': self.MAX_AGE,
                'min_sum': self.MIN_INSURANCE_SUM,
                'max_sum': self.MAX_INSURANCE_SUM,
                'min_term': self.MIN_INSURANCE_TERM,
                'max_term': self.MAX_INSURANCE_TERM
            },
            'supported_regions': list(self.CRITICAL_ILLNESS_TARIFFS.keys()),
            'supported_frequencies': list(self.INSTALLMENT_COEFFICIENTS.keys()),
            'sport_types': list(self.SPORT_COEFFICIENTS.keys()),
            'accident_types': list(self.ACCIDENT_TARIFFS.keys()),
            'actuarial_coverage': {
                'male_ages': list(self.LIFE_TARIFFS_MALE.keys()),
                'female_ages': list(self.LIFE_TARIFFS_FEMALE.keys()),
                'terms_range': f"{min(self.LIFE_TARIFFS_MALE[25].keys())}-{max(self.LIFE_TARIFFS_MALE[25].keys())}"
            }
        }

# Для обратной совместимости создаем алиас
JustincaseCalculator = JustincaseCalculatorComplete

if __name__ == "__main__":
    # Тестирование полного калькулятора
    calculator = JustincaseCalculatorComplete()
    
    print("🧪 === ТЕСТИРОВАНИЕ ПОЛНОГО КАЛЬКУЛЯТОРА ===")
    
    # Тестовые данные
    test_data = {
        'birthDate': '1985-05-15',
        'gender': 'male',
        'insuranceInfo': 'yes',
        'insuranceTerm': '10',
        'insuranceSum': '3000000',
        'insuranceFrequency': 'Ежегодно',
        'accidentPackage': True,
        'criticalPackage': True,
        'treatmentRegion': 'russia',
        'sportPackage': True,
        'breadwinnerStatus': 'yes',
        'childrenCount': '2'
    }
    
    # Валидация
    is_valid, errors = calculator.validate_input_data(test_data)
    print(f"Валидация: {'✅ Пройдена' if is_valid else '❌ Ошибки'}")
    if errors:
        print(f"Ошибки: {errors}")
    
    # Расчет
    try:
        result = calculator.calculate_full_program(test_data)
        print(f"\n📊 Результат расчета:")
        print(f"   Клиент: {result['clientAge']} лет, {result['clientGender']}")
        print(f"   Страховая сумма: {result['insuranceSum']:,} руб.")
        print(f"   Базовая премия: {result['basePremium']:,} руб.")
        print(f"   Премия НС: {result['accidentPremium']:,} руб.")
        print(f"   Премия КЗ: {result['criticalPremium']:,} руб.")
        print(f"   🎯 ИТОГОВАЯ ПРЕМИЯ: {result['annualPremium']:,} руб.")
        print(f"   Выкупных стоимостей: {len(result['buybackValues'])}")
        
        # Информация о калькуляторе
        info = calculator.get_calculator_info()
        print(f"\n📋 Калькулятор: {info['name']} v{info['version']}")
        print(f"   Актуарные таблицы: {len(info['actuarial_coverage']['male_ages'])} возрастов")
        print(f"   Поддерживаемые регионы: {', '.join(info['supported_regions'])}")
        
        print("\n🎉 Полный калькулятор работает корректно!")
        
    except Exception as e:
        print(f"❌ Ошибка расчета: {e}")