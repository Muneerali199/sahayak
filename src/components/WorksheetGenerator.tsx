import React, { useState } from 'react';
import { Upload, FileImage, Download, Layers, Zap } from 'lucide-react';
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Smart Worksheet Generator
        </h1>
        <p className="text-lg text-gray-600">
          Upload textbook pages and generate multi-level worksheets with Gemini Vision AI
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">Processing with Gemini Vision...</p>
                <p className="text-sm text-gray-600">
                  Extracting text and generating multi-level worksheets
                </p>
              </div>
            </div>
          ) : uploadedImage ? (
            <div className="space-y-4">
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="max-w-md mx-auto rounded-lg shadow-sm"
              />
              <p className="text-sm text-gray-600">Processing this image...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <FileImage className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <p className="text-xl font-medium text-gray-900 mb-2">
                  Upload Textbook Page
                </p>
                <p className="text-gray-600 mb-4">
                  Drag and drop an image here, or click to browse
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
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors duration-200"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose File</span>
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
        <h2 className="text-2xl font-semibold text-gray-900">Generated Worksheets</h2>
        
        {worksheetSets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No worksheets generated yet. Upload an image above!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {worksheetSets.map((set) => (
              <div key={set.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={set.originalImage}
                        alt="Original"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Worksheet Set
                        </h3>
                        <p className="text-sm text-gray-600">
                          Generated {set.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        <Zap className="w-3 h-3" />
                        <span>Gemini AI</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Extracted Text */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Text:</h4>
                  <p className="text-sm text-gray-600 italic max-h-32 overflow-y-auto">
                    {set.extractedText}
                  </p>
                </div>

                {/* Worksheets */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {set.worksheets.map((worksheet, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {worksheet.grade}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              worksheet.difficulty === 'Easy' 
                                ? 'bg-green-100 text-green-800'
                                : worksheet.difficulty === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {worksheet.difficulty}
                            </span>
                          </div>
                          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {worksheet.questions.map((question, qIndex) => (
                            <div key={qIndex} className="text-sm">
                              <span className="font-medium text-gray-700">
                                {qIndex + 1}. 
                              </span>
                              <span className="text-gray-600 ml-2">
                                {question}
                              </span>
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