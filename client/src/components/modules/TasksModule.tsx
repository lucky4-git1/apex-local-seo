import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { Task } from '../../../../server/src/types/index.js';
import {
  CheckSquare,
  Plus,
  Trash2,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Calendar
} from 'lucide-react';

export const TasksModule: React.FC = () => {
  const { currentLocation, showToast } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // New task form state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high');
  const [assigneeName, setAssigneeName] = useState('Local SEO Specialist');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);

  useEffect(() => {
    if (currentLocation) {
      loadTasks();
    }
  }, [currentLocation?.id, statusFilter]);

  const loadTasks = async () => {
    if (!currentLocation) return;
    try {
      const res = await api.getTasks({
        locationId: currentLocation.id,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setTasks(res);
      if (res.length > 0 && !selectedTask) {
        setSelectedTask(res[0]);
      }
    } catch (err: any) {
      showToast(`Failed to load tasks: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!currentLocation || !title.trim()) return;
    try {
      await api.createTask({
        orgId: currentLocation.orgId,
        locationId: currentLocation.id,
        title,
        description,
        priority,
        status: 'todo',
        assigneeName,
        dueDate,
        sourceCategory: 'Operations'
      });
      showToast('Task created successfully!');
      setIsCreating(false);
      setTitle('');
      setDescription('');
      loadTasks();
    } catch (err: any) {
      showToast(`Failed to create task: ${err.message}`, 'error');
    }
  };

  const handleToggleChecklist = async (taskId: string, itemId: string) => {
    try {
      const updated = await api.toggleChecklist(taskId, itemId);
      setSelectedTask(updated);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: any) {
      showToast(`Failed to update checklist: ${err.message}`, 'error');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: any) => {
    try {
      const updated = await api.updateTask(taskId, { status: newStatus });
      setSelectedTask(updated);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast(`Task status updated to ${newStatus}!`);
    } catch (err: any) {
      showToast(`Status update failed: ${err.message}`, 'error');
    }
  };

  const handleAddComment = async (taskId: string) => {
    if (!commentInput.trim()) return;
    try {
      const updated = await api.addTaskComment(taskId, commentInput, 'Account Manager');
      setSelectedTask(updated);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setCommentInput('');
      showToast('Comment added.');
    } catch (err: any) {
      showToast(`Comment failed: ${err.message}`, 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      showToast('Task deleted.');
      setSelectedTask(null);
      loadTasks();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  if (!currentLocation) return null;

  return (
    <div className="d-flex flex-column gap-4">
      <div className="ops-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0">Actionable Task Management</h4>
            <span className="badge badge-demo">Linked Operations</span>
          </div>
          <div className="text-muted small mt-1">
            Track and verify audit remediations, review replies, and profile updates.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          >
            <Plus size={14} />
            <span>Create New Task</span>
          </button>
        </div>
      </div>

      <div className="row g-3">
        {/* Task List */}
        <div className="col-12 col-lg-5">
          <div className="ops-card h-100 divide-y">
            <div className="p-2 px-3 border-bottom d-flex align-items-center gap-1 bg-light">
              <button
                onClick={() => setStatusFilter('all')}
                className={`btn btn-xs btn-sm py-1 px-2 ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setStatusFilter('todo')}
                className={`btn btn-xs btn-sm py-1 px-2 ${statusFilter === 'todo' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                To-Do
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`btn btn-xs btn-sm py-1 px-2 ${statusFilter === 'in_progress' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                In Progress
              </button>
              <button
                onClick={() => setStatusFilter('done')}
                className={`btn btn-xs btn-sm py-1 px-2 ${statusFilter === 'done' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                Done
              </button>
            </div>

            <div className="divide-y overflow-y-auto" style={{ maxHeight: '700px' }}>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-3 border-bottom cursor-pointer ${
                    selectedTask?.id === task.id ? 'bg-primary bg-opacity-10 border-start border-primary border-3' : 'hover-bg-light'
                  }`}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span
                      className={`badge ${
                        task.priority === 'urgent'
                          ? 'badge-urgent'
                          : task.priority === 'high'
                          ? 'badge-high'
                          : 'badge-medium'
                      }`}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                    <span className="text-muted small">Due {task.dueDate}</span>
                  </div>

                  <h6 className="fw-bold text-dark small mb-1">{task.title}</h6>
                  <div className="text-muted small d-flex align-items-center gap-2">
                    <span>Assignee: {task.assigneeName}</span>
                    <span>•</span>
                    <span className="badge bg-light text-secondary border">{task.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="p-4 text-center text-muted">No tasks matching the selected filter.</div>
              )}
            </div>
          </div>
        </div>

        {/* Task Detail Inspector */}
        <div className="col-12 col-lg-7">
          <div className="ops-card h-100 p-4">
            {selectedTask ? (
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start justify-content-between gap-2 border-bottom pb-3">
                  <div>
                    <span
                      className={`badge mb-2 ${
                        selectedTask.priority === 'urgent'
                          ? 'badge-urgent'
                          : selectedTask.priority === 'high'
                          ? 'badge-high'
                          : 'badge-medium'
                      }`}
                    >
                      {selectedTask.priority.toUpperCase()} PRIORITY
                    </span>
                    <h5 className="fw-bold text-dark">{selectedTask.title}</h5>
                    <div className="text-muted small">
                      Assignee: <strong>{selectedTask.assigneeName}</strong> • Due: <strong>{selectedTask.dueDate}</strong>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <select
                      className="form-select form-select-sm fw-semibold"
                      style={{ width: '140px' }}
                      value={selectedTask.status}
                      onChange={(e) => handleStatusChange(selectedTask.id, e.target.value)}
                    >
                      <option value="todo">To-Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="done">Completed</option>
                    </select>
                    <button
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      className="btn btn-sm btn-outline-danger"
                      title="Delete Task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <h6 className="fw-bold small mb-1">Description & Evidence:</h6>
                  <div className="p-3 bg-light rounded text-secondary small" style={{ whiteSpace: 'pre-line' }}>
                    {selectedTask.description}
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <h6 className="fw-bold small mb-2">Remediation Checklist:</h6>
                  <div className="d-flex flex-column gap-2">
                    {selectedTask.checklist.map((item) => (
                      <div
                        key={item.id}
                        className="d-flex align-items-center gap-2 p-2 border rounded bg-white small"
                      >
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={item.done}
                          onChange={() => handleToggleChecklist(selectedTask.id, item.id)}
                        />
                        <span className={item.done ? 'text-decoration-line-through text-muted' : 'text-dark'}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                    {selectedTask.checklist.length === 0 && (
                      <div className="text-muted small">No subtasks defined.</div>
                    )}
                  </div>
                </div>

                {/* Comments */}
                <div className="border-top pt-3">
                  <h6 className="fw-bold small mb-2">Team Activity & Comments:</h6>
                  <div className="d-flex flex-column gap-2 mb-3">
                    {selectedTask.comments.map((cm) => (
                      <div key={cm.id} className="p-2 rounded bg-light border small">
                        <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                          <span className="fw-semibold text-dark">{cm.author}</span>
                          <span>{new Date(cm.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-secondary">{cm.text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Add an internal note or verification update..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(selectedTask.id)}
                    />
                    <button
                      onClick={() => handleAddComment(selectedTask.id)}
                      disabled={!commentInput.trim()}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center text-muted">Select a task from the list to view details.</div>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {isCreating && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Create Actionable Task</h5>
                <button type="button" className="btn-close" onClick={() => setIsCreating(false)} />
              </div>
              <div className="modal-body d-flex flex-column gap-3">
                <div>
                  <label className="form-label small fw-semibold">Task Title</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Add UTM parameters to profile website link"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label small fw-semibold">Description</label>
                  <textarea
                    rows={3}
                    className="form-control form-control-sm"
                    placeholder="Provide remediation steps and guidelines..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Priority</label>
                    <select
                      className="form-select form-select-sm"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Due Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label small fw-semibold">Assignee</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-light" onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleCreateTask}
                  disabled={!title.trim()}
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
