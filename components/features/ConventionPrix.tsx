'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Calculator, Euro, Calendar, RotateCcw, Save } from 'lucide-react';
import { useRoomCategories } from '@/hooks/useSupabase';

interface MonthlyPrice {
  janvier?: number;
  fevrier?: number;
  mars?: number;
  avril?: number;
  mai?: number;
  juin?: number;
  juillet?: number;
  aout?: number;
  septembre?: number;
  octobre?: number;
  novembre?: number;
  decembre?: number;
}

interface CategoryPricing {
  categoryId: string;
  categoryName: string;
  defaultPrice: number;
  monthlyPrices: MonthlyPrice;
  conditions?: string;
}

export interface ConventionPrixRef {
  getPricingData: () => CategoryPricing[];
  validateData: () => boolean;
}

interface ConventionPrixProps {
  onSave?: (pricingData: CategoryPricing[]) => void;
  initialData?: CategoryPricing[];
  disabled?: boolean;
  showSaveButton?: boolean;
}

const MONTHS = [
  { key: 'janvier', label: 'Jan', fullName: 'Janvier' },
  { key: 'fevrier', label: 'Fév', fullName: 'Février' },
  { key: 'mars', label: 'Mar', fullName: 'Mars' },
  { key: 'avril', label: 'Avr', fullName: 'Avril' },
  { key: 'mai', label: 'Mai', fullName: 'Mai' },
  { key: 'juin', label: 'Jun', fullName: 'Juin' },
  { key: 'juillet', label: 'Jul', fullName: 'Juillet' },
  { key: 'aout', label: 'Août', fullName: 'Août' },
  { key: 'septembre', label: 'Sep', fullName: 'Septembre' },
  { key: 'octobre', label: 'Oct', fullName: 'Octobre' },
  { key: 'novembre', label: 'Nov', fullName: 'Novembre' },
  { key: 'decembre', label: 'Déc', fullName: 'Décembre' }
] as const;

const ConventionPrix = forwardRef<ConventionPrixRef, ConventionPrixProps>(
  ({ onSave, initialData, disabled = false, showSaveButton = true }, ref) => {
    const { categories: roomCategories, loading: categoriesLoading } = useRoomCategories();
    const [pricingData, setPricingData] = useState<CategoryPricing[]>([]);

  // Initialize pricing data when room categories are loaded
  useEffect(() => {
    console.log('[ConventionPrix] useEffect triggered');
    console.log('[ConventionPrix] roomCategories:', roomCategories);
    console.log('[ConventionPrix] initialData:', initialData);
    
    if (roomCategories && roomCategories.length > 0) {
      if (initialData && initialData.length > 0) {
        console.log('[ConventionPrix] Setting pricing data from initialData:', initialData);
        setPricingData(initialData);
      } else {
        console.log('[ConventionPrix] No initialData, using default values');
        // Initialize with default values based on room categories
        const initialPricing: CategoryPricing[] = roomCategories.map(category => ({
          categoryId: category.id.toString(),
          categoryName: category.name,
          defaultPrice: 45, // Default base price
          monthlyPrices: {},
          conditions: ''
        }));
        setPricingData(initialPricing);
      }
    }
  }, [roomCategories, initialData]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getPricingData: () => {
      // Clean the data before returning
      return pricingData.map(item => ({
        ...item,
        monthlyPrices: cleanMonthlyPrices(item.monthlyPrices),
        defaultPrice: item.defaultPrice || 0
      }));
    },
    validateData: () => {
      // Check if at least one category has a valid default price
      return pricingData.some(item => item.defaultPrice && item.defaultPrice > 0);
    }
  }), [pricingData]);

  const updateDefaultPrice = (categoryId: string, price: number) => {
    setPricingData(prev => prev.map(item => 
      item.categoryId === categoryId 
        ? { ...item, defaultPrice: price }
        : item
    ));
  };

  const updateMonthlyPrice = (categoryId: string, month: string, price: number) => {
    setPricingData(prev => prev.map(item => 
      item.categoryId === categoryId 
        ? { 
            ...item, 
            monthlyPrices: {
              ...item.monthlyPrices,
              [month]: price > 0 ? price : undefined
            }
          }
        : item
    ));
  };

  const updateConditions = (categoryId: string, conditions: string) => {
    setPricingData(prev => prev.map(item => 
      item.categoryId === categoryId 
        ? { ...item, conditions }
        : item
    ));
  };

  const applyDefaultToAllMonths = (categoryId: string) => {
    const categoryData = pricingData.find(item => item.categoryId === categoryId);
    if (!categoryData) return;

    const monthlyPrices: MonthlyPrice = {};
    MONTHS.forEach(({ key }) => {
      monthlyPrices[key as keyof MonthlyPrice] = categoryData.defaultPrice;
    });

    setPricingData(prev => prev.map(item => 
      item.categoryId === categoryId 
        ? { ...item, monthlyPrices }
        : item
    ));
  };

  const clearAllPrices = (categoryId: string) => {
    setPricingData(prev => prev.map(item => 
      item.categoryId === categoryId 
        ? { ...item, monthlyPrices: {} }
        : item
    ));
  };

  const cleanMonthlyPrices = (monthlyPrices: MonthlyPrice): MonthlyPrice => {
    const cleaned: MonthlyPrice = {};
    Object.entries(monthlyPrices).forEach(([month, price]) => {
      if (price !== undefined && price > 0) {
        cleaned[month as keyof MonthlyPrice] = price;
      }
    });
    return cleaned;
  };

  const handleSave = () => {
    // Clean the data before saving - remove undefined values
    const cleanedPricingData = pricingData.map(item => ({
      ...item,
      monthlyPrices: cleanMonthlyPrices(item.monthlyPrices),
      defaultPrice: item.defaultPrice || 0
    }));
    onSave?.(cleanedPricingData);
  };

  if (categoriesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des catégories...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!roomCategories || roomCategories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune catégorie de chambre</h3>
            <p className="text-gray-600">
              Veuillez d'abord créer des catégories de chambres pour définir les conventions de prix.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                Convention de prix mensuelle
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Définissez les tarifs par catégorie de chambre pour chaque mois de l'année
              </p>
            </div>
            {onSave && showSaveButton && (
              <Button onClick={handleSave} disabled={disabled} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Sauvegarder
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {pricingData.map((categoryData) => (
        <Card key={categoryData.categoryId}>
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">
              {categoryData.categoryName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Default Price */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Prix par défaut (€)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => applyDefaultToAllMonths(categoryData.categoryId)}
                    disabled={disabled}
                    className="text-xs"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Appliquer à tous les mois
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => clearAllPrices(categoryData.categoryId)}
                    disabled={disabled}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Vider tous
                  </Button>
                </div>
              </div>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={categoryData.defaultPrice || ''}
                onChange={(e) => updateDefaultPrice(categoryData.categoryId, parseFloat(e.target.value) || 0)}
                placeholder="Prix par défaut"
                disabled={disabled}
                className="w-full"
              />
            </div>

            {/* Monthly Pricing Grid */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tarifs mensuels (€)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {MONTHS.map(({ key, label, fullName }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-gray-600" title={fullName}>
                      {label}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={categoryData.monthlyPrices[key as keyof MonthlyPrice] || ''}
                      onChange={(e) => updateMonthlyPrice(
                        categoryData.categoryId, 
                        key, 
                        parseFloat(e.target.value) || 0
                      )}
                      placeholder="--"
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Conditions spéciales</Label>
              <Textarea
                value={categoryData.conditions || ''}
                onChange={(e) => updateConditions(categoryData.categoryId, e.target.value)}
                placeholder="Conditions particulières pour cette catégorie..."
                rows={2}
                disabled={disabled}
                className="text-sm"
              />
            </div>

            {/* Price Summary */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">Résumé des tarifs</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700">
                {MONTHS.map(({ key, label }) => {
                  const price = categoryData.monthlyPrices[key as keyof MonthlyPrice];
                  return (
                    <div key={key} className="flex justify-between">
                      <span>{label}:</span>
                      <span className="font-medium">
                        {price ? `${price}€` : `${categoryData.defaultPrice || 0}€`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

ConventionPrix.displayName = 'ConventionPrix';

export default ConventionPrix;