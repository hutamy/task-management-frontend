'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tasksAPI, Task } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus,
  LogOut,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  ListTodo,
  CircleDashed,
  Menu,
} from 'lucide-react';

interface TaskFormData {
  title: string;
  description: string;
  parent_id?: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    parent_id: undefined
  });
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchTasks();
  }, [router]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await tasksAPI.getTasks();
      setTasks(data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        toast.error('Failed to fetch tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        parent_id: task.parent_id
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        parent_id: undefined
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', parent_id: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title cannot be empty');
      return;
    }

    try {
      if (editingTask) {
        await tasksAPI.updateTask(editingTask.id, formData);
        toast.success('Task updated successfully!');
      } else {
        await tasksAPI.createTask(formData);
        toast.success('Task created successfully!');
      }
      closeModal();
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save task');
    }
  };

  const handleStatusChange = async (task: Task, newStatus: 'to do' | 'in progress' | 'done') => {
    try {
      await tasksAPI.updateTask(task.id, { status: newStatus });
      toast.success(`Task moved to ${newStatus}!`);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await tasksAPI.deleteTask(taskId);
      toast.success('Task deleted successfully!');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    toast.success('Logged out successfully!');
    router.push('/login');
  };

  const getAllTasks = () => {
    const flatTasks: Task[] = [];
    const flatten = (taskList: Task[]) => {
      taskList.forEach(task => {
        flatTasks.push(task);
        if (task.sub_tasks && task.sub_tasks.length > 0) {
          flatten(task.sub_tasks);
        }
      });
    };

    flatten(tasks);
    return flatTasks;
  };

  const getTasksByStatus = (status: 'to do' | 'in progress' | 'done') => {
    return getAllTasks().filter(task => task.status === status);
  };

  const getDescendantIds = (taskId: number): number[] => {
    const descendants: number[] = [];
    const allTasks = getAllTasks();

    const findDescendants = (parentId: number) => {
      const children = allTasks.filter(t => t.parent_id === parentId);
      children.forEach(child => {
        descendants.push(child.id);
        findDescendants(child.id);
      });
    };

    findDescendants(taskId);
    return descendants;
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: 'to do' | 'in progress' | 'done') => {
    e.preventDefault();
    if (!draggedTask) return;

    if (draggedTask.status !== newStatus) {
      await handleStatusChange(draggedTask, newStatus);
    }

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const parentTask = task.parent_id ? getAllTasks().find(t => t.id === task.parent_id) : null;

    return (
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-2 sm:mb-3 hover:shadow-md transition-all cursor-move group"
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-medium text-gray-500">TASK-{task.id}</span>
              {task.parent_id && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  ↳ TASK-{task.parent_id}
                </span>
              )}
            </div>
            <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base break-words">{task.title}</h3>
            {task.description && (
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 break-words">{task.description}</p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal(task);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded cursor-pointer flex-shrink-0 ml-2"
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {parentTask && (
              <span className="flex items-center gap-1 truncate">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {parentTask.title.substring(0, 15)}{parentTask.title.length > 15 ? '...' : ''}
                </span>
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTask(task.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded text-red-600 cursor-pointer flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const TaskColumn = ({
    status,
    title,
    icon
  }: {
    status: 'to do' | 'in progress' | 'done';
    title: string;
    icon: React.ReactNode;
  }) => {
    const tasks = getTasksByStatus(status);

    return (
      <div
        className="bg-gray-50 rounded-lg p-3 sm:p-4 min-h-[400px] sm:min-h-[500px] border border-gray-200"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
            {icon}
            {title}
            <span className="text-xs sm:text-sm font-normal text-gray-500">({tasks.length})</span>
          </h2>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No tasks</p>
              <p className="text-xs mt-2">Drag tasks here</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                alt="TaskFlow"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                className="h-6 sm:h-8 w-auto"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Task Board</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Manage your tasks efficiently</p>
              </div>
            </div>

            {/* Desktop buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition shadow-sm text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-md transition"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition text-sm w-full border border-gray-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <button
              onClick={() => {
                openModal();
                setIsMobileMenuOpen(false);
              }}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-2 mb-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition shadow-sm text-sm w-full"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                <div className="w-[85vw] flex-shrink-0">
                  <TaskColumn
                    status="to do"
                    title="TO DO"
                    icon={<ListTodo className="w-5 h-5 text-indigo-600" />}
                  />
                </div>
                <div className="w-[85vw] flex-shrink-0">
                  <TaskColumn
                    status="in progress"
                    title="IN PROGRESS"
                    icon={<CircleDashed className="w-5 h-5 text-orange-500" />}
                  />
                </div>
                <div className="w-[85vw] flex-shrink-0">
                  <TaskColumn
                    status="done"
                    title="DONE"
                    icon={<span className="text-green-600">✓</span>}
                  />
                </div>
              </div>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              <TaskColumn
                status="to do"
                title="TO DO"
                icon={<ListTodo className="w-5 h-5 text-indigo-600" />}
              />
              <TaskColumn
                status="in progress"
                title="IN PROGRESS"
                icon={<CircleDashed className="w-5 h-5 text-orange-500" />}
              />
              <TaskColumn
                status="done"
                title="DONE"
                icon={<span className="text-green-600">✓</span>}
              />
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 min-h-[120px]"
                  placeholder="Add a more detailed description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Task (Optional)
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="">None - This is a main task</option>
                  {getAllTasks()
                    .filter(t => {
                      if (!editingTask) return true;
                      // Exclude the task itself
                      if (t.id === editingTask.id) return false;
                      // Exclude all descendants (children, grandchildren, etc.)
                      const descendantIds = getDescendantIds(editingTask.id);
                      return !descendantIds.includes(t.id);
                    })
                    .map(task => (
                      <option key={task.id} value={task.id}>
                        TASK-{task.id}: {task.title}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a parent task to create a subtask relationship. Circular relationships are prevented.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition shadow-sm text-sm sm:text-base"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
