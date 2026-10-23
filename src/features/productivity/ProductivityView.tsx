import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Save,
} from 'lucide-react';
import { NoteItem, TaskItem, TaskPriority, TaskStatus } from '@/types';
import { storageService } from '@/storage/db';
import { soundService } from '@/services/sound/soundService';

export const ProductivityView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks' | 'timers' | 'planner'>('tasks');

  // Tasks State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  // Notes State
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');

  // Timers State
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);

  const [timerSeconds, setTimerSeconds] = useState<number>(1500); // 25 min default
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Quick Scratchpad
  const [scratchpad, setScratchpad] = useState<string>(() => localStorage.getItem('jarvis_scratchpad') || '');

  // Load from IndexedDB on mount
  useEffect(() => {
    storageService.getAllTasks().then((loadedTasks) => {
      if (loadedTasks && loadedTasks.length > 0) {
        setTasks(loadedTasks);
      } else {
        // Initial sample tasks
        const initial: TaskItem[] = [
          {
            id: 'task-1',
            title: 'Verify MediaPipe local model assets',
            status: 'completed',
            priority: 'high',
            createdAt: Date.now() - 3600000,
          },
          {
            id: 'task-2',
            title: 'Calibrate webcam interaction boundary',
            status: 'in_progress',
            priority: 'medium',
            createdAt: Date.now(),
          },
        ];
        setTasks(initial);
        initial.forEach((t) => storageService.saveTask(t));
      }
    });

    storageService.getAllNotes().then((loadedNotes) => {
      if (loadedNotes && loadedNotes.length > 0) {
        setNotes(loadedNotes);
        setActiveNoteId(loadedNotes[0].id);
        setNoteTitle(loadedNotes[0].title);
        setNoteContent(loadedNotes[0].content);
      }
    });
  }, []);

  // Stopwatch Interval
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  // Countdown Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            soundService.playWarning();
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('LOCAL JARVIS Focus Timer', {
                body: 'Your focus session has completed!',
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Tasks actions
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    soundService.playClick();
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: newTaskPriority,
      createdAt: Date.now(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    await storageService.saveTask(newTask);
    setNewTaskTitle('');
  };

  const handleToggleTask = async (id: string) => {
    soundService.playClick();
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextStatus: TaskStatus = t.status === 'completed' ? 'todo' : 'completed';
        const u = { ...t, status: nextStatus, completedAt: nextStatus === 'completed' ? Date.now() : undefined };
        storageService.saveTask(u);
        return u;
      }
      return t;
    });
    setTasks(updated);
  };

  const handleDeleteTask = async (id: string) => {
    soundService.playClick();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await storageService.deleteTask(id);
  };

  // Notes actions
  const handleCreateNote = async () => {
    soundService.playClick();
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      category: 'General',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setNoteTitle(newNote.title);
    setNoteContent(newNote.content);
    await storageService.saveNote(newNote);
  };

  const handleSaveNote = async () => {
    if (!activeNoteId) return;
    soundService.playActionConfirm();
    const target = notes.find((n) => n.id === activeNoteId);
    if (!target) return;
    const updated: NoteItem = {
      ...target,
      title: noteTitle.trim() || 'Untitled Note',
      content: noteContent,
      updatedAt: Date.now(),
    };
    setNotes((prev) => prev.map((n) => (n.id === activeNoteId ? updated : n)));
    await storageService.saveNote(updated);
  };

  const handleDeleteNote = async (id: string) => {
    soundService.playClick();
    const filtered = notes.filter((n) => n.id !== id);
    setNotes(filtered);
    await storageService.deleteNote(id);
    if (activeNoteId === id) {
      if (filtered.length > 0) {
        setActiveNoteId(filtered[0].id);
        setNoteTitle(filtered[0].title);
        setNoteContent(filtered[0].content);
      } else {
        setActiveNoteId(null);
        setNoteTitle('');
        setNoteContent('');
      }
    }
  };

  const formatTimerTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full p-6 bg-slate-950 overflow-y-auto select-none space-y-6 text-slate-200">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            Productivity Suite
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Offline Tasks, Markdown Notes, Focus Timers & Scratchpad
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs font-mono">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'tasks' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            Checklists
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'notes' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('timers')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'timers' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            Timers & Laps
          </button>
        </div>
      </div>

      {/* TAB 1: Tasks / Checklists */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* New Task Input Form */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter new task or action item..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-cyan-500/30 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400 font-mono"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                className="bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none font-mono"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </form>

            {/* Task Items List */}
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 bg-slate-900/50 border rounded-xl flex items-center justify-between transition ${
                    task.status === 'completed'
                      ? 'border-slate-800 opacity-60'
                      : 'border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-cyan-500/40 hover:border-cyan-400'
                      }`}
                    >
                      {task.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                    <span
                      className={`text-xs font-mono ${
                        task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        task.priority === 'urgent'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500'
                          : task.priority === 'high'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-10 font-mono text-xs text-slate-500">
                  All tasks completed. Ready for new operations.
                </div>
              )}
            </div>
          </div>

          {/* Quick Scratchpad Sidebar */}
          <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-2xl flex flex-col space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center justify-between">
              <span>Quick Scratchpad</span>
              <span className="text-[10px] text-slate-500">Auto-saved</span>
            </span>
            <textarea
              value={scratchpad}
              onChange={(e) => {
                setScratchpad(e.target.value);
                localStorage.setItem('jarvis_scratchpad', e.target.value);
              }}
              placeholder="Drop fast notes, calculations, or clipboard snippets here..."
              className="flex-1 w-full bg-slate-950 border border-cyan-500/20 rounded-xl p-3 text-xs font-mono text-slate-300 outline-none focus:border-cyan-400 resize-none min-h-[220px]"
            />
          </div>
        </div>
      )}

      {/* TAB 2: Notes Editor */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
          {/* Notes Sidebar List */}
          <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-2xl flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">Notes List</span>
              <button
                onClick={handleCreateNote}
                className="p-1 hover:bg-cyan-500/20 text-cyan-400 rounded transition"
                title="Create Note"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 overflow-y-auto flex-1">
              {notes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    setActiveNoteId(n.id);
                    setNoteTitle(n.title);
                    setNoteContent(n.content);
                  }}
                  className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition border ${
                    activeNoteId === n.id
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900/40 border-transparent hover:border-cyan-500/20 text-slate-300'
                  }`}
                >
                  <span className="truncate font-mono">{n.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(n.id);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Active Editor */}
          <div className="md:col-span-2 p-5 bg-slate-900/40 border border-cyan-500/20 rounded-2xl flex flex-col space-y-3">
            {activeNoteId ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/10">
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note Title"
                    className="w-full bg-transparent font-bold text-base text-white outline-none"
                  />
                  <button
                    onClick={handleSaveNote}
                    className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 rounded font-mono text-xs transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Type your notes in Markdown or plain text..."
                  className="flex-1 w-full bg-slate-950/80 border border-cyan-500/20 rounded-xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-cyan-400 resize-none leading-relaxed"
                />
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-slate-500 font-mono text-xs">
                Select or create a note to begin editing.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Timers, Stopwatch & Focus */}
      {activeTab === 'timers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stopwatch */}
          <div className="p-6 bg-slate-900/40 border border-cyan-500/20 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">Precision Stopwatch</span>
            <div className="text-5xl font-mono font-bold text-white tracking-widest">
              {formatTimerTime(stopwatchSeconds)}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  soundService.playClick();
                  setIsStopwatchRunning(!isStopwatchRunning);
                }}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-mono text-xs font-bold transition ${
                  isStopwatchRunning
                    ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                    : 'bg-cyan-500 text-slate-950 shadow-hud-glow'
                }`}
              >
                {isStopwatchRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isStopwatchRunning ? 'PAUSE' : 'START'}
              </button>
              <button
                onClick={() => {
                  soundService.playClick();
                  setIsStopwatchRunning(false);
                  setStopwatchSeconds(0);
                }}
                className="p-2 border border-slate-700 hover:border-slate-500 text-slate-400 rounded-xl transition"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pomodoro Focus Timer */}
          <div className="p-6 bg-slate-900/40 border border-cyan-500/20 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">Pomodoro Focus Timer</span>
            <div className="text-5xl font-mono font-bold text-cyan-300 tracking-widest">
              {formatTimerTime(timerSeconds)}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  soundService.playClick();
                  setIsTimerRunning(!isTimerRunning);
                }}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-mono text-xs font-bold transition ${
                  isTimerRunning
                    ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                    : 'bg-cyan-500 text-slate-950 shadow-hud-glow'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isTimerRunning ? 'PAUSE' : 'START FOCUS'}
              </button>
              <button
                onClick={() => {
                  soundService.playClick();
                  setIsTimerRunning(false);
                  setTimerSeconds(1500); // Reset to 25m
                }}
                className="p-2 border border-slate-700 hover:border-slate-500 text-slate-400 rounded-xl transition"
                title="Reset to 25m"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 font-mono text-[11px]">
              <button
                onClick={() => setTimerSeconds(1500)}
                className="px-2 py-0.5 bg-slate-900 border border-cyan-500/20 rounded hover:border-cyan-400"
              >
                25m
              </button>
              <button
                onClick={() => setTimerSeconds(3000)}
                className="px-2 py-0.5 bg-slate-900 border border-cyan-500/20 rounded hover:border-cyan-400"
              >
                50m
              </button>
              <button
                onClick={() => setTimerSeconds(300)}
                className="px-2 py-0.5 bg-slate-900 border border-cyan-500/20 rounded hover:border-cyan-400"
              >
                5m Break
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
