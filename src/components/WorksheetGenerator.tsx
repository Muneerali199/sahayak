import React, { useState } from 'react';
import { Upload, FileImage, Download, Layers, Zap, ChevronDown } from 'lucide-react';
import { worksheetService } from '../services/geminiService';

interface WorksheetSet {
  id: string;
  originalImage: string;
  extractedText: string;
  worksheets: {
    grade: string;
    difficulty: string;
    questions: string[];
  }[];
  timestamp: Date;
}

export function WorksheetGenerator() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [worksheetSets, setWorksheetSets] = useState<WorksheetSet[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('All Grades');

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setUploadedImage(imageData);
      processImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    
    try {
      // Extract text from image using Gemini Vision
      const extractedText = await worksheetService.extractTextFromImage(imageData);
      
      // Generate worksheets based on extracted text
      const worksheets = await worksheetService.generateWorksheets(extractedText, 'General');
      
      const newWorksheetSet: WorksheetSet = {
        id: Date.now().toString(),
        originalImage: imageData,
        extractedText: extractedText,
        worksheets: worksheets,
        timestamp: new Date(),
      };
      
      setWorksheetSets([newWorksheetSet, ...worksheetSets]);
    } catch (error) {
      console.error('Image processing failed:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
      setUploadedImage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const filteredWorksheetSets = worksheetSets.filter(set => 
    selectedGrade === 'All Grades' || 
    set.worksheets.some(ws => ws.grade === selectedGrade)
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-800 mb-4">
          Smart Worksheet Generator
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Upload textbook pages and generate multi-level worksheets with Gemini Vision AI
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="space-y-6">
              <div className="animate-spin mx-auto w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
              <div className="space-y-3">
                <p className="text-xl font-medium text-gray-900">Processing with Gemini Vision...</p>
                <p className="text-gray-600">
                  Extracting text and generating multi-level worksheets
                </p>
              </div>
            </div>
          ) : uploadedImage ? (
            <div className="space-y-6">
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="max-w-md mx-auto rounded-xl shadow-sm border border-gray-200"
              />
              <p className="text-gray-600">Processing this image...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <FileImage className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-medium text-gray-900 mb-3">
                  Upload Textbook Page
                </p>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Drag and drop an image here, or click to browse files
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 cursor-pointer transition-colors duration-200 shadow-md"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Choose File</span>
                </label>
              </div>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, WebP formats
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Worksheets */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">Generated Worksheets</h2>
          
          {worksheetSets.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Filter by grade:</span>
              <div className="relative">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="All Grades">All Grades</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
        
        {filteredWorksheetSets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="mx-auto h-24 w-24 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
              <Layers className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No worksheets generated yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Upload a textbook page image to create your first set of worksheets
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredWorksheetSets.map((set) => (
              <div key={set.id} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={set.originalImage}
                        alt="Original"
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Worksheet Set
                        </h3>
                        <p className="text-sm text-gray-600">
                          Generated {set.timestamp.toLocaleDateString([], { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center space-x-2 px-4 py-1.5 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                        <Zap className="w-4 h-4" />
                        <span>Gemini AI</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Extracted Text */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Extracted Text:</h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-600">
                      {set.extractedText}
                    </p>
                  </div>
                </div>

                {/* Worksheets */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {set.worksheets.map((worksheet, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {worksheet.grade}
                            </span>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              worksheet.difficulty === 'Easy' 
                                ? 'bg-green-100 text-green-800'
                                : worksheet.difficulty === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {worksheet.difficulty}
                            </span>
                          </div>
                          <button 
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            title="Download worksheet"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {worksheet.questions.map((question, qIndex) => (
                            <div key={qIndex} className="flex items-start">
                              <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full mr-3 mt-0.5">
                                {qIndex + 1}
                              </span>
                              <p className="text-gray-700">
                                {question}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}