'use client';

import React, { useState, useEffect } from 'react';
import { PDFGenerator, PDFGenerationOptions } from '../../utils/pdfGenerator';
import { DocumentTemplate } from '../../types';
import PDFVariablesForm from '../forms/PDFVariablesForm';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: DocumentTemplate;
  variables: Record<string, string>;
  onVariableChange?: (variableName: string, value: string) => void;
}

export default function PDFPreviewModal({ isOpen, onClose, template, variables, onVariableChange }: PDFPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState(`${template.nom.toLowerCase().replace(/\s+/g, '_')}.pdf`);

  useEffect(() => {
    if (isOpen && template) {
      // Ne pas générer automatiquement au début, laisser l'utilisateur remplir les variables
    }
  }, [isOpen, template]);

  const generatePDFPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const options: PDFGenerationOptions = {
        template,
        variables,
        filename,
        format: 'A4',
        orientation: 'portrait'
      };
      
      const url = await PDFGenerator.previewPDF(options);
      setPdfUrl(url);
    } catch (err) {
      setError('Erreur lors de la génération du PDF');
      console.error('Erreur PDF:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const options: PDFGenerationOptions = {
        template,
        variables,
        filename,
        format: 'A4',
        orientation: 'portrait'
      };
      
      await PDFGenerator.downloadPDF(options);
    } catch (err) {
      setError('Erreur lors du téléchargement du PDF');
      console.error('Erreur téléchargement:', err);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Prévisualisation PDF - {template.nom}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Aperçu du document généré
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Formulaire des variables */}
            <div className="border-r pr-6">
              <PDFVariablesForm
                template={template}
                variables={variables}
                onVariableChange={onVariableChange || (() => {})}
                onGeneratePDF={generatePDFPreview}
                isLoading={isLoading}
              />
            </div>

            {/* Prévisualisation PDF */}
            <div className="h-full">
              {isLoading && (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-gray-600">Génération du PDF en cours...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <p className="text-red-600 font-medium">{error}</p>
                    <button
                      onClick={generatePDFPreview}
                      className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              )}

              {pdfUrl && !isLoading && (
                <div className="h-full">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border border-gray-200 rounded"
                    title="PDF Preview"
                  />
                </div>
              )}

              {!pdfUrl && !isLoading && !error && (
                <div className="flex items-center justify-center h-64 border border-gray-200 rounded">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📄</div>
                    <p>Remplissez les variables et cliquez sur "Générer PDF" pour voir l'aperçu</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Nom du fichier:
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="nom_du_fichier.pdf"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={generatePDFPreview}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Actualiser
            </button>
            <button
              onClick={handleDownload}
              disabled={isLoading || !pdfUrl}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              Télécharger PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
