from typing import Dict, Any, List
from app.models.domain import NeedCard

class TaskService:
    def __init__(self):
        self.TASKS_STORE: Dict[str, NeedCard] = {}

    def get_task(self, task_id: str) -> NeedCard:
        return self.TASKS_STORE.get(task_id)

    def set_task(self, task: NeedCard):
        self.TASKS_STORE[task.card_id] = task
        
    def list_tasks(self) -> List[NeedCard]:
        return list(self.TASKS_STORE.values())

task_service = TaskService()
