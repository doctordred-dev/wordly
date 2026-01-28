'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { FolderOpen, Plus, Edit2, Trash2, Check, X, Share2, Copy } from 'lucide-react';

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
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);

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

  const shareModule = async (moduleId: string) => {
    if (!user) return;
    
    // Generate a random 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Check if already shared
    const { data: existing } = await supabase
      .from('shared_modules')
      .select('share_code')
      .eq('module_id', moduleId)
      .eq('shared_by', user.id)
      .single() as { data: { share_code: string } | null };
    
    if (existing) {
      setShareCode(existing.share_code);
      setSharingId(moduleId);
      return;
    }
    
    // Create new share
    const { data, error } = await supabase
      .from('shared_modules')
      .insert({
        module_id: moduleId,
        shared_by: user.id,
        share_code: code,
        is_public: true,
      } as any)
      .select('share_code')
      .single() as { data: { share_code: string } | null; error: any };
    
    if (!error && data) {
      setShareCode(data.share_code);
      setSharingId(moduleId);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
              <div className="flex items-center gap-1">
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
                
                {/* Mobile: compact buttons inline */}
                <div className="flex md:hidden gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareModule(module.id);
                    }}
                    className="p-1 glass-effect rounded hover:bg-green-500/20 border border-green-500/30"
                    title="Share"
                  >
                    <Share2 className="w-3 h-3 text-green-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(module.id);
                      setEditName(module.name);
                    }}
                    className="p-1 glass-effect rounded hover:bg-blue-500/20 border border-blue-500/30"
                    title="Edit"
                  >
                    <Edit2 className="w-3 h-3 text-blue-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteModule(module.id);
                    }}
                    className="p-1 glass-effect rounded hover:bg-red-500/20 border border-red-500/30"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
                
                {/* Desktop: buttons on hover, absolute positioned */}
                <div className="hidden md:flex md:absolute -top-1 -right-1 md:opacity-0 md:group-hover:opacity-100 gap-1 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareModule(module.id);
                    }}
                    className="p-1.5 glass-effect rounded-lg hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 transition-all shadow-lg"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5 text-green-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(module.id);
                      setEditName(module.name);
                    }}
                    className="p-1.5 glass-effect rounded-lg hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-all shadow-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteModule(module.id);
                    }}
                    className="p-1.5 glass-effect rounded-lg hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all shadow-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {isCreating ? (
          <div className="glass-effect rounded-xl p-3 border border-white/20">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createModule()}
                placeholder="Module name"
                className="px-3 py-2 rounded-lg glass-effect border border-white/20 text-white text-sm"
                autoFocus
              />
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewModuleColor(color)}
                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                      newModuleColor === color 
                        ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-800 scale-110' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createModule}
                  className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-all border border-green-500/30 hover:border-green-500/50 text-green-400 text-sm font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all border border-red-500/30 hover:border-red-500/50 text-red-400 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
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

      {/* Share Code Modal */}
      {sharingId && shareCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSharingId(null); setShareCode(null); }}>
          <div className="glass-effect rounded-2xl p-6 border border-white/20 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-2xl flex items-center justify-center">
                <Share2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Share Code</h3>
              <p className="text-gray-400 text-sm mb-4">
                Share this code with friends to let them import your module
              </p>
              <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl mb-4">
                <span className="flex-1 font-mono text-2xl text-cyan-400 tracking-wider">
                  {shareCode}
                </span>
                <button
                  onClick={() => copyToClipboard(shareCode)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <Copy className="w-5 h-5 text-white" />
                </button>
              </div>
              <button
                onClick={() => { setSharingId(null); setShareCode(null); }}
                className="w-full py-3 glass-effect rounded-xl text-white font-medium hover:bg-white/10 transition-all border border-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
