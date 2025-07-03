# polls_ws.py

from flask_socketio import emit
from poll_manager    import poll_manager

def register_poll_ws(socketio):
    @socketio.on('joinPoll')
    def on_join(_data=None):
        # при подключении сразу отдаём массив
        opts  = poll_manager.snapshot()
        total = sum(o["votes"] for o in opts)
        emit('pollResults', { "options": opts, "total": total })

    @socketio.on('newVote')
    def on_new_vote(data):
        # извлекаем индекс
        idx = data.get('index') if isinstance(data, dict) else data
        if isinstance(idx, int) and poll_manager.vote(idx):
            results = poll_manager.snapshot()
            # рассылаем новый массив всем клиентам
            opts  = poll_manager.snapshot()
            total = sum(o["votes"] for o in opts)
            socketio.emit('pollResults', { "options": opts, "total": total })

    @socketio.on('resetPoll')
    def on_reset(_data=None):
        # сбрасываем на сервере
        poll_manager.reset()
        # говорим клиентам, что можно снова голосовать
        socketio.emit('pollReset')
        opts  = poll_manager.snapshot()
        total = sum(o["votes"] for o in opts)
        socketio.emit('pollResults', { "options": opts, "total": total })




