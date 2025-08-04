import React, { useState, useEffect } from 'react';
import { X, Clock, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Check, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import CookingTimer from './CookingTimer';

const CookingModal = ({ isOpen, onClose, recipe, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [timers, setTimers] = useState([]);
  const [notes, setNotes] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customTimerName, setCustomTimerName] = useState('');
  const [customTimerMinutes, setCustomTimerMinutes] = useState('');

  // FIXED: Improved instruction parsing to show ALL steps
  const parseInstructions = (instructions) => {
    if (!instructions) return ['Follow the recipe instructions to prepare this delicious dish.'];
    
    let steps = [];
    
    // Try different splitting methods
    if (instructions.includes('Step ')) {
      // Split by "Step X:" pattern
      steps = instructions.split(/Step\s*\d+\s*:/).filter(step => step.trim());
    } else if (/^\d+\./.test(instructions.trim())) {
      // Split by numbered list "1. 2. 3."
      steps = instructions.split(/^\d+\.\s*/m).filter(step => step.trim());
    } else if (instructions.includes('\n')) {
      // Split by line breaks
      steps = instructions.split('\n').filter(step => step.trim());
    } else {
      // Split by sentences ending with period + capital letter
      steps = instructions.split(/\.\s+(?=[A-Z])/).map(step => step.trim() + (step.endsWith('.') ? '' : '.'));
    }
    
    // Clean and filter steps
    steps = steps.map(step => step.trim()).filter(step => step && step.length > 3);
    
    return steps.length > 0 ? steps : ['Follow the recipe instructions to prepare this delicious dish.'];
  };

  const steps = parseInstructions(recipe?.instructions);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setCheckedIngredients(new Set());
      setTimers([]);
      setNotes('');
    }
  }, [isOpen]);

  // Request notification permission
  useEffect(() => {
    if (isOpen && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isOpen]);

  const handleStepComplete = (stepIndex) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const handleIngredientCheck = (ingredientIndex) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(ingredientIndex)) {
      newChecked.delete(ingredientIndex);
    } else {
      newChecked.add(ingredientIndex);
    }
    setCheckedIngredients(newChecked);
  };

  const addTimer = (name, minutes) => {
    const newTimer = {
      id: Date.now(),
      name,
      duration: minutes * 60,
      remaining: minutes * 60,
      isRunning: false,
      isComplete: false
    };
    setTimers(prev => [...prev, newTimer]);
  };

  const addCustomTimer = () => {
    if (customTimerName.trim() && customTimerMinutes) {
      addTimer(customTimerName.trim(), parseInt(customTimerMinutes));
      setCustomTimerName('');
      setCustomTimerMinutes('');
    }
  };

  const removeTimer = (id) => {
    setTimers(prev => prev.filter(timer => timer.id !== id));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishCooking = () => {
    onComplete?.({
      recipe,
      completedSteps: completedSteps.size,
      totalSteps: steps.length,
      notes,
      cookingTime: Date.now()
    });
    onClose();
  };

  const commonTimers = [
    { name: 'Boil Water', minutes: 10 },
    { name: 'Simmer', minutes: 15 },
    { name: 'Bake', minutes: 25 },
    { name: 'Rest', minutes: 5 },
    { name: 'Sauté', minutes: 8 }
  ];

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{recipe?.recipeName}</h2>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-primary-100">Step {currentStep + 1} of {steps.length}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1 hover:bg-primary-500 rounded"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-500 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-primary-100 px-6 py-2">
          <div className="w-full bg-primary-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Ingredients */}
          <div className="w-80 bg-gray-50 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Ingredients</h3>
              {recipe?.ingredients?.length > 0 ? (
                <div className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checkedIngredients.has(index)}
                        onChange={() => handleIngredientCheck(index)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className={`text-sm ${
                        checkedIngredients.has(index) 
                          ? 'line-through text-gray-500' 
                          : 'text-gray-700'
                      }`}>
                        {ingredient}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No ingredients listed</p>
              )}

              {/* Timer Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Cooking Timers</h3>
                
                {/* Quick Timer Buttons */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Quick Add:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {commonTimers.map((timer, index) => (
                      <button
                        key={index}
                        onClick={() => addTimer(timer.name, timer.minutes)}
                        className="text-left px-3 py-2 bg-white border border-gray-200 hover:border-primary-300 rounded-lg text-sm transition-colors"
                      >
                        {timer.name} ({timer.minutes}min)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Timer */}
                <div className="mb-4 p-3 bg-white rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Custom Timer:</p>
                  <input
                    type="text"
                    placeholder="Timer name..."
                    value={customTimerName}
                    onChange={(e) => setCustomTimerName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                    onKeyPress={(e) => e.key === 'Enter' && customTimerMinutes && addCustomTimer()}
                  />
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Minutes"
                      value={customTimerMinutes}
                      onChange={(e) => setCustomTimerMinutes(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && customTimerName.trim() && addCustomTimer()}
                    />
                    <button
                      onClick={addCustomTimer}
                      disabled={!customTimerName.trim() || !customTimerMinutes}
                      className="px-3 py-1 bg-primary-500 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Active Timers */}
                {timers.length > 0 ? (
                  <div className="space-y-3">
                    {timers.map(timer => (
                      <CookingTimer
                        key={timer.id}
                        timer={timer}
                        onRemove={removeTimer}
                        soundEnabled={soundEnabled}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active timers.</p>
                    <p className="text-xs mt-1">Click a quick timer above or add a custom one.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Current Step */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {currentStep + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <h3 className="text-2xl font-semibold text-gray-900">Current Step</h3>
                      <button
                        onClick={() => handleStepComplete(currentStep)}
                        className={`p-2 rounded-lg transition-colors ${
                          completedSteps.has(currentStep)
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="prose prose-lg max-w-none">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {steps[currentStep]?.trim()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* All Steps Overview */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">All Steps ({steps.length} total):</h4>
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-all ${
                          index === currentStep 
                            ? 'bg-primary-50 border-2 border-primary-200' 
                            : completedSteps.has(index)
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setCurrentStep(index)}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === currentStep
                            ? 'bg-primary-500 text-white'
                            : completedSteps.has(index)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {completedSteps.has(index) ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${
                            index === currentStep ? 'text-primary-800 font-medium' : 'text-gray-700'
                          }`}>
                            {step.trim()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cooking Notes */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">📝 Cooking Notes</h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your observations, modifications, or tips while cooking..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="bg-gray-50 border-t px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {completedSteps.size} of {steps.length} steps completed
                  </span>
                  {completedSteps.size === steps.length && (
                    <button
                      onClick={finishCooking}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      Finish Cooking! 🎉
                    </button>
                  )}
                </div>

                {currentStep === steps.length - 1 ? (
                  <button
                    onClick={finishCooking}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <span>Complete</span>
                    <Check className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-500 test-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookingModal;
