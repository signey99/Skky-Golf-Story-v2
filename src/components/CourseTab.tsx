import React, { useState, useEffect, useRef } from 'react';
import { Course, Game } from '../types';
import { Plus, Check, MapPin, Trash2, HelpCircle, Pencil, Phone, AlertTriangle, X, Tag, Triangle, Flag, ChevronDown, ChevronUp, Search, Trophy } from 'lucide-react';

interface CourseTabProps {
  courses: Course[];
  games: Game[];
  onAddCourse: (
    name: string,
    address: string,
    phone: string,
    totalPar: number,
    blueRating: string,
    blueSlope: string,
    redRating: string,
    redSlope: string,
    pars: number[]
  ) => void;
  onEditCourse: (
    courseId: string,
    name: string,
    address: string,
    phone: string,
    totalPar: number,
    blueRating: string,
    blueSlope: string,
    redRating: string,
    redSlope: string,
    pars: number[]
  ) => void;
  onDeleteCourse: (courseId: string) => void;
  isCourseDeletable: (courseId: string) => boolean;
}

const generateParsForTotal = (total: number): number[] => {
  const pars = Array(18).fill(4);
  let currentSum = 72;
  
  if (total === 72) {
    return Array(18).fill(4);
  }
  if (total === 71) {
    return [4, 4, 3, 4, 5, 3, 4, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4];
  }
  if (total === 70) {
    return [4, 4, 3, 4, 4, 3, 4, 4, 4, 4, 3, 4, 5, 4, 3, 4, 4, 4];
  }
  
  let diff = total - currentSum;
  if (diff > 0) {
    for (let i = 0; i < 18 && diff > 0; i++) {
      if (i % 2 === 1) {
        pars[i] = 5;
        diff--;
      }
    }
    for (let i = 0; i < 18 && diff > 0; i++) {
      if (pars[i] === 4) {
        pars[i] = 5;
        diff--;
      }
    }
  } else if (diff < 0) {
    for (let i = 0; i < 18 && diff < 0; i++) {
      if (i % 3 === 0) {
        pars[i] = 3;
        diff++;
      }
    }
    for (let i = 0; i < 18 && diff < 0; i++) {
      if (pars[i] === 4) {
        pars[i] = 3;
        diff++;
      }
    }
  }
  return pars;
};

export const CourseTab: React.FC<CourseTabProps> = ({
  courses,
  games,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  isCourseDeletable
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  // Expanded state for course par detail
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  // Show played dates for course id
  const [showDatesCourseId, setShowDatesCourseId] = useState<string | null>(null);

  // Add Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTotalPar, setNewTotalPar] = useState<number>(72);
  const [newBlueRating, setNewBlueRating] = useState('72.0');
  const [newBlueSlope, setNewBlueSlope] = useState('120');
  const [newRedRating, setNewRedRating] = useState('70.0');
  const [newRedSlope, setNewRedSlope] = useState('113');
  const [newPars, setNewPars] = useState<number[]>([
    4, 4, 4, 4, 4, 4, 4, 4, 4, 
    4, 4, 4, 4, 4, 4, 4, 4, 4
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  // Edit states
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTotalPar, setEditTotalPar] = useState<number>(72);
  const [editBlueRating, setEditBlueRating] = useState('72.0');
  const [editBlueSlope, setEditBlueSlope] = useState('120');
  const [editRedRating, setEditRedRating] = useState('70.0');
  const [editRedSlope, setEditRedSlope] = useState('113');
  const [editPars, setEditPars] = useState<number[]>([]);
  const [editErrorMsg, setEditErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pushedCountRef = useRef(0);
  const coursesRef = useRef(courses);

  useEffect(() => {
    coursesRef.current = courses;
  }, [courses]);

  const addFormStateRef = useRef({
    newCourseName,
    newAddress,
    newPhone,
    newTotalPar,
    newBlueRating,
    newBlueSlope,
    newRedRating,
    newRedSlope,
    newPars
  });

  const editFormStateRef = useRef({
    editingCourseId,
    editName,
    editAddress,
    editPhone,
    editTotalPar,
    editBlueRating,
    editBlueSlope,
    editRedRating,
    editRedSlope,
    editPars
  });

  useEffect(() => {
    addFormStateRef.current = {
      newCourseName,
      newAddress,
      newPhone,
      newTotalPar,
      newBlueRating,
      newBlueSlope,
      newRedRating,
      newRedSlope,
      newPars
    };
  }, [newCourseName, newAddress, newPhone, newTotalPar, newBlueRating, newBlueSlope, newRedRating, newRedSlope, newPars]);

  useEffect(() => {
    editFormStateRef.current = {
      editingCourseId,
      editName,
      editAddress,
      editPhone,
      editTotalPar,
      editBlueRating,
      editBlueSlope,
      editRedRating,
      editRedSlope,
      editPars
    };
  }, [editingCourseId, editName, editAddress, editPhone, editTotalPar, editBlueRating, editBlueSlope, editRedRating, editRedSlope, editPars]);

  useEffect(() => {
    return () => {
      if (pushedCountRef.current > 0) {
        const diff = pushedCountRef.current;
        pushedCountRef.current = 0;
        for (let i = 0; i < diff; i++) {
          window.history.back();
        }
      }
    };
  }, []);

  useEffect(() => {
    const currentActiveCount = (showAddForm ? 1 : 0) + (editingCourseId !== null ? 1 : 0);

    if (currentActiveCount > pushedCountRef.current) {
      const diff = currentActiveCount - pushedCountRef.current;
      for (let i = 0; i < diff; i++) {
        const nextLevel = pushedCountRef.current + 1;
        window.history.pushState({ courseModalLevel: nextLevel }, '');
        pushedCountRef.current = nextLevel;
      }
    } else if (currentActiveCount < pushedCountRef.current) {
      const diff = pushedCountRef.current - currentActiveCount;
      pushedCountRef.current = currentActiveCount;
      for (let i = 0; i < diff; i++) {
        window.history.back();
      }
    }

    const handlePopState = (event: PopStateEvent) => {
      const targetLevel = event.state && typeof event.state === 'object' && 'courseModalLevel' in event.state 
        ? (event.state as { courseModalLevel: number }).courseModalLevel 
        : 0;

      pushedCountRef.current = targetLevel;

      if (targetLevel === 0) {
        const addState = addFormStateRef.current;
        if (showAddForm) {
          let finalName = addState.newCourseName.trim();
          if (!finalName) {
            let suffix = coursesRef.current.length + 1;
            finalName = `New Course ${suffix}`;
            while (coursesRef.current.some(c => c.name.toLowerCase() === finalName.toLowerCase())) {
              suffix++;
              finalName = `New Course ${suffix}`;
            }
          }
          onAddCourse(
            finalName,
            addState.newAddress.trim(),
            addState.newPhone.trim(),
            addState.newTotalPar,
            addState.newBlueRating.trim() || '72.0',
            addState.newBlueSlope.trim() || '120',
            addState.newRedRating.trim() || '70.0',
            addState.newRedSlope.trim() || '113',
            addState.newPars
          );

          setNewCourseName('');
          setNewAddress('');
          setNewPhone('');
          setNewTotalPar(72);
          setNewBlueRating('72.0');
          setNewBlueSlope('120');
          setNewRedRating('70.0');
          setNewRedSlope('113');
          setNewPars([
            4, 4, 4, 4, 4, 4, 4, 4, 4, 
            4, 4, 4, 4, 4, 4, 4, 4, 4
          ]);
          setShowAddForm(false);
        }

        const editState = editFormStateRef.current;
        if (editState.editingCourseId) {
          const originalCourse = coursesRef.current.find(c => c.id === editState.editingCourseId);
          let hasChanges = false;
          if (originalCourse) {
            const nameChanged = editState.editName.trim() !== (originalCourse.name || '').trim();
            const addressChanged = editState.editAddress.trim() !== (originalCourse.address || '').trim();
            const phoneChanged = editState.editPhone.trim() !== (originalCourse.phone || '').trim();
            const totalParChanged = editState.editTotalPar !== (originalCourse.totalPar || 72);
            const blueRatingChanged = editState.editBlueRating.trim() !== (originalCourse.blueRating || '72.0').trim();
            const blueSlopeChanged = editState.editBlueSlope.trim() !== (originalCourse.blueSlope || '120').trim();
            const redRatingChanged = editState.editRedRating.trim() !== (originalCourse.redRating || '70.0').trim();
            const redSlopeChanged = editState.editRedSlope.trim() !== (originalCourse.redSlope || '113').trim();
            const originalPars = originalCourse.pars || Array(18).fill(4);
            const parsChanged = JSON.stringify(editState.editPars) !== JSON.stringify(originalPars);

            hasChanges = nameChanged || addressChanged || phoneChanged || totalParChanged || blueRatingChanged || blueSlopeChanged || redRatingChanged || redSlopeChanged || parsChanged;
          }

          if (hasChanges) {
            const confirmSave = window.confirm("You have unsaved changes. Do you want to save your changes before leaving?");
            if (confirmSave) {
              onEditCourse(
                editState.editingCourseId,
                editState.editName.trim() || (originalCourse?.name || 'Course'),
                editState.editAddress.trim(),
                editState.editPhone.trim(),
                editState.editTotalPar,
                editState.editBlueRating.trim() || '72.0',
                editState.editBlueSlope.trim() || '120',
                editState.editRedRating.trim() || '70.0',
                editState.editRedSlope.trim() || '113',
                editState.editPars
              );
            }
          }
          setEditingCourseId(null);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showAddForm, editingCourseId]);

  // Synced par updates for adding
  const handleNewParChange = (holeIdx: number, val: number) => {
    const updated = [...newPars];
    updated[holeIdx] = val;
    setNewPars(updated);
    // Synced total par
    const total = updated.reduce((a, b) => a + b, 0);
    setNewTotalPar(total);
  };

  const handleNewTotalParChange = (totalVal: number) => {
    setNewTotalPar(totalVal);
    setNewPars(generateParsForTotal(totalVal));
  };

  const decNewRedRating = () => {
    const val = parseFloat(newRedRating) || 70.0;
    setNewRedRating(Math.max(0, val - 0.1).toFixed(1));
  };
  const incNewRedRating = () => {
    const val = parseFloat(newRedRating) || 70.0;
    setNewRedRating((val + 0.1).toFixed(1));
  };
  const decNewRedSlope = () => {
    const val = parseInt(newRedSlope, 10) || 113;
    setNewRedSlope(String(Math.max(0, val - 1)));
  };
  const incNewRedSlope = () => {
    const val = parseInt(newRedSlope, 10) || 113;
    setNewRedSlope(String(val + 1));
  };
  const decNewBlueRating = () => {
    const val = parseFloat(newBlueRating) || 72.0;
    setNewBlueRating(Math.max(0, val - 0.1).toFixed(1));
  };
  const incNewBlueRating = () => {
    const val = parseFloat(newBlueRating) || 72.0;
    setNewBlueRating((val + 0.1).toFixed(1));
  };
  const decNewBlueSlope = () => {
    const val = parseInt(newBlueSlope, 10) || 120;
    setNewBlueSlope(String(Math.max(0, val - 1)));
  };
  const incNewBlueSlope = () => {
    const val = parseInt(newBlueSlope, 10) || 120;
    setNewBlueSlope(String(val + 1));
  };

  // Synced par updates for editing
  const handleEditParChange = (holeIdx: number, val: number) => {
    const updated = [...editPars];
    updated[holeIdx] = val;
    setEditPars(updated);
    // Synced total par
    const total = updated.reduce((a, b) => a + b, 0);
    setEditTotalPar(total);
  };

  const handleEditTotalParChange = (totalVal: number) => {
    setEditTotalPar(totalVal);
    setEditPars(generateParsForTotal(totalVal));
  };

  // Start editing a course
  const handleStartEdit = (course: Course) => {
    setEditingCourseId(course.id);
    setEditName(course.name);
    setEditAddress(course.address || '');
    setEditPhone(course.phone || '');
    setEditTotalPar(course.totalPar || 72);
    setEditBlueRating(course.blueRating || '72.0');
    setEditBlueSlope(course.blueSlope || '120');
    setEditRedRating(course.redRating || '70.0');
    setEditRedSlope(course.redSlope || '113');
    setEditPars(course.pars || [
      4, 4, 4, 4, 4, 4, 4, 4, 4, 
      4, 4, 4, 4, 4, 4, 4, 4, 4
    ]);
    setEditErrorMsg('');
    setShowDeleteConfirm(false);
  };

  // Save new course
  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newCourseName.trim()) {
      setErrorMsg('Please enter a course name.');
      return;
    }

    if (courses.some(c => c.name.toLowerCase() === newCourseName.trim().toLowerCase())) {
      setErrorMsg('This course name already exists.');
      return;
    }

    onAddCourse(
      newCourseName.trim(),
      newAddress.trim(),
      newPhone.trim(),
      newTotalPar,
      newBlueRating.trim() || '72.0',
      newBlueSlope.trim() || '120',
      newRedRating.trim() || '70.0',
      newRedSlope.trim() || '113',
      newPars
    );
    
    // Reset Add form
    setNewCourseName('');
    setNewAddress('');
    setNewPhone('');
    setNewTotalPar(72);
    setNewBlueRating('72.0');
    setNewBlueSlope('120');
    setNewRedRating('70.0');
    setNewRedSlope('113');
    setNewPars([
      4, 4, 4, 4, 4, 4, 4, 4, 4, 
      4, 4, 4, 4, 4, 4, 4, 4, 4
    ]);
    setShowAddForm(false);
  };

  // Save edited course
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMsg('');

    if (!editName.trim()) {
      setEditErrorMsg('Please enter a course name.');
      return;
    }

    if (courses.some(c => c.id !== editingCourseId && c.name.toLowerCase() === editName.trim().toLowerCase())) {
      setEditErrorMsg('This course name already exists.');
      return;
    }

    if (!editingCourseId) return;

    onEditCourse(
      editingCourseId,
      editName.trim(),
      editAddress.trim(),
      editPhone.trim(),
      editTotalPar,
      editBlueRating.trim() || '72.0',
      editBlueSlope.trim() || '120',
      editRedRating.trim() || '70.0',
      editRedSlope.trim() || '113',
      editPars
    );

    setEditingCourseId(null);
  };

  const filteredCourses = courses.filter(course => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return course.name.toLowerCase().includes(q) || course.address.toLowerCase().includes(q);
  }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  return (
    <div className="max-w-3xl mx-auto space-y-5" id="course-tab-container">
      {/* Unified Tab Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100" id="course-tab-header">
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow-sm shrink-0">🗺️</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight text-shadow-sm">
            Courses
          </h2>
        </div>
        
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingCourseId(null); // stop editing other courses
            }}
            className="bg-[#009b62] hover:bg-[#008251] text-white py-2 px-4 rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer text-sm shrink-0"
            id="add-course-btn"
          >
            <span className="text-base">⛳</span> Add Course
          </button>
        )}
      </div>

      {/* Search Input Card */}
      <div className="bg-white rounded-2xl p-2.5 shadow-sm !mt-3">
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400">
            <Search className="w-4 h-4 text-[#4263eb]" />
          </span>
          <input
            type="text"
            placeholder="Search Courses"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/75 border border-slate-100 text-slate-700 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
        </div>
      </div>

      {/* Add Course Popup Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200" id="add-course-modal-overlay">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 md:p-8 space-y-6 shadow-xl border border-slate-100 relative" id="add-course-modal-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4" id="add-form-header">
              <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600 shrink-0" /> Add New Golf Course
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-6" id="course-form">
              {/* Course Name */}
              <div className="space-y-1.5" id="form-name-group">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5" htmlFor="new-course-name">
                  <Tag className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" /> NAME *
                </label>
                <input
                  id="new-course-name"
                  type="text"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none focus:border-emerald-500 text-sm font-semibold transition-all shadow-sm"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Course Name"
                  maxLength={40}
                  required
                />
                {errorMsg && <p className="text-xs font-medium text-red-500 mt-1" id="form-error-msg">{errorMsg}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1.5" id="form-address-group">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5" htmlFor="new-course-address">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" /> ADDRESS
                </label>
                <input
                  id="new-course-address"
                  type="text"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none focus:border-emerald-500 text-sm font-semibold transition-all shadow-sm"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Address"
                  maxLength={80}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5" id="form-phone-group">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5" htmlFor="new-course-phone">
                  <Phone className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" /> TELEPHONE
                </label>
                <input
                  id="new-course-phone"
                  type="tel"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none focus:border-emerald-500 text-sm font-semibold transition-all shadow-sm"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Phone Number"
                  maxLength={30}
                />
              </div>

              {/* Hole-by-Hole Par Configurer */}
              <div className="space-y-3 pt-2" id="form-pars-group">
                <div className="flex items-center justify-between" id="pars-header">
                  <label className="text-xs font-bold text-[#005a36] uppercase tracking-wider flex items-center gap-1">
                    ⛳ DEFAULT PAR
                  </label>
                  <span className="text-sm font-bold text-[#008251] font-mono">
                    {newPars.reduce((a, b) => a + b, 0)} Par
                  </span>
                </div>

                <div className="grid grid-cols-9 gap-1.5 md:gap-2" id="pars-grid">
                  {newPars.map((parValue, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleNewParChange(idx, parValue === 3 ? 4 : parValue === 4 ? 5 : 3)}
                      className="bg-slate-50 hover:bg-slate-100 rounded-xl p-2 border border-slate-200 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 select-none shadow-sm" 
                      id={`hole-box-${idx}`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 font-mono mb-0.5">H{idx + 1}</span>
                      <span className="text-sm font-bold text-[#008251] font-mono">{parValue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* COURSE & SLOPE RATING Grid */}
              <div className="space-y-3 pt-2" id="form-ratings-container">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Pencil className="w-4 h-4 text-slate-500 shrink-0" /> COURSE & SLOPE RATING
                </label>

                <div className="grid grid-cols-2 gap-4" id="form-ratings-grid">
                  {/* Lady Course */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-1.5 flex items-center justify-between shadow-sm">
                    <button
                      type="button"
                      onClick={decNewRedRating}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                    >
                      <Triangle className="w-3 h-3 fill-current rotate-180 text-rose-300" />
                    </button>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">Course</span>
                      <input
                        type="text"
                        className="w-full text-center bg-transparent border-none outline-none font-extrabold text-sm text-rose-700 p-0 font-mono focus:ring-0"
                        value={newRedRating}
                        onChange={(e) => setNewRedRating(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={incNewRedRating}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                    >
                      <Triangle className="w-3 h-3 fill-current text-rose-300" />
                    </button>
                  </div>

                  {/* Lady Slope */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-1.5 flex items-center justify-between shadow-sm">
                    <button
                      type="button"
                      onClick={decNewRedSlope}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                    >
                      <Triangle className="w-3 h-3 fill-current rotate-180 text-rose-300" />
                    </button>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">Slope</span>
                      <input
                        type="text"
                        className="w-full text-center bg-transparent border-none outline-none font-extrabold text-sm text-rose-700 p-0 font-mono focus:ring-0"
                        value={newRedSlope}
                        onChange={(e) => setNewRedSlope(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={incNewRedSlope}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                    >
                      <Triangle className="w-3 h-3 fill-current text-rose-300" />
                    </button>
                  </div>

                  {/* Blue Course */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-1.5 flex items-center justify-between shadow-sm">
                    <button
                      type="button"
                      onClick={decNewBlueRating}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                    >
                      <Triangle className="w-3 h-3 fill-current rotate-180 text-blue-300" />
                    </button>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">Course</span>
                      <input
                        type="text"
                        className="w-full text-center bg-transparent border-none outline-none font-extrabold text-sm text-blue-700 p-0 font-mono focus:ring-0"
                        value={newBlueRating}
                        onChange={(e) => setNewBlueRating(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={incNewBlueRating}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                    >
                      <Triangle className="w-3 h-3 fill-current text-blue-300" />
                    </button>
                  </div>

                  {/* Blue Slope */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-1.5 flex items-center justify-between shadow-sm">
                    <button
                      type="button"
                      onClick={decNewBlueSlope}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                    >
                      <Triangle className="w-3 h-3 fill-current rotate-180 text-blue-300" />
                    </button>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">Slope</span>
                      <input
                        type="text"
                        className="w-full text-center bg-transparent border-none outline-none font-extrabold text-sm text-blue-700 p-0 font-mono focus:ring-0"
                        value={newBlueSlope}
                        onChange={(e) => setNewBlueSlope(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={incNewBlueSlope}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                    >
                      <Triangle className="w-3 h-3 fill-current text-blue-300" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4 border-t border-slate-200" id="form-actions-row">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-[#f1f3f5] hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-2xl flex-1 text-center transition-all cursor-pointer text-sm"
                  id="cancel-add-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#009b62] hover:bg-[#008251] text-white font-bold py-3.5 px-6 rounded-2xl flex-1 text-center transition-all shadow-md shadow-emerald-50 flex items-center justify-center gap-1.5 cursor-pointer text-sm"
                  id="save-course-btn"
                >
                  <Check className="w-4 h-4" />
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 gap-3" id="courses-list-grid">
        {filteredCourses.map(course => {
          const totalPar = course.pars.reduce((a, b) => a + b, 0);
          const outPars = course.pars.slice(0, 9);
          const inPars = course.pars.slice(9, 18);

          // Normal Display Mode View
          const roundCount = games.filter(g => g.courseId === course.id && g.status === 'completed').length;
          const isExpanded = expandedCourseId === course.id;

          return (
            <div key={course.id} className="bg-white rounded-2xl p-2.5 md:p-3 border-2 border-slate-300 shadow-sm hover:shadow-md transition-all space-y-0.5 animate-fade-in" id={`course-card-${course.id}`}>
              {/* Card Header with Name & Edit Button */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-0.5" id="course-card-header">
                <h4 className="text-sm md:text-base font-black text-[#1e293b] tracking-tight" id={`course-title-${course.id}`}>
                  {course.name}
                </h4>
                {/* Pencil Icon inside light-orange rounded circle */}
                <button 
                  onClick={() => handleStartEdit(course)}
                  className="w-6 h-6 flex items-center justify-center text-[#f97316] bg-[#fff7ed] hover:bg-[#ffedd5] rounded-full transition-all cursor-pointer shrink-0"
                  title="Edit Course Information"
                  id={`edit-pencil-btn-${course.id}`}
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>

              {/* Course Info Block */}
              <div className="space-y-0.5 text-xs font-semibold" id={`course-details-block-${course.id}`}>
                {/* Address Row with Google Maps link */}
                <div id={`addr-display-${course.id}`}>
                  {course.address ? (
                    <div className="inline-flex items-center gap-1.5 animate-fade-in">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(course.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-5.5 h-5.5 rounded-md bg-[#ecfdf5] text-[#059669] hover:bg-[#d1fae5] flex items-center justify-center shrink-0 transition-colors"
                        title="Open in Google Maps"
                      >
                        <MapPin className="w-3 h-3" />
                      </a>
                      <span className="text-slate-600 font-bold leading-none text-[11px]">
                        {course.address}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5.5 h-5.5 rounded-md bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <span className="text-slate-400 font-bold leading-none text-[11px]">
                        No address provided
                      </span>
                    </div>
                  )}
                </div>

                {/* Telephone Row & Rounds count */}
                <div className="flex items-center justify-between gap-4" id={`phone-display-${course.id}`}>
                  <div>
                    {course.phone ? (
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={`tel:${course.phone}`}
                          className="w-5.5 h-5.5 rounded-md bg-[#ecfdf5] text-[#059669] hover:bg-[#d1fae5] flex items-center justify-center shrink-0 transition-colors"
                          title="Click to call"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                        <span className="text-slate-600 font-bold font-mono text-[11px] leading-none">
                          {course.phone}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5.5 h-5.5 rounded-md bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                          <Phone className="w-3 h-3" />
                        </div>
                        <span className="text-slate-400 font-bold font-mono text-[11px] leading-none">
                          No phone number provided
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rounds Count pill */}
                  <div className="relative inline-block" id={`rounds-pill-container-${course.id}`}>
                    <button
                      type="button"
                      onClick={() => setShowDatesCourseId(showDatesCourseId === course.id ? null : course.id)}
                      className="bg-[#ecfdf5] hover:bg-[#d1fae5] active:scale-95 transition-all px-2 py-0.25 rounded-full text-[#059669] text-[9.5px] font-black flex items-center gap-0.5 shrink-0 border border-emerald-100/30 shadow-xs cursor-pointer"
                      title="Click to view played dates"
                      id={`view-rounds-btn-${course.id}`}
                    >
                      <span>🏆</span> {roundCount} Rounds
                    </button>

                    {/* Speech bubble for dates */}
                    {showDatesCourseId === course.id && (() => {
                      const courseGames = games.filter(g => g.courseId === course.id && g.status === 'completed');
                      const sortedCourseGames = [...courseGames].sort((a, b) => b.date.localeCompare(a.date));
                      const dateStrings = sortedCourseGames.map(g => {
                        if (!g.date) return 'N/A';
                        // Extract just the YYYY-MM-DD portion in case there's a time component
                        const dateOnly = g.date.split('T')[0].split(' ')[0];
                        const parts = dateOnly.split('-');
                        if (parts.length === 3) {
                          return `${parts[1]}/${parts[2]}/${parts[0]}`;
                        }
                        return dateOnly;
                      });

                      return (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDatesCourseId(null);
                          }}
                          className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 bg-slate-900 text-white rounded-lg py-1.5 px-3 shadow-xl z-50 text-[10px] font-black whitespace-nowrap cursor-pointer select-none border border-slate-700 animate-in fade-in zoom-in-95 duration-100 flex flex-col items-center gap-1"
                          id={`played-dates-bubble-${course.id}`}
                          title="Click to close"
                        >
                          {/* Caret arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 transform rotate-45"></div>
                          
                          {dateStrings.length > 0 ? (
                            dateStrings.map((d, i) => (
                              <div key={i} className="hover:text-emerald-300 transition-colors font-mono font-bold">
                                {d}
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-400 italic">No rounds</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Course & Slope rating badges */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 pt-0.5 border-t border-slate-100 mt-0.5" id={`course-ratings-summary-${course.id}`}>
                {/* Total Par */}
                <button
                  type="button"
                  onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                  className="bg-transparent hover:opacity-80 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 text-center py-0.5 px-0.5"
                  id={`stat-box-par-${course.id}`}
                >
                  <span className="text-[10.5px] xs:text-xs sm:text-sm font-bold text-[#008251] flex items-center justify-center gap-0.5 font-mono whitespace-nowrap">
                    ⛳ {totalPar} Par
                  </span>
                </button>

                {/* Blue Tee */}
                <div 
                  className="bg-transparent flex flex-col items-center justify-center text-center py-0.5 px-0.5"
                  id={`stat-box-blue-${course.id}`}
                >
                  <span className="text-[10.5px] xs:text-xs sm:text-sm font-bold text-[#1d4ed8] flex items-center justify-center gap-0.5 font-mono whitespace-nowrap">
                    🔵 {course.blueRating || '72.0'}/{course.blueSlope || '120'}
                  </span>
                </div>

                {/* Lady Tee */}
                <div 
                  className="bg-transparent flex flex-col items-center justify-center text-center py-0.5 px-0.5"
                  id={`stat-box-red-${course.id}`}
                >
                  <span className="text-[10.5px] xs:text-xs sm:text-sm font-bold text-[#be123c] flex items-center justify-center gap-0.5 font-mono whitespace-nowrap">
                    🔴 {course.redRating || '70.0'}/{course.redSlope || '113'}
                  </span>
                </div>
              </div>

              {/* Detailed Hole Pars (Collapsible) */}
              {isExpanded && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-4 animate-in slide-in-from-top-2 duration-200" id={`course-pars-details-${course.id}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-600" id="out-in-pars-grid">
                    {/* OUT Course */}
                    <div className="space-y-2" id="out-pars-box">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider" id="out-header">
                        <span>OUT Course (1 - 9)</span>
                        <span className="text-emerald-700 font-bold">Par {outPars.reduce((a, b) => a + b, 0)}</span>
                      </div>
                      <div className="grid grid-cols-9 gap-1 text-center" id="out-pars-row">
                        {outPars.map((p, i) => (
                          <div key={i} className="bg-white rounded-lg p-1 border border-slate-100 shadow-xs" id={`out-par-dot-${i}`}>
                            <div className="text-[8px] text-slate-300 font-sans">{i + 1}</div>
                            <div className="font-bold text-slate-700 mt-0.5">{p}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* IN Course */}
                    <div className="space-y-2" id="in-pars-box">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider" id="in-header">
                        <span>IN Course (10 - 18)</span>
                        <span className="text-emerald-700 font-bold">Par {inPars.reduce((a, b) => a + b, 0)}</span>
                      </div>
                      <div className="grid grid-cols-9 gap-1 text-center" id="in-pars-row">
                        {inPars.map((p, i) => (
                          <div key={i} className="bg-white rounded-lg p-1 border border-slate-100 shadow-xs" id={`in-par-dot-${i}`}>
                            <div className="text-[8px] text-slate-300 font-sans">{i + 10}</div>
                            <div className="font-bold text-slate-700 mt-0.5">{p}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Course Popup Modal */}
      {editingCourseId && (() => {
        const course = courses.find(c => c.id === editingCourseId);
        if (!course) return null;
        const deletable = isCourseDeletable(course.id);

        const decRedRating = () => {
          const val = parseFloat(editRedRating) || 70.0;
          setEditRedRating(Math.max(0, val - 0.1).toFixed(1));
        };
        const incRedRating = () => {
          const val = parseFloat(editRedRating) || 70.0;
          setEditRedRating((val + 0.1).toFixed(1));
        };
        const decRedSlope = () => {
          const val = parseInt(editRedSlope, 10) || 113;
          setEditRedSlope(String(Math.max(0, val - 1)));
        };
        const incRedSlope = () => {
          const val = parseInt(editRedSlope, 10) || 113;
          setEditRedSlope(String(val + 1));
        };
        const decBlueRating = () => {
          const val = parseFloat(editBlueRating) || 72.0;
          setEditBlueRating(Math.max(0, val - 0.1).toFixed(1));
        };
        const incBlueRating = () => {
          const val = parseFloat(editBlueRating) || 72.0;
          setEditBlueRating((val + 0.1).toFixed(1));
        };
        const decBlueSlope = () => {
          const val = parseInt(editBlueSlope, 10) || 120;
          setEditBlueSlope(String(Math.max(0, val - 1)));
        };
        const incBlueSlope = () => {
          const val = parseInt(editBlueSlope, 10) || 120;
          setEditBlueSlope(String(val + 1));
        };

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200" id="edit-course-modal-overlay">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 md:p-8 space-y-6 shadow-xl border border-slate-100 relative" id="edit-course-modal-card">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4" id="edit-card-header">
                <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-emerald-600 shrink-0" /> Edit Golf Course Info
                </h3>
                <button 
                  type="button"
                  onClick={() => setEditingCourseId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-6" id={`edit-form-${course.id}`}>
                {/* Edit Name */}
                <div className="space-y-1.5" id={`edit-name-group-${course.id}`}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5" htmlFor={`edit-course-name-${course.id}`}>
                    <Tag className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" /> NAME *
                  </label>
                  <input
                    id={`edit-course-name-${course.id}`}
                    type="text"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none focus:border-emerald-500 text-sm font-semibold transition-all shadow-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Course Name"
                    maxLength={40}
                    required
                  />
                  {editErrorMsg && <p className="text-xs font-medium text-red-500 mt-1" id={`edit-error-msg-${course.id}`}>{editErrorMsg}</p>}
                </div>

                {/* Edit Address */}
                <div className="space-y-1.5" id={`edit-address-group-${course.id}`}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5" htmlFor={`edit-course-address-${course.id}`}>
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" /> ADDRESS
                  </label>
                  <input
                    id={`edit-course-address-${course.id}`}
                    type="text"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none focus:border-emerald-500 text-sm font-semibold transition-all shadow-sm"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Address"
                    maxLength={80}
                  />
                </div>

                {/* Edit Phone */}
                <div className="space-y-1.5" id={`edit-phone-group-${course.id}`}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5" htmlFor={`edit-course-phone-${course.id}`}>
                    <Phone className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" /> TELEPHONE
                  </label>
                  <input
                    id={`edit-course-phone-${course.id}`}
                    type="tel"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 outline-none focus:border-emerald-500 text-sm font-semibold transition-all shadow-sm"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Phone Number"
                    maxLength={30}
                  />
                </div>

                {/* Hole-by-Hole Par edit */}
                <div className="space-y-3 pt-2" id={`edit-pars-group-${course.id}`}>
                  <div className="flex items-center justify-between" id={`edit-pars-header-${course.id}`}>
                    <label className="text-xs font-bold text-[#005a36] uppercase tracking-wider flex items-center gap-1">
                      ⛳ DEFAULT PAR
                    </label>
                    <span className="text-sm font-bold text-[#008251] font-mono">
                      {editPars.reduce((a, b) => a + b, 0)} Par
                    </span>
                  </div>

                  <div className="grid grid-cols-9 gap-1.5 md:gap-2" id={`edit-pars-grid-${course.id}`}>
                    {editPars.map((parValue, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleEditParChange(idx, parValue === 3 ? 4 : parValue === 4 ? 5 : 3)}
                        className="bg-slate-50 hover:bg-slate-100 rounded-xl p-2 border border-slate-200 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 select-none shadow-sm" 
                        id={`edit-hole-box-${idx}`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 font-mono mb-0.5">H{idx + 1}</span>
                        <span className="text-sm font-bold text-[#008251] font-mono">{parValue}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COURSE & SLOPE RATING Grid */}
                <div className="space-y-3 pt-2" id={`edit-ratings-container-${course.id}`}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Pencil className="w-4 h-4 text-slate-500 shrink-0" /> COURSE & SLOPE RATING
                  </label>

                  <div className="grid grid-cols-2 gap-4" id={`edit-ratings-grid-${course.id}`}>
                    {/* Lady Course */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-1.5 flex items-center justify-between shadow-sm">
                      <button
                        type="button"
                        onClick={decRedRating}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                      >
                        <Triangle className="w-3 h-3 fill-current rotate-180 text-rose-300" />
                      </button>
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">Course</span>
                        <input
                          type="text"
                          className="w-full text-center bg-transparent border-none outline-none font-extrabold text-sm text-rose-700 p-0 font-mono focus:ring-0"
                          value={editRedRating}
                          onChange={(e) => setEditRedRating(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={incRedRating}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                      >
                        <Triangle className="w-3 h-3 fill-current text-rose-300" />
                      </button>
                    </div>

                    {/* Lady Slope */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-1.5 flex items-center justify-between shadow-sm">
                      <button
                        type="button"
                        onClick={decRedSlope}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                      >
                        <Triangle className="w-3 h-3 fill-current rotate-180 text-rose-300" />
                      </button>
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">Slope</span>
                        <input
                          type="text"
                          className="w-full text-center bg-transparent border-none outline-none font-extrabold text-sm text-rose-700 p-0 font-mono focus:ring-0"
                          value={editRedSlope}
                          onChange={(e) => setEditRedSlope(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={incRedSlope}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                      >
                        <Triangle className="w-3 h-3 fill-current text-rose-300" />
                      </button>
                    </div>

                    {/* Blue Course */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-1.5 flex items-center justify-between shadow-sm">
                      <button
                        type="button"
                        onClick={decBlueRating}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                      >
                        <Triangle className="w-3 h-3 fill-current rotate-180 text-blue-300" />
                      </button>
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">Course</span>
                        <input
                          type="text"
                          className="w-full text-center bg-transparent border-none outline-none font-extrabold text-sm text-blue-700 p-0 font-mono focus:ring-0"
                          value={editBlueRating}
                          onChange={(e) => setEditBlueRating(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={incBlueRating}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                      >
                        <Triangle className="w-3 h-3 fill-current text-blue-300" />
                      </button>
                    </div>

                    {/* Blue Slope */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-1.5 flex items-center justify-between shadow-sm">
                      <button
                        type="button"
                        onClick={decBlueSlope}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                      >
                        <Triangle className="w-3 h-3 fill-current rotate-180 text-blue-300" />
                      </button>
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">Slope</span>
                        <input
                          type="text"
                          className="w-full text-center bg-transparent border-none outline-none font-extrabold text-sm text-blue-700 p-0 font-mono focus:ring-0"
                          value={editBlueSlope}
                          onChange={(e) => setEditBlueSlope(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={incBlueSlope}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors shrink-0 cursor-pointer active:scale-90"
                      >
                        <Triangle className="w-3 h-3 fill-current text-blue-300" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions (Save, Cancel, Delete) */}
                <div className="pt-4 border-t border-slate-200 flex flex-col gap-4" id={`edit-actions-${course.id}`}>
                  <div className="flex gap-4 w-full" id="save-cancel-actions">
                    <button
                      type="button"
                      onClick={() => setEditingCourseId(null)}
                      className="bg-[#f1f3f5] hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-2xl flex-1 text-center transition-all cursor-pointer text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#009b62] hover:bg-[#008251] text-white font-bold py-3.5 px-6 rounded-2xl flex-1 text-center transition-all shadow-md shadow-emerald-50 cursor-pointer text-sm flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>

                  {/* Delete block trigger inside edit mode */}
                  <div id={`edit-delete-zone-${course.id}`}>
                    {showDeleteConfirm ? (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 animate-in slide-in-from-bottom duration-200" id="delete-confirmation-box">
                        <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" /> Are you sure you want to delete this course?
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteCourse(course.id);
                              setEditingCourseId(null);
                            }}
                            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            id="confirm-delete-yes"
                          >
                            Yes, Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            id="confirm-delete-no"
                          >
                            No, Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (deletable) {
                            setShowDeleteConfirm(true);
                          }
                        }}
                        disabled={!deletable}
                        className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                          deletable
                            ? 'bg-[#fff0f2] border-[#ffe0e4] text-[#a61c31] hover:bg-[#ffe5e8] cursor-pointer'
                            : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                        title={deletable ? "Delete Golf Course" : "Cannot delete course: It has logged rounds."}
                        id={`delete-btn-${course.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete This Course
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
