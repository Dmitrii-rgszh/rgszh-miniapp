# polls_routes.py

from flask import request, jsonify
from poll_manager import poll_manager

def register_poll_routes(app, socketio):
    @app.route('/api/poll', methods=['GET'])
    def get_poll():
        opts  = poll_manager.snapshot()
        total = sum(o["votes"] for o in opts)
        return jsonify({ "options": opts, "total": total }), 200

    @app.route('/api/poll/vote', methods=['POST'])
    def vote():
        data = request.get_json(force=True)
        idx  = data.get('index')
        if not isinstance(idx, int) or not poll_manager.vote(idx):
            return jsonify(success=False, error="Invalid index"), 400

        opts  = poll_manager.snapshot()
        total = sum(o["votes"] for o in opts)
        socketio.emit('pollResults', { "options": opts, "total": total })
        return jsonify(success=True, options=opts, total=total), 200

    @app.route('/api/poll/reset', methods=['POST'])
    def reset_poll():
        # сбрасываем результаты на сервере
        poll_manager.reset()
        # говорим клиентам: можно снова голосовать
        socketio.emit('pollReset')
        opts  = poll_manager.snapshot()
        total = sum(o["votes"] for o in opts)
        socketio.emit('pollResults', { "options": opts, "total": total })
        return jsonify(success=True), 200






