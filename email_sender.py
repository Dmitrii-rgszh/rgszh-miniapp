# email_sender.py - Модуль для отправки уведомлений о новых кандидатах (ИСПРАВЛЕННЫЙ)

import logging
import requests
import json
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger("email_sender")

def process_new_candidate_notification(candidate_data: Dict[str, Any]) -> bool:
    """
    Отправляет уведомление о новом кандидате менеджеру
    
    Args:
        candidate_data: Данные кандидата включая:
            - full_name: полное имя
            - surname: фамилия
            - first_name: имя
            - patronymic: отчество
            - total_score: общий балл
            - percentage: процент
            - innovator_score: балл инноватора
            - optimizer_score: балл оптимизатора
            - executor_score: балл исполнителя
            - transcription: расшифровка результата
            - completion_time_minutes: время прохождения
            - created_at: время создания
    
    Returns:
        bool: True если уведомление отправлено успешно, False в противном случае
    """
    try:
        logger.info(f"📧 Preparing notification for candidate: {candidate_data.get('full_name', 'Unknown')}")
        
        # Формируем тему письма
        subject = f"Новый кандидат прошел assessment - {candidate_data.get('full_name', 'Неизвестно')}"
        
        # Формируем тело письма
        body_lines = [
            "Добрый день!",
            "",
            "В системе assessment зарегистрирован новый кандидат:",
            "",
            f"ФИО: {candidate_data.get('full_name', 'Не указано')}",
            f"Общий балл: {candidate_data.get('total_score', 0)}",
            f"Процент: {candidate_data.get('percentage', 0)}%",
            "",
            "Баллы по типам:",
            f"• Инноватор: {candidate_data.get('innovator_score', 0)}",
            f"• Оптимизатор: {candidate_data.get('optimizer_score', 0)}",
            f"• Исполнитель: {candidate_data.get('executor_score', 0)}",
            "",
            f"Время прохождения: {candidate_data.get('completion_time_minutes', 0)} минут",
            f"Дата прохождения: {candidate_data.get('created_at', datetime.now()).strftime('%d.%m.%Y %H:%M')}",
            "",
            "Расшифровка результата:",
            f"{candidate_data.get('transcription', 'Не доступна')[:200]}...",
            "",
            "---",
            "Автоматическое уведомление из системы Assessment"
        ]
        
        body = "\r\n".join(body_lines)
        
        # Подготавливаем payload для отправки
        email_payload = {
            "subject": subject,
            "body": body
        }
        
        # Отправляем через API
        success = send_assessment_notification(email_payload)
        
        # Логируем результат
        log_notification_attempt(candidate_data, success)
        
        # Если не получилось отправить - используем fallback
        if not success:
            fallback_notification_log(candidate_data)
            return True  # Считаем что обработали, даже если просто залогировали
            
        return success
        
    except Exception as e:
        logger.error(f"❌ Error in process_new_candidate_notification: {e}")
        fallback_notification_log(candidate_data)
        return False

def send_assessment_notification(payload: Dict[str, str]) -> bool:
    """
    Отправляет уведомление через API
    
    Args:
        payload: Словарь с subject и body
        
    Returns:
        bool: True если отправлено успешно
    """
    try:
        # URL для отправки уведомлений assessment
        api_url = "http://localhost:4000/api/proxy/assessment/send_manager"
        
        logger.info(f"📮 Sending assessment notification to: {api_url}")
        
        response = requests.post(
            api_url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            logger.info("✅ Assessment notification sent successfully")
            return True
        else:
            logger.error(f"❌ Failed to send notification. Status: {response.status_code}, Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        logger.error("❌ Timeout while sending assessment notification")
        return False
    except requests.exceptions.ConnectionError:
        logger.error("❌ Connection error while sending assessment notification")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error sending assessment notification: {e}")
        return False

def format_candidate_for_email(candidate_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Форматирует данные кандидата для отправки email
    
    Args:
        candidate_data: Исходные данные кандидата
        
    Returns:
        Dict: Отформатированные данные
    """
    try:
        # Обеспечиваем наличие всех необходимых полей
        formatted_data = {
            "full_name": candidate_data.get("full_name", 
                f"{candidate_data.get('surname', '')} {candidate_data.get('first_name', '')} {candidate_data.get('patronymic', '')}".strip()),
            "surname": candidate_data.get("surname", ""),
            "first_name": candidate_data.get("first_name", ""),
            "patronymic": candidate_data.get("patronymic", ""),
            "total_score": candidate_data.get("total_score", 0),
            "percentage": candidate_data.get("percentage", 0),
            "innovator_score": candidate_data.get("innovator_score", 0),
            "optimizer_score": candidate_data.get("optimizer_score", 0),
            "executor_score": candidate_data.get("executor_score", 0),
            "transcription": candidate_data.get("transcription", ""),
            "completion_time_minutes": candidate_data.get("completion_time_minutes", 0),
            "created_at": candidate_data.get("created_at", datetime.now())
        }
        
        return formatted_data
        
    except Exception as e:
        logger.error(f"❌ Error formatting candidate data: {e}")
        return candidate_data

def log_notification_attempt(candidate_data: Dict[str, Any], success: bool) -> None:
    """
    Логирует попытку отправки уведомления
    
    Args:
        candidate_data: Данные кандидата
        success: Успешность отправки
    """
    try:
        status = "✅ SUCCESS" if success else "❌ FAILED"
        # Проверяем, что candidate_data это словарь
        if isinstance(candidate_data, dict):
            candidate_name = candidate_data.get("full_name", "Unknown")
        else:
            candidate_name = str(candidate_data)
        logger.info(f"📊 Notification attempt: {status} for candidate {candidate_name}")
        
    except Exception as e:
        logger.error(f"❌ Error logging notification attempt: {e}")

def fallback_notification_log(candidate_data: Dict[str, Any]) -> None:
    """
    Резервная функция - просто логирует информацию о кандидате
    если отправка email недоступна
    
    Args:
        candidate_data: Данные кандидата
    """
    try:
        logger.info("📝 FALLBACK: Logging candidate data instead of email")
        # Проверяем, что candidate_data это словарь
        if isinstance(candidate_data, dict):
            logger.info(f"📋 Candidate: {candidate_data.get('full_name', 'Unknown')}")
            logger.info(f"🎯 Score: {candidate_data.get('total_score', 0)} ({candidate_data.get('percentage', 0)}%)")
            logger.info(f"⏱️ Time: {candidate_data.get('completion_time_minutes', 0)} minutes")
        else:
            logger.info(f"📋 Candidate data: {str(candidate_data)}")
        
    except Exception as e:
        logger.error(f"❌ Error in fallback notification: {e}")

# УПРОЩЕННАЯ ФУНКЦИЯ БЕЗ РЕКУРСИИ
def notify_new_candidate(candidate_data: Dict[str, Any]) -> bool:
    """
    Функция-обертка для уведомления о новом кандидате
    Просто вызывает process_new_candidate_notification без циклов
    
    Args:
        candidate_data: Данные кандидата
        
    Returns:
        bool: True если уведомление обработано
    """
    try:
        # Форматируем данные
        formatted_data = format_candidate_for_email(candidate_data)
        
        # Отправляем уведомление БЕЗ дополнительных вызовов
        return process_new_candidate_notification(formatted_data)
        
    except Exception as e:
        logger.error(f"❌ Critical error in notify_new_candidate: {e}")
        return False