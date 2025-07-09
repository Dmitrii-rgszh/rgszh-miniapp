# polls_ws.py - ИСПРАВЛЕННАЯ ВЕРСИЯ для правильной синхронизации

from flask_socketio import emit, join_room, leave_room
from poll_manager import poll_manager
import logging

logger = logging.getLogger("polls_ws")

def register_poll_ws(socketio):
    
    @socketio.on('connect')
    def on_connect():
        logger.info(f"🔌 Клиент подключен: {request.sid}")
    
    @socketio.on('disconnect')
    def on_disconnect():
        logger.info(f"🔌 Клиент отключен: {request.sid}")
    
    @socketio.on('joinPoll')
    def on_join(_data=None):
        logger.info(f"👥 Клиент {request.sid} присоединился к опросу")
        
        # Добавляем клиента в комнату опроса
        join_room('poll_room')
        
        # При подключении сразу отдаём текущее состояние
        opts = poll_manager.snapshot()
        total = sum(o["votes"] for o in opts)
        
        logger.info(f"📊 Отправляем текущее состояние: {total} голосов")
        emit('pollResults', {"options": opts, "total": total})
    
    @socketio.on('newVote')
    def on_new_vote(data):
        logger.info(f"🗳️ Получен голос от {request.sid}: {data}")
        
        # Извлекаем индекс
        idx = data.get('index') if isinstance(data, dict) else data
        
        if isinstance(idx, int) and poll_manager.vote(idx):
            logger.info(f"✅ Голос учтен для опции {idx}")
            
            # Получаем обновленные результаты
            opts = poll_manager.snapshot()
            total = sum(o["votes"] for o in opts)
            
            # ✅ ВАЖНО: Рассылаем ВСЕМ клиентам в комнате, включая отправителя
            socketio.emit('pollResults', {"options": opts, "total": total}, room='poll_room')
            
            logger.info(f"📡 Результаты разосланы всем клиентам: {total} голосов")
        else:
            logger.warning(f"❌ Неверный индекс голоса: {idx}")
            emit('error', {"message": "Неверный индекс голоса"})
    
    @socketio.on('resetPoll')
    def on_reset(_data=None):
        logger.info(f"🔄 Сброс опроса от {request.sid}")
        
        # Сбрасываем на сервере
        poll_manager.reset()
        
        # ✅ ВАЖНО: Сначала говорим всем о сбросе
        socketio.emit('pollReset', room='poll_room')
        
        # Затем отправляем обновленные (пустые) результаты
        opts = poll_manager.snapshot()
        total = sum(o["votes"] for o in opts)
        socketio.emit('pollResults', {"options": opts, "total": total}, room='poll_room')
        
        logger.info("📡 Сброс разослан всем клиентам")
    
    @socketio.on('error')
    def on_error(error):
        logger.error(f"❌ Socket.IO ошибка от {request.sid}: {error}")
    
    # Дополнительный обработчик для отладки
    @socketio.on('ping')
    def on_ping(data):
        logger.info(f"🏓 Ping от {request.sid}")
        emit('pong', {'timestamp': data.get('timestamp')})

# Глобальная функция для отправки обновлений (для HTTP API)
def broadcast_poll_update(socketio):
    """Отправляет обновленные результаты всем подключенным клиентам"""
    try:
        opts = poll_manager.snapshot()
        total = sum(o["votes"] for o in opts)
        
        socketio.emit('pollResults', {"options": opts, "total": total}, room='poll_room')
        logger.info(f"📡 Broadcast: отправлены результаты всем клиентам ({total} голосов)")
        
    except Exception as e:
        logger.error(f"❌ Ошибка broadcast: {e}")

def broadcast_poll_reset(socketio):
    """Отправляет сброс всем подключенным клиентам"""
    try:
        socketio.emit('pollReset', room='poll_room')
        
        opts = poll_manager.snapshot()
        total = sum(o["votes"] for o in opts)
        socketio.emit('pollResults', {"options": opts, "total": total}, room='poll_room')
        
        logger.info("📡 Broadcast: сброс отправлен всем клиентам")
        
    except Exception as e:
        logger.error(f"❌ Ошибка broadcast reset: {e}")




