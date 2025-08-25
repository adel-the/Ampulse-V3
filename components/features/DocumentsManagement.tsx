"use client";

import { useState } from 'react';
import { DocumentTemplate, DocumentVariable, DocumentType } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  Download, 
  Copy,
  Trash2,
  Save,
  X,
  CheckCircle,
  XCircle,
  FileType,
  Calendar,
  DollarSign,
  FileDown
} from 'lucide-react';
import PDFPreviewModal from '../modals/PDFPreviewModal';
import { validateRequiredVariables, getVariableExamples } from '../../utils/pdfGenerator';

interface DocumentsManagementProps {
  templates: DocumentTemplate[];
  onTemplateCreate: (template: Omit<DocumentTemplate, 'id'>) => void;
  onTemplateUpdate: (id: number, updates: Partial<DocumentTemplate>) => void;
  onTemplateDelete: (id: number) => void;
  onTemplateDuplicate: (id: number) => void;
}

export default function DocumentsManagement({
  templates,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateDuplicate
}: DocumentsManagementProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<Partial<DocumentTemplate>>({});
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfVariables, setPdfVariables] = useState<Record<string, string>>({});
  const [pdfTemplate, setPdfTemplate] = useState<DocumentTemplate | null>(null);

  const filteredTemplates = templates.filter(template => {
    if (filterType !== 'all' && template.type !== filterType) return false;
    if (filterStatus !== 'all' && template.statut !== filterStatus) return false;
    return true;
  });

  const getTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'facture': return <DollarSign className="w-4 h-4" />;
      case 'bon_reservation': return <FileText className="w-4 h-4" />;
      case 'prolongation_reservation': return <Calendar className="w-4 h-4" />;
      case 'fin_prise_charge': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'facture': return 'Facture';
      case 'bon_reservation': return 'Bon de réservation';
      case 'prolongation_reservation': return 'Prolongation';
      case 'fin_prise_charge': return 'Fin de prise en charge';
      default: return type;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'pdf': return 'PDF';
      case 'docx': return 'Word';
      case 'html': return 'HTML';
      default: return format.toUpperCase();
    }
  };

  const getStatusIcon = (statut: string) => {
    return statut === 'actif' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
  };

  const handleEdit = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setEditingTemplate(template);
    setIsEditing(true);
    setActiveTab('edit');
  };

  const handlePreview = (template: DocumentTemplate) => {
    setPreviewTemplate(template);
    setActiveTab('preview');
  };

  const handleSave = () => {
    if (isEditing && selectedTemplate) {
      onTemplateUpdate(selectedTemplate.id, editingTemplate);
    } else if (isCreating) {
      onTemplateCreate(editingTemplate as Omit<DocumentTemplate, 'id'>);
    }
    setIsEditing(false);
    setIsCreating(false);
    setSelectedTemplate(null);
    setEditingTemplate({});
    setActiveTab('list');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedTemplate(null);
    setEditingTemplate({});
    setActiveTab('list');
  };

  const handleCreate = () => {
    setEditingTemplate({
      nom: '',
      type: 'facture',
      description: '',
      contenu: '',
      variables: [],
      statut: 'actif',
      dateCreation: new Date().toLocaleDateString('fr-FR'),
      dateModification: new Date().toLocaleDateString('fr-FR'),
      version: '1.0',
      format: 'pdf'
    });
    setIsCreating(true);
    setActiveTab('edit');
  };

  const handleVariableChange = (index: number, field: keyof DocumentVariable, value: string | boolean) => {
    setEditingTemplate(prev => ({
      ...prev,
      variables: prev.variables?.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ) || []
    }));
  };

  const handleAddVariable = () => {
    setEditingTemplate(prev => ({
      ...prev,
      variables: [
        ...(prev.variables || []),
        { nom: '', description: '', type: 'texte', obligatoire: false }
      ]
    }));
  };

  const handleRemoveVariable = (index: number) => {
    setEditingTemplate(prev => ({
      ...prev,
      variables: prev.variables?.filter((_, i) => i !== index) || []
    }));
  };

  const generatePreviewContent = (template: DocumentTemplate | Partial<DocumentTemplate>) => {
    if (!template.contenu) return '';
    
    let content = template.contenu;
    const variables = template.variables || [];
    
    variables.forEach(variable => {
      const placeholder = `{{${variable.nom}}}`;
      const example = variable.exemple || getDefaultExample(variable.type);
      content = content.replace(new RegExp(placeholder, 'g'), example);
    });
    
    return content;
  };

  const getDefaultExample = (type: string) => {
    switch (type) {
      case 'texte': return 'Exemple de texte';
      case 'nombre': return '123';
      case 'date': return '01/01/2024';
      case 'email': return 'exemple@email.com';
      case 'telephone': return '01 23 45 67 89';
      case 'adresse': return '123 Rue Example, 75000 Paris';
      case 'montant': return '150,00 €';
      default: return 'Valeur exemple';
    }
  };

  const getCurrentPreviewTemplate = () => {
    if (isEditing || isCreating) {
      return editingTemplate;
    }
    return previewTemplate;
  };

  const handleGeneratePDF = (template: DocumentTemplate) => {
    setPdfTemplate(template);
    // Pré-remplir avec les exemples
    const examples = getVariableExamples(template);
    setPdfVariables(examples);
    setIsPDFModalOpen(true);
  };

  const handlePDFModalClose = () => {
    setIsPDFModalOpen(false);
    setPdfTemplate(null);
    setPdfVariables({});
  };

  const handlePDFVariableChange = (variableName: string, value: string) => {
    setPdfVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const validatePDFVariables = () => {
    if (!pdfTemplate) return [];
    return validateRequiredVariables(pdfTemplate, pdfVariables);
  };

  const currentPreviewTemplate = getCurrentPreviewTemplate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Documents Types</h2>
          <p className="text-gray-600">Configurez vos modèles de documents avec variables dynamiques</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau modèle
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Modèles</TabsTrigger>
          <TabsTrigger value="edit">Édition</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="type-filter">Filtrer par type</Label>
              <select
                id="type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tous les types</option>
                <option value="facture">Facture</option>
                <option value="bon_reservation">Bon de réservation</option>
                <option value="prolongation_reservation">Prolongation</option>
                <option value="fin_prise_charge">Fin de prise en charge</option>
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="status-filter">Filtrer par statut</Label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{getTypeIcon(template.type)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{template.nom}</h3>
                          {getStatusIcon(template.statut)}
                        </div>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {getTypeLabel(template.type)}
                          </Badge>
                          <Badge variant="secondary">
                            {getFormatLabel(template.format)}
                          </Badge>
                          <Badge variant="outline">
                            v{template.version}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTemplateDuplicate(template.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGeneratePDF(template)}
                      >
                        <FileDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTemplateDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>Créé le {template.dateCreation}</span>
                      <span>Modifié le {template.dateModification}</span>
                      <span>{template.variables.length} variables</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          {(isEditing || isCreating) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isEditing ? 'Modifier le modèle' : 'Nouveau modèle'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nom">Nom du modèle</Label>
                      <Input
                        id="nom"
                        value={editingTemplate.nom || ''}
                        onChange={(e) => setEditingTemplate(prev => ({ ...prev, nom: e.target.value }))}
                        placeholder="Ex: Facture Standard"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type de document</Label>
                      <select
                        id="type"
                        value={editingTemplate.type || 'facture'}
                        onChange={(e) => setEditingTemplate(prev => ({ ...prev, type: e.target.value as DocumentType }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="facture">Facture</option>
                        <option value="bon_reservation">Bon de réservation</option>
                        <option value="prolongation_reservation">Prolongation</option>
                        <option value="fin_prise_charge">Fin de prise en charge</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={editingTemplate.description || ''}
                      onChange={(e) => setEditingTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description du modèle"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contenu">Contenu du modèle</Label>
                    <Textarea
                      id="contenu"
                      value={editingTemplate.contenu || ''}
                      onChange={(e) => setEditingTemplate(prev => ({ ...prev, contenu: e.target.value }))}
                      placeholder="Contenu du document avec variables {{variable}}"
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Utilisez <code>&#123;&#123;variable&#125;&#125;</code> pour insérer des variables dynamiques
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="format">Format</Label>
                      <select
                        id="format"
                        value={editingTemplate.format || 'pdf'}
                        onChange={(e) => setEditingTemplate(prev => ({ ...prev, format: e.target.value as 'pdf' | 'docx' | 'html' }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="pdf">PDF</option>
                        <option value="docx">Word</option>
                        <option value="html">HTML</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="statut">Statut</Label>
                      <select
                        id="statut"
                        value={editingTemplate.statut || 'actif'}
                        onChange={(e) => setEditingTemplate(prev => ({ ...prev, statut: e.target.value as 'actif' | 'inactif' }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Variables du modèle</Label>
                    <div className="space-y-2 mt-2">
                      {(editingTemplate.variables || []).map((variable, idx) => (
                        <div key={idx} className="flex flex-wrap gap-2 items-end border p-2 rounded-md">
                          <div className="flex-1 min-w-[120px]">
                            <Label>Nom</Label>
                            <Input
                              value={variable.nom}
                              onChange={e => handleVariableChange(idx, 'nom', e.target.value)}
                              placeholder="nom_variable"
                            />
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <Label>Type</Label>
                            <select
                              value={variable.type}
                              onChange={e => handleVariableChange(idx, 'type', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="texte">Texte</option>
                              <option value="nombre">Nombre</option>
                              <option value="date">Date</option>
                              <option value="email">Email</option>
                              <option value="telephone">Téléphone</option>
                              <option value="adresse">Adresse</option>
                              <option value="montant">Montant</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <Label>Description</Label>
                            <Input
                              value={variable.description}
                              onChange={e => handleVariableChange(idx, 'description', e.target.value)}
                              placeholder="Description de la variable"
                            />
                          </div>
                          <div className="flex-1 min-w-[80px]">
                            <Label>Obligatoire</Label>
                            <select
                              value={variable.obligatoire ? 'oui' : 'non'}
                              onChange={e => handleVariableChange(idx, 'obligatoire', e.target.value === 'oui')}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="oui">Oui</option>
                              <option value="non">Non</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <Label>Exemple</Label>
                            <Input
                              value={variable.exemple || ''}
                              onChange={e => handleVariableChange(idx, 'exemple', e.target.value)}
                              placeholder="Exemple"
                            />
                          </div>
                          <Button variant="outline" size="icon" onClick={() => handleRemoveVariable(idx)} className="text-red-600 hover:text-red-700 ml-2">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="secondary" onClick={handleAddVariable} className="mt-2">
                        <Plus className="w-4 h-4 mr-2" /> Ajouter une variable
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aperçu en temps réel</CardTitle>
                  <CardDescription>
                    Prévisualisez votre document avec les exemples de variables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {editingTemplate.contenu ? (
                    <div className="border rounded-lg p-4 bg-white min-h-[400px]">
                      <div className="mb-4 pb-2 border-b">
                        <h3 className="font-semibold text-lg">{editingTemplate.nom || 'Nom du modèle'}</h3>
                        <p className="text-sm text-gray-600">{editingTemplate.description || 'Description du modèle'}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{getTypeLabel(editingTemplate.type as DocumentType)}</Badge>
                          <Badge variant="secondary">{getFormatLabel(editingTemplate.format || 'pdf')}</Badge>
                        </div>
                      </div>
                      <div className="prose max-w-none">
                        <div 
                          className="whitespace-pre-wrap text-sm"
                          dangerouslySetInnerHTML={{ 
                            __html: generatePreviewContent(editingTemplate).replace(/\n/g, '<br>') 
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-8 bg-gray-50 min-h-[400px] flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4" />
                        <p>Commencez à écrire le contenu pour voir l'aperçu</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Sélectionnez un modèle à modifier ou créez-en un nouveau</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {currentPreviewTemplate ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du modèle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nom</Label>
                    <p className="text-lg font-semibold">{currentPreviewTemplate.nom}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="text-gray-700">{currentPreviewTemplate.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Type</Label>
                      <Badge variant="outline">{getTypeLabel(currentPreviewTemplate.type as DocumentType)}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Format</Label>
                      <Badge variant="secondary">{getFormatLabel(currentPreviewTemplate.format || 'pdf')}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Version</Label>
                      <p>{currentPreviewTemplate.version}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Statut</Label>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(currentPreviewTemplate.statut || 'actif')}
                        <span className="capitalize">{currentPreviewTemplate.statut}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Variables ({currentPreviewTemplate.variables?.length || 0})</Label>
                    <div className="mt-2 space-y-2">
                                             {(currentPreviewTemplate.variables || []).map((variable, idx) => (
                         <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                           <div>
                             <span className="font-medium">{`{{${variable.nom}}}`}</span>
                             <span className="text-sm text-gray-600 ml-2">({variable.type})</span>
                           </div>
                           <Badge variant={variable.obligatoire ? "default" : "secondary"}>
                             {variable.obligatoire ? 'Obligatoire' : 'Optionnel'}
                           </Badge>
                         </div>
                       ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aperçu du document</CardTitle>
                  <CardDescription>
                    Document avec les variables remplacées par des exemples
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-white min-h-[500px]">
                    <div className="mb-4 pb-2 border-b">
                      <h3 className="font-semibold text-lg">{currentPreviewTemplate.nom}</h3>
                      <p className="text-sm text-gray-600">{currentPreviewTemplate.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{getTypeLabel(currentPreviewTemplate.type as DocumentType)}</Badge>
                        <Badge variant="secondary">{getFormatLabel(currentPreviewTemplate.format || 'pdf')}</Badge>
                      </div>
                    </div>
                    <div className="prose max-w-none">
                      <div 
                        className="whitespace-pre-wrap text-sm"
                        dangerouslySetInnerHTML={{ 
                          __html: generatePreviewContent(currentPreviewTemplate).replace(/\n/g, '<br>') 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total des modèles</p>
                        <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Modèles actifs</p>
                        <p className="text-2xl font-bold text-green-600">
                          {templates.filter(t => t.statut === 'actif').length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Types de documents</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {new Set(templates.map(t => t.type)).size}
                        </p>
                      </div>
                      <FileType className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['facture', 'bon_reservation', 'prolongation_reservation', 'fin_prise_charge'].map(type => {
                        const count = templates.filter(t => t.type === type).length;
                        const percentage = templates.length > 0 ? (count / templates.length * 100).toFixed(1) : '0';
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{getTypeLabel(type as DocumentType)}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['pdf', 'docx', 'html'].map(format => {
                        const count = templates.filter(t => t.format === format).length;
                        const percentage = templates.length > 0 ? (count / templates.length * 100).toFixed(1) : '0';
                        return (
                          <div key={format} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{getFormatLabel(format)}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Modèles récents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {templates
                      .sort((a, b) => new Date(b.dateModification).getTime() - new Date(a.dateModification).getTime())
                      .slice(0, 5)
                      .map(template => (
                        <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(template.type)}
                            <div>
                              <p className="font-medium">{template.nom}</p>
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Modifié le {template.dateModification}</p>
                            <Badge variant="outline">{getTypeLabel(template.type)}</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de prévisualisation PDF */}
      {pdfTemplate && (
        <PDFPreviewModal
          isOpen={isPDFModalOpen}
          onClose={handlePDFModalClose}
          template={pdfTemplate}
          variables={pdfVariables}
          onVariableChange={handlePDFVariableChange}
        />
      )}
    </div>
  );
} 
