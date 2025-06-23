from flask_socketio import emit
from poll_manager    import poll_manager

def register_poll_ws(socketio):
    @socketio.on('joinPoll')
    def on_join(_data=None):
        # сразу отдаем текущее состояние
        emit('pollResults', {'options': poll_manager.snapshot()})

    @socketio.on('newVote')
    def on_new_vote(data):
        idx = data.get('index') if isinstance(data, dict) else data
        if isinstance(idx, int) and poll_manager.vote(idx):
            # вещаем всем клиентам обновлённые результаты
            socketio.emit('pollResults', {'options': poll_manager.snapshot()})

    @socketio.on('resetPoll')
    def on_reset(_data=None):
        # сбрасываем на 0 и вещаем всем
        poll_manager.reset()
        socketio.emit('pollResults', {'options': poll_manager.snapshot()})
