'use client';

import React from 'react';
import { DocumentTemplate, DocumentVariable } from '../../types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { validateRequiredVariables } from '../../utils/pdfGenerator';

interface PDFVariablesFormProps {
  template: DocumentTemplate;
  variables: Record<string, string>;
  onVariableChange: (variableName: string, value: string) => void;
  onGeneratePDF: () => void;
  isLoading?: boolean;
}

export default function PDFVariablesForm({
  template,
  variables,
  onVariableChange,
  onGeneratePDF,
  isLoading = false
}: PDFVariablesFormProps) {
  const missingVariables = validateRequiredVariables(template, variables);

  const getInputType = (variable: DocumentVariable) => {
    switch (variable.type) {
      case 'email': return 'email';
      case 'nombre': return 'number';
      case 'date': return 'date';
      case 'telephone': return 'tel';
      default: return 'text';
    }
  };

  const getInputPlaceholder = (variable: DocumentVariable) => {
    switch (variable.type) {
      case 'email': return 'exemple@email.com';
      case 'nombre': return '123';
      case 'date': return '01/01/2024';
      case 'telephone': return '01 23 45 67 89';
      case 'adresse': return '123 Rue Example, 75000 Paris';
      case 'montant': return '150,00 €';
      default: return 'Valeur...';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Variables du document
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Remplissez les variables pour générer votre document PDF
        </p>
      </div>

      <div className="space-y-4">
        {template.variables.map((variable) => (
          <div key={variable.nom} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={variable.nom} className="text-sm font-medium">
                {variable.description || variable.nom}
              </Label>
              {variable.obligatoire && (
                <Badge variant="destructive" className="text-xs">
                  Obligatoire
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {variable.type}
              </Badge>
            </div>
            
            <Input
              id={variable.nom}
              type={getInputType(variable)}
              value={variables[variable.nom] || ''}
              onChange={(e) => onVariableChange(variable.nom, e.target.value)}
              placeholder={variable.exemple || getInputPlaceholder(variable)}
              className={missingVariables.includes(variable.nom) ? 'border-red-500' : ''}
            />
            
            {variable.exemple && (
              <p className="text-xs text-gray-500">
                Exemple: {variable.exemple}
              </p>
            )}
            
            {missingVariables.includes(variable.nom) && (
              <p className="text-xs text-red-500">
                Cette variable est obligatoire
              </p>
            )}
          </div>
        ))}
      </div>

      {missingVariables.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700 font-medium">
            Variables manquantes : {missingVariables.join(', ')}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onGeneratePDF}
          disabled={isLoading || missingVariables.length > 0}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isLoading ? 'Génération...' : 'Générer PDF'}
        </Button>
      </div>
    </div>
  );
} 