# polls_routes.py

from flask import request, jsonify
from poll_manager import poll_manager

def register_poll_routes(app, socketio):
    @app.route('/api/poll', methods=['GET'])
    def get_poll():
        return jsonify(poll_manager.snapshot()), 200

    @app.route('/api/poll/vote', methods=['POST'])
    def vote():
        data = request.get_json(force=True)
        idx = data.get('index')
        if not isinstance(idx, int) or not poll_manager.vote(idx):
            return jsonify(success=False, error="Invalid index"), 400

        # рассылаем обновлённые результаты всем подключённым клиентам
        socketio.emit(
            'pollResults',
            poll_manager.snapshot(),
            broadcast=True
        )
        return jsonify(success=True, options=poll_manager.snapshot()), 200

    @app.route('/api/poll/reset', methods=['POST'])
    def reset_poll():
        poll_manager.reset()
        # сначала снимаем локальный voted у всех клиентов
        socketio.emit('pollReset', broadcast=True)
        # затем присылаем новую «чистую» статистику
        socketio.emit(
            'pollResults',
            poll_manager.snapshot(),
            broadcast=True
        )
        return jsonify(success=True), 200

