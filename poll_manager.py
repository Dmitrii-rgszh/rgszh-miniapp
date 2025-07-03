# poll_manager.py

from threading import Lock

class PollManager:
    def __init__(self):
        self._lock = Lock()
        self._options = [
            {"text": "Чтобы отстал руководитель", "votes": 0},
            {"text": "Чтобы перевыполнить план и заработать много деняк", "votes": 0},
            {"text": "Чтобы победить в конкурсе и полетать на самолёте", "votes": 0},
            {"text": "Чтобы клиент меня любил сильнее, чем маму", "votes": 0},
            {"text": "Какого ещё маржа? Я не в курсе", "votes": 0},
        ]

    def snapshot(self):
        total = sum(o["votes"] for o in self._options) or 1
        return [
            {"text": o["text"], "votes": o["votes"]}
            for o in self._options
        ]

    def vote(self, idx: int) -> bool:
        with self._lock:
            if 0 <= idx < len(self._options):
                self._options[idx]["votes"] += 1
                return True
            return False

    def reset(self):
        with self._lock:
            for o in self._options:
                o["votes"] = 0

# единый экземпляр
poll_manager = PollManager()

