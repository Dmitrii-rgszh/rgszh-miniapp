# email_sender.py - УПРОЩЕННАЯ ВЕРСИЯ БЕЗ EXCEL ВЛОЖЕНИЙ

import logging
import requests
import json
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import text

logger = logging.getLogger("email_sender")

def get_candidate_from_db(candidate_id: int) -> Optional[Dict[str, Any]]:
    """
    Получает данные кандидата из базы данных
    
    Args:
        candidate_id: ID кандидата в таблице assessment_candidates
        
    Returns:
        Dict с данными кандидата или None если не найден
    """
    try:
        from db_saver import db
        
        # Получаем данные кандидата из БД
        query = text("""
            SELECT 
                id, surname, first_name, patronymic, full_name,
                total_score, percentage,
                innovator_score, optimizer_score, executor_score,
                transcription, completion_time_minutes, created_at
            FROM assessment_candidates 
            WHERE id = :candidate_id
            LIMIT 1
        """)
        
        result = db.session.execute(query, {"candidate_id": candidate_id})
        row = result.fetchone()
        
        if not row:
            logger.error(f"❌ Candidate with ID {candidate_id} not found in database")
            return None
        
        # Формируем данные кандидата
        candidate_data = {
            "id": row.id,
            "surname": row.surname,
            "first_name": row.first_name,
            "patronymic": row.patronymic or "",
            "full_name": row.full_name,
            "total_score": row.total_score,
            "percentage": float(row.percentage) if row.percentage else 0.0,
            "innovator_score": row.innovator_score,
            "optimizer_score": row.optimizer_score,
            "executor_score": row.executor_score,
            "transcription": row.transcription or "Расшифровка не доступна",
            "completion_time_minutes": row.completion_time_minutes or 0,
            "created_at": row.created_at
        }
        
        logger.info(f"✅ Retrieved candidate data for {candidate_data['full_name']}")
        return candidate_data
        
    except Exception as e:
        logger.error(f"❌ Error getting candidate from database: {e}")
        return None

def process_new_candidate_notification(candidate_data: Dict[str, Any]) -> bool:
    """
    Отправляет уведомление о новом кандидате менеджеру (только текст, без вложений)
    
    Args:
        candidate_data: Данные кандидата (должен содержать 'id' или все поля)
    
    Returns:
        bool: True если уведомление обработано успешно
    """
    try:
        # Если передан только ID, получаем полные данные из БД
        if 'id' in candidate_data and len(candidate_data) <= 3:
            candidate_id = candidate_data['id']
            logger.info(f"📋 Getting full candidate data from DB for ID: {candidate_id}")
            full_candidate_data = get_candidate_from_db(candidate_id)
            if not full_candidate_data:
                logger.error(f"❌ Could not get candidate data from DB for ID: {candidate_id}")
                return False
            candidate_data = full_candidate_data
        
        logger.info(f"📧 Preparing notification for candidate: {candidate_data.get('full_name', 'Unknown')}")
        
        # Формируем тему письма
        subject = f"Новый кандидат прошел опрос - {candidate_data.get('full_name', 'Неизвестно')}"
        
        # Форматируем дату
        created_at = candidate_data.get('created_at')
        if isinstance(created_at, str):
            date_str = created_at
        elif hasattr(created_at, 'strftime'):
            date_str = created_at.strftime('%d.%m.%Y %H:%M')
        else:
            date_str = str(created_at) if created_at else 'Не указано'
        
        # Формируем тело письма
        body_lines = [
            "Добрый день!",
            "",
            "Данные нового кандидата:",
            "",
            "=== ПЕРСОНАЛЬНАЯ ИНФОРМАЦИЯ ===",
            f"ID в БД: {candidate_data.get('id', 'Не указано')}",
            f"ФИО: {candidate_data.get('full_name', 'Не указано')}",
            "",
            "=== РЕЗУЛЬТАТЫ ОЦЕНКИ ===",
            f"Общий балл: {candidate_data.get('total_score', 0)} из 50",
            f"Процент: {candidate_data.get('percentage', 0)}%",
            "",
            "=== ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ ===",
            f"Время прохождения: {candidate_data.get('completion_time_minutes', 0)} минут",
            f"Дата прохождения: {date_str}",
            "",
            "=== РАСШИФРОВКА РЕЗУЛЬТАТА ===",
            f"{candidate_data.get('transcription', 'Не доступна')}",
            "",
            "---",
            "Автоматическое уведомление из MiniApp Telegram",
            "",
            "Для получения подробных данных всех кандидатов воспользуйтесь",
            "функцией экспорта в административной панели системы."
        ]
        
        body = "\r\n".join(body_lines)
        
        # ОТПРАВЛЯЕМ ПРОСТОЕ EMAIL БЕЗ ВЛОЖЕНИЙ
        try:
            from server import send_email
            success = send_email(subject, body)
            logger.info(f"📧 Email notification: {'✅ SUCCESS' if success else '❌ FAILED'}")
            
            # Логируем результат ОДИН РАЗ
            log_notification_attempt(candidate_data, success)
            
            return success
            
        except ImportError as e:
            logger.error(f"❌ Cannot import send_email function: {e}")
            # Fallback - просто логируем информацию
            fallback_notification_log(candidate_data)
            return True
        
    except Exception as e:
        logger.error(f"❌ Error in process_new_candidate_notification: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        fallback_notification_log(candidate_data)
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
        # Если уже есть full_name, используем его
        if candidate_data.get('full_name'):
            full_name = candidate_data['full_name']
        else:
            # Формируем из отдельных полей
            full_name = f"{candidate_data.get('surname', '')} {candidate_data.get('first_name', '')} {candidate_data.get('patronymic', '')}".strip()
        
        # Обеспечиваем наличие всех необходимых полей
        formatted_data = {
            "id": candidate_data.get("id"),
            "full_name": full_name,
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
    Логирует попытку отправки уведомления ОДИН РАЗ
    
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