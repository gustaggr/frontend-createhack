import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, X } from 'lucide-react';

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  onAddNewOption?: (newOption: string) => void;
  required?: boolean;
  uppercase?: boolean;
  dense?: boolean;
  heightClass?: string;
  variant?: 'default' | 'blue';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione uma opção",
  onAddNewOption,
  uppercase = false,
  dense = false,
  heightClass,
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newValue, setNewValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateNew = () => {
    const trimmed = newValue.trim();
    if (trimmed) {
      if (onAddNewOption) {
        onAddNewOption(trimmed);
      }
      onChange(trimmed);
    }
    setIsCreatingNew(false);
    setNewValue("");
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className={`block font-bold text-slate-500 uppercase tracking-wider mb-2 ${dense ? 'text-[10px]' : 'text-xs'}`}>
          {label}
        </label>
      )}

      {isCreatingNew ? (
        <div className="flex gap-2">
          <input
            type="text"
            autoFocus
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className={`flex-1 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] text-slate-700 font-medium ${
              heightClass || (dense ? 'py-2.5' : 'py-3')
            }`}
            placeholder="Nova opção..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateNew();
              }
            }}
          />
          <button
            type="button"
            onClick={handleCreateNew}
            className={`px-4 bg-[#F97316] text-white rounded-xl font-bold hover:bg-[#ea580c] transition-colors cursor-pointer ${
              heightClass || (dense ? 'py-2.5' : 'py-3')
            }`}
          >
            Criar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreatingNew(false);
              setNewValue("");
            }}
            className={`px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center ${
              heightClass || (dense ? 'py-2.5' : 'py-3')
            }`}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={variant === 'blue' 
              ? `w-full px-4 bg-[#F97316] border border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 text-sm flex justify-between items-center transition-all cursor-pointer text-white font-bold hover:bg-[#ea580c] ${heightClass || (dense ? 'py-2.5' : 'h-12')}`
              : `w-full px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] text-sm flex justify-between items-center transition-all cursor-pointer ${
                  heightClass || (dense ? 'py-2.5' : 'h-12')
                } ${
                  value
                    ? (uppercase ? 'text-[10px] font-black uppercase tracking-widest text-slate-600' : 'text-slate-700 font-medium')
                    : 'text-slate-400 font-normal'
                }`
            }
          >
            {value || placeholder}
            <ChevronDown size={18} className={`transition-transform ${variant === 'blue' ? 'text-white' : 'text-slate-400'} ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto"
              >
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer ${
                      uppercase ? 'text-[10px] font-black uppercase tracking-widest text-slate-600' : 'font-medium'
                    }`}
                  >
                    {option}
                  </button>
                ))}
                {onAddNewOption && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsCreatingNew(true);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-[#F97316] hover:bg-[#F97316]/5 transition-colors flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 cursor-pointer"
                  >
                    <Plus size={16} />
                    Nova Opção
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
