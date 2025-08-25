import { useState } from 'react';
import RoomCategories from '../features/RoomCategories';
import RoomCharacteristics from '../features/RoomCharacteristics';
import RoomOptions from '../features/RoomOptions';
import RoomList from '../features/RoomList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  LayoutDashboard, 
  Eye, 
  List, 
  Building2
} from 'lucide-react';

interface ChambresPageProps {
  selectedHotel?: {
    id: number;
    nom: string;
    chambresTotal: number;
    chambresOccupees: number;
    tauxOccupation: number;
  } | null;
  onActionClick?: (action: string) => void;
}

export default function ChambresPage({ selectedHotel, onActionClick }: ChambresPageProps) {
  const [activeTab, setActiveTab] = useState('chambres-liste');





  return (
    <div>
      {/* Affichage de l'établissement sélectionné */}
      <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="text-blue-900 font-medium text-sm">
            Établissement : {selectedHotel?.nom || 'Établissement par défaut'}
          </span>
        </div>
      </div>
      
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chambres-liste">Liste des Chambres</TabsTrigger>
            <TabsTrigger value="chambres-categories">Catégories</TabsTrigger>
            <TabsTrigger value="chambres-caracteristiques">Caractéristiques</TabsTrigger>
            <TabsTrigger value="chambres-options">Options/Suppléments</TabsTrigger>
          </TabsList>

          <TabsContent value="chambres-liste" className="space-y-6">
            <RoomList />
          </TabsContent>

          <TabsContent value="chambres-categories" className="space-y-6">
            <RoomCategories />
          </TabsContent>

          <TabsContent value="chambres-caracteristiques" className="space-y-6">
            <RoomCharacteristics />
          </TabsContent>

          <TabsContent value="chambres-options" className="space-y-6">
            <RoomOptions />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
