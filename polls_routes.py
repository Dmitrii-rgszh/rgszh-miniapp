# polls_routes.py

from flask import request, jsonify
from poll_manager import poll_manager
import logging

logger = logging.getLogger("polls_routes")

def register_poll_routes(app, socketio):
    @app.route('/api/poll', methods=['GET'])
    def get_poll():
        try:
            opts  = poll_manager.snapshot()
            total = sum(o["votes"] for o in opts)
            return jsonify({ "options": opts, "total": total }), 200
        except Exception as e:
            logger.error(f"Error in get_poll: {e}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route('/api/poll/vote', methods=['POST'])
    def vote():
        try:
            # Логируем входящие данные
            logger.info(f"Vote request headers: {request.headers}")
            logger.info(f"Vote request data: {request.data}")
            
            # Пытаемся получить JSON
            data = request.get_json(force=True)
            logger.info(f"Parsed vote data: {data}")
            
            # Проверяем наличие индекса
            if data is None:
                logger.error("No JSON data received")
                return jsonify({"success": False, "error": "No data provided"}), 400
                
            idx = data.get('index')
            logger.info(f"Vote index: {idx}, type: {type(idx)}")
            
            # Проверяем тип и валидность индекса
            if idx is None:
                logger.error("No index in data")
                return jsonify({"success": False, "error": "Index not provided"}), 400
                
            if not isinstance(idx, int):
                logger.error(f"Invalid index type: {type(idx)}")
                return jsonify({"success": False, "error": "Index must be an integer"}), 400
                
            # Пытаемся проголосовать
            if not poll_manager.vote(idx):
                logger.error(f"Vote failed for index {idx}")
                return jsonify({"success": False, "error": "Invalid index value"}), 400

            # Получаем обновленные результаты
            opts  = poll_manager.snapshot()
            total = sum(o["votes"] for o in opts)
            
            # Отправляем обновление через WebSocket
            socketio.emit('pollResults', { "options": opts, "total": total })
            
            logger.info(f"Vote successful for index {idx}")
            return jsonify({"success": True, "options": opts, "total": total}), 200
            
        except Exception as e:
            logger.error(f"Error in vote endpoint: {e}", exc_info=True)
            return jsonify({"success": False, "error": "Internal server error"}), 500

    @app.route('/api/poll/reset', methods=['POST'])
    def reset_poll():
        try:
            # сбрасываем результаты на сервере
            poll_manager.reset()
            # говорим клиентам: можно снова голосовать
            socketio.emit('pollReset')
            opts  = poll_manager.snapshot()
            total = sum(o["votes"] for o in opts)
            socketio.emit('pollResults', { "options": opts, "total": total })
            logger.info("Poll reset successful")
            return jsonify({"success": True}), 200
        except Exception as e:
            logger.error(f"Error in reset_poll: {e}")
            return jsonify({"success": False, "error": "Internal server error"}), 500






