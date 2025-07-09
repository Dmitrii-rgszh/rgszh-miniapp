# polls_routes.py - ИСПРАВЛЕННАЯ ВЕРСИЯ с правильным broadcast

from flask import request, jsonify
from poll_manager import poll_manager
import logging

logger = logging.getLogger("polls_routes")

def register_poll_routes(app, socketio):
    
    @app.route('/api/poll', methods=['GET'])
    def get_poll():
        """Получить текущее состояние опроса"""
        try:
            opts = poll_manager.snapshot()
            total = sum(o["votes"] for o in opts)
            
            logger.info(f"📊 GET /api/poll: {total} голосов")
            return jsonify({"options": opts, "total": total}), 200
            
        except Exception as e:
            logger.error(f"❌ Ошибка GET /api/poll: {e}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route('/api/poll/vote', methods=['POST'])
    def vote():
        """Проголосовать за опцию"""
        try:
            data = request.get_json(force=True)
            idx = data.get('index')
            
            logger.info(f"🗳️ POST /api/poll/vote: индекс {idx}")
            
            if not isinstance(idx, int) or not poll_manager.vote(idx):
                logger.warning(f"❌ Неверный индекс: {idx}")
                return jsonify(success=False, error="Invalid index"), 400

            # Получаем обновленные результаты
            opts = poll_manager.snapshot()
            total = sum(o["votes"] for o in opts)
            
            # ✅ ВАЖНО: Рассылаем обновления ВСЕМ подключенным клиентам
            try:
                socketio.emit('pollResults', {"options": opts, "total": total}, room='poll_room')
                logger.info(f"📡 Результаты разосланы через Socket.IO: {total} голосов")
            except Exception as e:
                logger.error(f"❌ Ошибка Socket.IO broadcast: {e}")
            
            return jsonify(success=True, options=opts, total=total), 200
            
        except Exception as e:
            logger.error(f"❌ Ошибка POST /api/poll/vote: {e}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route('/api/poll/reset', methods=['POST'])
    def reset_poll():
        """Сбросить результаты опроса"""
        try:
            logger.info("🔄 POST /api/poll/reset")
            
            # Сбрасываем результаты на сервере
            poll_manager.reset()
            
            # ✅ ВАЖНО: Рассылаем сброс ВСЕМ подключенным клиентам
            try:
                # Сначала сброс
                socketio.emit('pollReset', room='poll_room')
                
                # Затем обновленные результаты
                opts = poll_manager.snapshot()
                total = sum(o["votes"] for o in opts)
                socketio.emit('pollResults', {"options": opts, "total": total}, room='poll_room')
                
                logger.info("📡 Сброс разослан через Socket.IO")
            except Exception as e:
                logger.error(f"❌ Ошибка Socket.IO broadcast reset: {e}")
            
            return jsonify(success=True), 200
            
        except Exception as e:
            logger.error(f"❌ Ошибка POST /api/poll/reset: {e}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route('/api/poll/status', methods=['GET'])
    def poll_status():
        """Получить статус опроса для отладки"""
        try:
            opts = poll_manager.snapshot()
            total = sum(o["votes"] for o in opts)
            
            # Получаем количество подключенных клиентов (если возможно)
            connected_clients = len(socketio.server.manager.get_participants('poll_room', '/')) if hasattr(socketio.server, 'manager') else 'unknown'
            
            return jsonify({
                "status": "active",
                "total_votes": total,
                "options_count": len(opts),
                "connected_clients": connected_clients,
                "options": opts
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Ошибка GET /api/poll/status: {e}")
            return jsonify({"error": "Internal server error"}), 500






