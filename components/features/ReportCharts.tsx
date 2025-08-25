"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface ReportChartsProps {
  type: 'reservations' | 'revenue' | 'occupancy' | 'clients' | 'hotels';
  period: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function ReportCharts({ type, period }: ReportChartsProps) {
  // Données synthétiques pour les réservations
  const reservationsData = [
    { month: 'Jan', confirmées: 145, enCours: 23, annulées: 12, total: 180 },
    { month: 'Fév', confirmées: 132, enCours: 18, annulées: 8, total: 158 },
    { month: 'Mar', confirmées: 167, enCours: 25, annulées: 15, total: 207 },
    { month: 'Avr', confirmées: 189, enCours: 31, annulées: 9, total: 229 },
    { month: 'Mai', confirmées: 201, enCours: 28, annulées: 11, total: 240 },
    { month: 'Juin', confirmées: 234, enCours: 35, annulées: 13, total: 282 }
  ];

  // Données pour les revenus
  const revenueData = [
    { month: 'Jan', revenus: 52000, objectif: 50000, croissance: 4 },
    { month: 'Fév', revenus: 48000, objectif: 50000, croissance: -4 },
    { month: 'Mar', revenus: 61000, objectif: 55000, croissance: 11 },
    { month: 'Avr', revenus: 68000, objectif: 60000, croissance: 13 },
    { month: 'Mai', revenus: 72000, objectif: 65000, croissance: 11 },
    { month: 'Juin', revenus: 84000, objectif: 70000, croissance: 20 }
  ];

  // Données pour l'occupation
  const occupancyData = [
    { hotel: 'Hôtel Central', occupation: 92, revenus: 15600, satisfaction: 4.8 },
    { hotel: 'Résidence du Port', occupation: 88, revenus: 12800, satisfaction: 4.6 },
    { hotel: 'Château des Alpes', occupation: 85, revenus: 11200, satisfaction: 4.7 },
    { hotel: 'Auberge Provençale', occupation: 82, revenus: 9800, satisfaction: 4.5 },
    { hotel: 'Hôtel des Arts', occupation: 79, revenus: 8900, satisfaction: 4.4 }
  ];

  // Données pour les clients
  const clientsData = [
    { type: 'Particuliers', nombre: 45, revenus: 18000, pourcentage: 45 },
    { type: 'Entreprises', nombre: 25, revenus: 15000, pourcentage: 25 },
    { type: 'Associations', nombre: 20, revenus: 18000, pourcentage: 20 },
    { type: 'Institutions', nombre: 10, revenus: 8000, pourcentage: 10 }
  ];

  // Données pour les performances hôtels
  const hotelsPerformanceData = [
    { hotel: 'Hôtel Central', reservations: 234, revenus: 15600, occupation: 92, satisfaction: 4.8 },
    { hotel: 'Résidence du Port', reservations: 189, revenus: 12800, occupation: 88, satisfaction: 4.6 },
    { hotel: 'Château des Alpes', reservations: 156, revenus: 11200, occupation: 85, satisfaction: 4.7 },
    { hotel: 'Auberge Provençale', reservations: 134, revenus: 9800, occupation: 82, satisfaction: 4.5 },
    { hotel: 'Hôtel des Arts', reservations: 123, revenus: 8900, occupation: 79, satisfaction: 4.4 }
  ];

  // Données pour le radar chart (analyse multidimensionnelle)
  const radarData = [
    { metric: 'Taux d\'occupation', valeur: 85, objectif: 90 },
    { metric: 'Satisfaction client', valeur: 4.6, objectif: 4.8 },
    { metric: 'Revenus', valeur: 75, objectif: 80 },
    { metric: 'Efficacité opérationnelle', valeur: 88, objectif: 85 },
    { metric: 'Fidélisation', valeur: 82, objectif: 85 },
    { metric: 'Qualité de service', valeur: 4.7, objectif: 4.9 }
  ];

  // Données pour les tendances temporelles
  const trendsData = [
    { mois: 'Jan', reservations: 145, revenus: 52000, occupation: 72 },
    { mois: 'Fév', reservations: 132, revenus: 48000, occupation: 68 },
    { mois: 'Mar', reservations: 167, revenus: 61000, occupation: 75 },
    { mois: 'Avr', reservations: 189, revenus: 68000, occupation: 82 },
    { mois: 'Mai', reservations: 201, revenus: 72000, occupation: 85 },
    { mois: 'Juin', reservations: 234, revenus: 84000, occupation: 88 }
  ];

  const renderReservationsCharts = () => (
    <div className="space-y-6">
      {/* Graphique en barres empilées des réservations */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Évolution des réservations par statut</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reservationsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="confirmées" stackId="a" fill="#0088FE" />
            <Bar dataKey="enCours" stackId="a" fill="#00C49F" />
            <Bar dataKey="annulées" stackId="a" fill="#FF8042" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique linéaire des tendances */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Tendances des réservations</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="reservations" stroke="#0088FE" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderRevenueCharts = () => (
    <div className="space-y-6">
      {/* Graphique composé revenus vs objectifs */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Revenus vs Objectifs</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenus" fill="#0088FE" />
            <Line type="monotone" dataKey="objectif" stroke="#FF8042" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique en aire des revenus */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Évolution des revenus</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="revenus" stroke="#0088FE" fill="#0088FE" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderOccupancyCharts = () => (
    <div className="space-y-6">
      {/* Graphique en barres de l'occupation */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Taux d'occupation par établissement</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={occupancyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hotel" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="occupation" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique radar des performances */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Analyse multidimensionnelle</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Valeur actuelle" dataKey="valeur" stroke="#0088FE" fill="#0088FE" fillOpacity={0.3} />
            <Radar name="Objectif" dataKey="objectif" stroke="#FF8042" fill="#FF8042" fillOpacity={0.1} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderClientsCharts = () => (
    <div className="space-y-6">
      {/* Graphique en camembert des types de clients */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Répartition des types de clients</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={clientsData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ type, pourcentage }) => `${type}: ${pourcentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="nombre"
            >
              {clientsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique en barres des revenus par type */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Revenus par type de client</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={clientsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenus" fill="#8884D8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderHotelsCharts = () => (
    <div className="space-y-6">
      {/* Graphique en barres des performances */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Performance des hôtels</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hotelsPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hotel" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="reservations" fill="#0088FE" />
            <Bar dataKey="revenus" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique en ligne de la satisfaction */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Satisfaction client par hôtel</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hotelsPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hotel" />
            <YAxis domain={[4, 5]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="satisfaction" stroke="#FF8042" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderCharts = () => {
    switch (type) {
      case 'reservations':
        return renderReservationsCharts();
      case 'revenue':
        return renderRevenueCharts();
      case 'occupancy':
        return renderOccupancyCharts();
      case 'clients':
        return renderClientsCharts();
      case 'hotels':
        return renderHotelsCharts();
      default:
        return <div>Aucun graphique disponible pour ce type</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Graphiques - {type.charAt(0).toUpperCase() + type.slice(1)}
        </h2>
        <p className="text-gray-600">Période : {period}</p>
      </div>
      
      {renderCharts()}
    </div>
  );
} 
