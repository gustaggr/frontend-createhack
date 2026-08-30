import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  align?: 'left' | 'right';
  /** Quando true, permite digitar a data manualmente (DD/MM/AAAA) além de usar o calendário. */
  allowTextInput?: boolean;
  isDateEnabled?: (date: string) => boolean;
}

const maskDateInput = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  let out = day;
  if (month) out += '/' + month;
  if (year) out += '/' + year;
  return out;
};

const parseMaskedDate = (masked: string): string | null => {
  const match = masked.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  return `${y}-${m}-${d}`;
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Selecione uma data",
  label,
  align = 'left',
  allowTextInput = false,
  isDateEnabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth()); // 0-11
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [yearGridStart, setYearGridStart] = useState(parsedDate.getFullYear() - 5);

  // Reset view mode when calendar opens
  useEffect(() => {
    if (isOpen) {
      setViewMode('days');
      setYearGridStart(currentYear - 5);
    }
  }, [isOpen, currentYear]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format value to display
  const formatDateDisplay = (val: string) => {
    if (!val) return "";
    const d = new Date(val + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  const [textValue, setTextValue] = useState(formatDateDisplay(value));

  useEffect(() => {
    setTextValue(formatDateDisplay(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDateInput(e.target.value);
    setTextValue(masked);
    const parsed = parseMaskedDate(masked);
    if (parsed) {
      onChange(parsed);
    }
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Calendar calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 (Sunday) to 6 (Saturday)
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonthDaysToShow = firstDay;
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const m = (currentMonth + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    const formatted = `${currentYear}-${m}-${d}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Generate days array
  const cells = [];
  // Previous month filler days
  for (let i = prevMonthDaysToShow - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      year: prevYear,
      month: prevMonth
    });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({
      day: i,
      isCurrentMonth: true,
      year: currentYear,
      month: currentMonth
    });
  }

  // Next month filler days
  const remaining = 42 - cells.length;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remaining; i++) {
    cells.push({
      day: i,
      isCurrentMonth: false,
      year: nextYear,
      month: nextMonth
    });
  }

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const d = new Date(value + 'T00:00:00');
    return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      {allowTextInput ? (
        <div className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-[#F97316]/20 focus-within:border-[#F97316] text-sm text-slate-700 font-medium flex justify-between items-center transition-all hover:bg-slate-100/50">
          <div className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-[#F97316] cursor-pointer shrink-0 bg-transparent border-0 p-0 flex items-center"
            >
              <CalendarIcon size={16} />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={textValue}
              onChange={handleTextChange}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] text-sm flex justify-between items-center transition-all cursor-pointer hover:bg-slate-100/50"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-slate-400" />
            <span className={value ? "text-slate-700 font-medium" : "text-slate-400 font-normal"}>
              {formatDateDisplay(value) || placeholder}
            </span>
          </div>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute top-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl p-4 z-[100] w-72 select-none ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
              {viewMode === 'days' && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('months')}
                      className="hover:bg-slate-50 px-2 py-1 rounded-lg text-slate-700 hover:text-[#F97316] transition-colors font-black uppercase tracking-wider cursor-pointer"
                    >
                      {months[currentMonth].substring(0, 3)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('years')}
                      className="hover:bg-slate-50 px-2 py-1 rounded-lg text-slate-700 hover:text-[#F97316] transition-colors font-black uppercase tracking-wider cursor-pointer"
                    >
                      {currentYear}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {viewMode === 'months' && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Mês</span>
                  <button
                    type="button"
                    onClick={() => setViewMode('days')}
                    className="text-[10px] font-black uppercase text-[#F97316] hover:bg-[#F97316]/5 px-2 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                </div>
              )}

              {viewMode === 'years' && (
                <>
                  <button
                    type="button"
                    onClick={() => setYearGridStart(prev => prev - 12)}
                    className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="font-black text-[10px] uppercase tracking-wider text-slate-500">
                    {yearGridStart} - {yearGridStart + 11}
                  </div>
                  <button
                    type="button"
                    onClick={() => setYearGridStart(prev => prev + 12)}
                    className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Days View */}
            {viewMode === 'days' && (
              <>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {daysOfWeek.map(day => (
                    <div key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {cells.map((cell, idx) => {
                    const selected = cell.isCurrentMonth && isSelected(cell.day);
                    const today = cell.isCurrentMonth && isToday(cell.day);

                    const mStr = (cell.month + 1).toString().padStart(2, '0');
                    const dStr = cell.day.toString().padStart(2, '0');
                    const dateKey = `${cell.year}-${mStr}-${dStr}`;
                    const isEnabled = !cell.isCurrentMonth || !isDateEnabled || isDateEnabled(dateKey);

                    return (
                      <div
                        key={idx}
                        onClick={() => cell.isCurrentMonth && isEnabled && handleSelectDay(cell.day)}
                        className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          !cell.isCurrentMonth 
                            ? 'text-slate-300 pointer-events-none' 
                            : !isEnabled
                            ? 'text-slate-200 pointer-events-none line-through bg-slate-50/20'
                            : selected 
                            ? 'bg-[#F97316] text-white shadow-lg shadow-[#F97316]/20'
                            : today
                            ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-[#F97316]'
                        }`}
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Months Selector Grid */}
            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-2 py-2">
                {months.map((m, idx) => {
                  const isCurrent = idx === currentMonth;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setCurrentMonth(idx);
                        setViewMode('days');
                      }}
                      className={`py-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                        isCurrent
                          ? 'bg-[#F97316] text-white shadow-lg shadow-[#F97316]/20'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[#F97316]'
                      }`}
                    >
                      {m.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Years Selector Grid */}
            {viewMode === 'years' && (
              <div className="grid grid-cols-3 gap-2 py-2">
                {Array.from({ length: 12 }, (_, i) => yearGridStart + i).map((y) => {
                  const isCurrent = y === currentYear;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setCurrentYear(y);
                        setViewMode('days');
                      }}
                      className={`py-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                        isCurrent
                          ? 'bg-[#F97316] text-white shadow-lg shadow-[#F97316]/20'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[#F97316]'
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
