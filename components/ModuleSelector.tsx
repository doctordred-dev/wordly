'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { FolderOpen, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

interface Module {
  id: string;
  name: string;
  description: string | null;
  color: string;
  flashcard_count?: number;
}

interface ModuleSelectorProps {
  selectedModuleId: string | null;
  onModuleChange: (moduleId: string | null) => void;
  showAll?: boolean;
}

export default function ModuleSelector({ selectedModuleId, onModuleChange, showAll = true }: ModuleSelectorProps) {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleColor, setNewModuleColor] = useState('#5eb3f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const colors = [
    '#7fffd4', // mint
    '#5eb3f6', // cyan
    '#8b7ff6', // purple
    '#ff9ed8', // pink
    '#ffd700', // gold
    '#ff6b6b', // red
    '#4ecdc4', // teal
    '#95e1d3', // light green
  ];

  useEffect(() => {
    if (user) {
      loadModules();
    }
  }, [user]);

  const loadModules = async () => {
    if (!user) return;

    // Load modules with flashcard count
    const { data: modulesData, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (modulesError) {
      console.error('Error loading modules:', modulesError);
      return;
    }

    // Get flashcard counts for each module
    const modulesWithCounts = await Promise.all(
      (modulesData || []).map(async (module: any) => {
        const { count } = await supabase
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .eq('module_id', module.id);
        
        return { ...module, flashcard_count: count || 0 } as Module;
      })
    );

    setModules(modulesWithCounts);
  };

  const createModule = async () => {
    if (!user || !newModuleName.trim()) return;

    const { error } = await (supabase.from('modules') as any).insert({
      user_id: user.id,
      name: newModuleName.trim(),
      color: newModuleColor,
    });

    if (!error) {
      setNewModuleName('');
      setIsCreating(false);
      loadModules();
    }
  };

  const updateModule = async (id: string, name: string) => {
    const { error } = await (supabase
      .from('modules') as any)
      .update({ 
        name: name.trim(), 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      loadModules();
    }
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Delete this module? Flashcards will not be deleted, just unassigned.')) return;

    const { error } = await supabase.from('modules').delete().eq('id', id);

    if (!error) {
      if (selectedModuleId === id) {
        onModuleChange(null);
      }
      loadModules();
    }
  };

  return (
    <div className="glass-effect rounded-xl p-3 md:p-4 border border-white/20 mb-4 md:mb-6">
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm md:text-base font-semibold text-white">Modules</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {showAll && (
          <button
            onClick={() => onModuleChange(null)}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              selectedModuleId === null
                ? 'bg-white/20 text-white border-2 border-cyan-400'
                : 'glass-effect text-white/70 hover:text-white border border-white/10'
            }`}
          >
            All ({modules.reduce((sum, m) => sum + (m.flashcard_count || 0), 0)})
          </button>
        )}

        {modules.map((module) => (
          <div key={module.id} className="relative group">
            {editingId === module.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && updateModule(module.id, editName)}
                  className="px-2 py-1 rounded-lg glass-effect border border-white/20 text-white text-xs w-24"
                  autoFocus
                />
                <button
                  onClick={() => updateModule(module.id, editName)}
                  className="p-1 glass-effect rounded hover:bg-green-500/20"
                >
                  <Check className="w-3 h-3 text-green-400" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1 glass-effect rounded hover:bg-red-500/20"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onModuleChange(module.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                    selectedModuleId === module.id
                      ? 'text-white border-2'
                      : 'glass-effect text-white/70 hover:text-white border border-white/10'
                  }`}
                  style={{
                    borderColor: selectedModuleId === module.id ? module.color : undefined,
                    backgroundColor: selectedModuleId === module.id ? `${module.color}20` : undefined,
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: module.color }} />
                  {module.name} ({module.flashcard_count || 0})
                </button>
                <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                  <button
                    onClick={() => {
                      setEditingId(module.id);
                      setEditName(module.name);
                    }}
                    className="p-1 glass-effect rounded-full hover:bg-blue-500/20"
                  >
                    <Edit2 className="w-3 h-3 text-blue-400" />
                  </button>
                  <button
                    onClick={() => deleteModule(module.id)}
                    className="p-1 glass-effect rounded-full hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {isCreating ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createModule()}
              placeholder="Module name"
              className="px-2 py-1 rounded-lg glass-effect border border-white/20 text-white text-xs w-28"
              autoFocus
            />
            <select
              value={newModuleColor}
              onChange={(e) => setNewModuleColor(e.target.value)}
              className="p-1 glass-effect rounded border border-white/20 text-white text-xs"
            >
              {colors.map((color) => (
                <option key={color} value={color} style={{ backgroundColor: color }}>
                  ●
                </option>
              ))}
            </select>
            <button
              onClick={createModule}
              className="p-1 glass-effect rounded hover:bg-green-500/20"
            >
              <Check className="w-3 h-3 text-green-400" />
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 glass-effect rounded hover:bg-red-500/20"
            >
              <X className="w-3 h-3 text-red-400" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium glass-effect text-white/70 hover:text-white border border-white/10 hover:border-cyan-400/50 transition-all flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            New Module
          </button>
        )}
      </div>
    </div>
  );
}
