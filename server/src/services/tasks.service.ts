import { db } from '../db/index.js';
import { Task } from '../types/index.js';

export class TasksService {
  static getTasks(params: {
    locationId?: string;
    orgId?: string;
    status?: string;
    priority?: string;
  }): Task[] {
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const bindings: any[] = [];

    if (params.locationId) {
      sql += ' AND location_id = ?';
      bindings.push(params.locationId);
    }
    if (params.orgId) {
      sql += ' AND org_id = ?';
      bindings.push(params.orgId);
    }
    if (params.status) {
      sql += ' AND status = ?';
      bindings.push(params.status);
    }
    if (params.priority) {
      sql += ' AND priority = ?';
      bindings.push(params.priority);
    }

    sql += ` ORDER BY CASE priority 
      WHEN 'urgent' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      ELSE 4 
    END, due_date ASC`;
    const rows = db.prepare(sql).all(...bindings) as any[];
    return rows.map(this.mapTask);
  }

  static getTask(taskId: string): Task | null {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!row) return null;
    return this.mapTask(row);
  }

  static createTask(data: Omit<Task, 'id' | 'createdAt'>): Task {
    const id = `task-${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO tasks (
        id, org_id, location_id, title, description, priority, status, assignee_name,
        due_date, source_category, source_id, checklist, comments, created_at
      ) VALUES (
        @id, @orgId, @locationId, @title, @description, @priority, @status, @assigneeName,
        @dueDate, @sourceCategory, @sourceId, @checklist, @comments, @createdAt
      )
    `).run({
      id,
      orgId: data.orgId,
      locationId: data.locationId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status || 'todo',
      assigneeName: data.assigneeName,
      dueDate: data.dueDate,
      sourceCategory: data.sourceCategory,
      sourceId: data.sourceId || null,
      checklist: JSON.stringify(data.checklist || []),
      comments: JSON.stringify(data.comments || []),
      createdAt
    });

    return this.getTask(id)!;
  }

  static updateTask(taskId: string, updates: Partial<Task>): Task {
    const current = this.getTask(taskId);
    if (!current) throw new Error('Task not found');

    const newStatus = updates.status || current.status;
    const completedAt = newStatus === 'done' && current.status !== 'done'
      ? new Date().toISOString()
      : (newStatus !== 'done' ? null : current.completedAt);

    db.prepare(`
      UPDATE tasks SET
        title = COALESCE(@title, title),
        description = COALESCE(@description, description),
        priority = COALESCE(@priority, priority),
        status = @status,
        assignee_name = COALESCE(@assigneeName, assignee_name),
        due_date = COALESCE(@dueDate, due_date),
        checklist = COALESCE(@checklist, checklist),
        comments = COALESCE(@comments, comments),
        completed_at = @completedAt
      WHERE id = @id
    `).run({
      id: taskId,
      title: updates.title ?? null,
      description: updates.description ?? null,
      priority: updates.priority ?? null,
      status: newStatus,
      assigneeName: updates.assigneeName ?? null,
      dueDate: updates.dueDate ?? null,
      checklist: updates.checklist ? JSON.stringify(updates.checklist) : null,
      comments: updates.comments ? JSON.stringify(updates.comments) : null,
      completedAt: completedAt || null
    });

    return this.getTask(taskId)!;
  }

  static toggleChecklistItem(taskId: string, itemId: string): Task {
    const task = this.getTask(taskId);
    if (!task) throw new Error('Task not found');

    const updatedChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, done: !item.done } : item
    );

    return this.updateTask(taskId, { checklist: updatedChecklist });
  }

  static addComment(taskId: string, author: string, text: string): Task {
    const task = this.getTask(taskId);
    if (!task) throw new Error('Task not found');

    const newComment = {
      id: `cm-${Date.now()}`,
      author,
      text,
      createdAt: new Date().toISOString()
    };

    return this.updateTask(taskId, { comments: [...task.comments, newComment] });
  }

  static deleteTask(taskId: string): boolean {
    const res = db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
    return res.changes > 0;
  }

  private static mapTask(r: any): Task {
    return {
      id: r.id,
      orgId: r.org_id,
      locationId: r.location_id,
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      assigneeName: r.assignee_name,
      dueDate: r.due_date,
      sourceCategory: r.source_category,
      sourceId: r.source_id,
      checklist: JSON.parse(r.checklist || '[]'),
      comments: JSON.parse(r.comments || '[]'),
      createdAt: r.created_at,
      completedAt: r.completed_at
    };
  }
}
