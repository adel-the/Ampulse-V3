import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extension pour jsPDF avec autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
    autoTable: (options: any) => jsPDF;
  }
}

interface ReportData {
  title: string;
  period: string;
  generatedAt: string;
  type: string;
  data: any;
}

interface ReservationData {
  id: string;
  clientName: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  amount: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  reservations: number;
  occupancy: number;
}

interface HotelPerformance {
  name: string;
  reservations: number;
  revenue: number;
  occupancy: number;
  rating: number;
}

export class ReportGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  // Générer un rapport de réservations
  generateReservationsReport(data: ReportData): string {
    this.doc.setFontSize(20);
    this.doc.text('Rapport des Réservations', 20, 20);
    
    this.doc.setFontSize(12);
    this.doc.text(`Période: ${data.period}`, 20, 35);
    this.doc.text(`Généré le: ${data.generatedAt}`, 20, 45);
    
    // Statistiques générales
    this.doc.setFontSize(16);
    this.doc.text('Statistiques générales', 20, 65);
    
    const stats = this.calculateReservationStats(data.data);
    this.doc.setFontSize(10);
    this.doc.text(`Total réservations: ${stats.total}`, 20, 80);
    this.doc.text(`Réservations confirmées: ${stats.confirmed}`, 20, 90);
    this.doc.text(`Réservations en cours: ${stats.pending}`, 20, 100);
    this.doc.text(`Revenus totaux: ${stats.totalRevenue}€`, 20, 110);
    
    // Graphique simple des réservations par statut
    this.doc.setFontSize(16);
    this.doc.text('Répartition des réservations par statut', 20, 135);
    
    const statusStats = this.calculateStatusDistribution(data.data);
    let yPos = 150;
    statusStats.forEach((status, index) => {
      const percentage = ((status.count / stats.total) * 100).toFixed(1);
      this.doc.setFontSize(10);
      this.doc.text(`${status.name}: ${status.count} (${percentage}%)`, 20, yPos);
      yPos += 8;
    });
    
    // Tableau des réservations
    this.doc.setFontSize(16);
    this.doc.text('Détail des réservations', 20, yPos + 10);
    
    const tableData = data.data.map((reservation: ReservationData) => [
      reservation.id,
      reservation.clientName,
      reservation.hotelName,
      reservation.checkIn,
      reservation.checkOut,
      reservation.status,
      `${reservation.amount}€`
    ]);
    
    (this.doc as any).autoTable({
      startY: yPos + 20,
      head: [['ID', 'Client', 'Hôtel', 'Arrivée', 'Départ', 'Statut', 'Montant']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    return this.doc.output('bloburl') as unknown as string;
  }

  // Générer un rapport financier
  generateRevenueReport(data: ReportData): string {
    this.doc.setFontSize(20);
    this.doc.text('Rapport Financier', 20, 20);
    
    this.doc.setFontSize(12);
    this.doc.text(`Période: ${data.period}`, 20, 35);
    this.doc.text(`Généré le: ${data.generatedAt}`, 20, 45);
    
    // Résumé financier
    this.doc.setFontSize(16);
    this.doc.text('Résumé financier', 20, 65);
    
    const totalRevenue = data.data.reduce((sum: number, item: RevenueData) => sum + item.revenue, 0);
    const totalReservations = data.data.reduce((sum: number, item: RevenueData) => sum + item.reservations, 0);
    const avgOccupancy = data.data.reduce((sum: number, item: RevenueData) => sum + item.occupancy, 0) / data.data.length;
    
    this.doc.setFontSize(10);
    this.doc.text(`Revenus totaux: ${totalRevenue.toLocaleString()}€`, 20, 80);
    this.doc.text(`Réservations totales: ${totalReservations}`, 20, 90);
    this.doc.text(`Taux d'occupation moyen: ${avgOccupancy.toFixed(1)}%`, 20, 100);
    
    // Graphique des revenus (tableau)
    this.doc.setFontSize(16);
    this.doc.text('Évolution des revenus', 20, 125);
    
    const tableData = data.data.map((item: RevenueData) => [
      item.month,
      `${item.revenue.toLocaleString()}€`,
      item.reservations.toString(),
      `${item.occupancy}%`
    ]);
    
    (this.doc as any).autoTable({
      startY: 135,
      head: [['Mois', 'Revenus', 'Réservations', 'Occupation']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }
    });
    
    return this.doc.output('bloburl') as unknown as string;
  }

  // Générer un rapport de performance des hôtels
  generateHotelsReport(data: ReportData): string {
    this.doc.setFontSize(20);
    this.doc.text('Performance des Hôtels', 20, 20);
    
    this.doc.setFontSize(12);
    this.doc.text(`Période: ${data.period}`, 20, 35);
    this.doc.text(`Généré le: ${data.generatedAt}`, 20, 45);
    
    // Classement des hôtels
    this.doc.setFontSize(16);
    this.doc.text('Classement par performance', 20, 65);
    
    const tableData = data.data.map((hotel: HotelPerformance, index: number) => [
      (index + 1).toString(),
      hotel.name,
      hotel.reservations.toString(),
      `${hotel.revenue.toLocaleString()}€`,
      `${hotel.occupancy}%`,
      hotel.rating.toString()
    ]);
    
    (this.doc as any).autoTable({
      startY: 75,
      head: [['Rang', 'Hôtel', 'Réservations', 'Revenus', 'Occupation', 'Note']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247] }
    });
    
    // Statistiques supplémentaires
    this.doc.setFontSize(16);
    this.doc.text('Statistiques', 20, this.doc.lastAutoTable.finalY + 20);
    
    const totalRevenue = data.data.reduce((sum: number, hotel: HotelPerformance) => sum + hotel.revenue, 0);
    const totalReservations = data.data.reduce((sum: number, hotel: HotelPerformance) => sum + hotel.reservations, 0);
    const avgRating = data.data.reduce((sum: number, hotel: HotelPerformance) => sum + hotel.rating, 0) / data.data.length;
    
    this.doc.setFontSize(10);
    this.doc.text(`Revenus totaux: ${totalRevenue.toLocaleString()}€`, 20, this.doc.lastAutoTable.finalY + 35);
    this.doc.text(`Réservations totales: ${totalReservations}`, 20, this.doc.lastAutoTable.finalY + 45);
    this.doc.text(`Note moyenne: ${avgRating.toFixed(1)}/5`, 20, this.doc.lastAutoTable.finalY + 55);
    
    return this.doc.output('bloburl') as unknown as string;
  }

  // Générer un rapport d'occupation
  generateOccupancyReport(data: ReportData): string {
    this.doc.setFontSize(20);
    this.doc.text('Rapport d\'Occupation', 20, 20);
    
    this.doc.setFontSize(12);
    this.doc.text(`Période: ${data.period}`, 20, 35);
    this.doc.text(`Généré le: ${data.generatedAt}`, 20, 45);
    
    // Taux d'occupation par hôtel
    this.doc.setFontSize(16);
    this.doc.text('Taux d\'occupation par établissement', 20, 65);
    
    const tableData = data.data.map((hotel: HotelPerformance) => [
      hotel.name,
      `${hotel.occupancy}%`,
      hotel.reservations.toString(),
      `${hotel.revenue.toLocaleString()}€`
    ]);
    
    (this.doc as any).autoTable({
      startY: 75,
      head: [['Hôtel', 'Taux d\'occupation', 'Réservations', 'Revenus']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [251, 146, 60] }
    });
    
    // Analyse des tendances
    this.doc.setFontSize(16);
    this.doc.text('Analyse des tendances', 20, this.doc.lastAutoTable.finalY + 20);
    
    const avgOccupancy = data.data.reduce((sum: number, hotel: HotelPerformance) => sum + hotel.occupancy, 0) / data.data.length;
    const bestHotel = data.data.reduce((best: HotelPerformance, hotel: HotelPerformance) => 
      hotel.occupancy > best.occupancy ? hotel : best
    );
    
    this.doc.setFontSize(10);
    this.doc.text(`Taux d'occupation moyen: ${avgOccupancy.toFixed(1)}%`, 20, this.doc.lastAutoTable.finalY + 35);
    this.doc.text(`Meilleur établissement: ${bestHotel.name} (${bestHotel.occupancy}%)`, 20, this.doc.lastAutoTable.finalY + 45);
    
    return this.doc.output('bloburl') as unknown as string;
  }

  // Générer un rapport d'analyse clients
  generateClientsReport(data: ReportData): string {
    this.doc.setFontSize(20);
    this.doc.text('Analyse des Clients', 20, 20);
    
    this.doc.setFontSize(12);
    this.doc.text(`Période: ${data.period}`, 20, 35);
    this.doc.text(`Généré le: ${data.generatedAt}`, 20, 45);
    
    // Profil des clients
    this.doc.setFontSize(16);
    this.doc.text('Profil des clients', 20, 65);
    
    const clientTypes = this.analyzeClientTypes(data.data);
    const tableData = Object.entries(clientTypes).map(([type, count]) => [
      type,
      count.toString(),
      `${((count / data.data.length) * 100).toFixed(1)}%`
    ]);
    
    (this.doc as any).autoTable({
      startY: 75,
      head: [['Type de client', 'Nombre', 'Pourcentage']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] }
    });
    
    // Clients les plus fidèles
    this.doc.setFontSize(16);
    this.doc.text('Clients les plus fidèles', 20, this.doc.lastAutoTable.finalY + 20);
    
    const topClients = data.data
      .sort((a: any, b: any) => b.reservations - a.reservations)
      .slice(0, 10);
    
    const topClientsData = topClients.map((client: any) => [
      client.nom,
      client.type,
      client.reservations.toString(),
      `${client.totalSpent}€`
    ]);
    
    (this.doc as any).autoTable({
      startY: this.doc.lastAutoTable.finalY + 30,
      head: [['Client', 'Type', 'Réservations', 'Total dépensé']],
      body: topClientsData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] }
    });
    
    return this.doc.output('bloburl') as unknown as string;
  }

  // Méthodes utilitaires
  private calculateReservationStats(reservations: ReservationData[]) {
    const total = reservations.length;
    const confirmed = reservations.filter(r => r.status === 'confirmée').length;
    const pending = reservations.filter(r => r.status === 'en cours').length;
    const totalRevenue = reservations.reduce((sum, r) => sum + r.amount, 0);
    
    return { total, confirmed, pending, totalRevenue };
  }

  private calculateStatusDistribution(reservations: ReservationData[]) {
    const statusCount: { [key: string]: number } = {};
    reservations.forEach(reservation => {
      statusCount[reservation.status] = (statusCount[reservation.status] || 0) + 1;
    });
    
    return Object.entries(statusCount).map(([name, count]) => ({ name, count }));
  }

  private analyzeClientTypes(clients: any[]) {
    const types: { [key: string]: number } = {};
    clients.forEach(client => {
      types[client.type] = (types[client.type] || 0) + 1;
    });
    return types;
  }

  // Méthode générique pour générer un rapport
  generateReport(type: string, data: ReportData): string {
    switch (type) {
      case 'reservations':
        return this.generateReservationsReport(data);
      case 'revenue':
        return this.generateRevenueReport(data);
      case 'hotels':
        return this.generateHotelsReport(data);
      case 'occupancy':
        return this.generateOccupancyReport(data);
      case 'clients':
        return this.generateClientsReport(data);
      default:
        throw new Error(`Type de rapport non supporté: ${type}`);
    }
  }
}

// Données d'exemple pour les tests
export const sampleData = {
  reservations: [
    { id: 'RES001', clientName: 'Marie Dupont', hotelName: 'Hôtel Central', checkIn: '2024-01-15', checkOut: '2024-01-18', status: 'confirmée', amount: 450 },
    { id: 'RES002', clientName: 'TechCorp', hotelName: 'Résidence du Port', checkIn: '2024-01-20', checkOut: '2024-01-25', status: 'confirmée', amount: 1200 },
    { id: 'RES003', clientName: 'Aide Sociale Plus', hotelName: 'Château des Alpes', checkIn: '2024-01-22', checkOut: '2024-01-24', status: 'en cours', amount: 300 }
  ],
  
  revenue: [
    { month: 'Janvier', revenue: 52000, reservations: 145, occupancy: 72 },
    { month: 'Février', revenue: 48000, reservations: 132, occupancy: 68 },
    { month: 'Mars', revenue: 61000, reservations: 167, occupancy: 75 },
    { month: 'Avril', revenue: 68000, reservations: 189, occupancy: 82 }
  ],
  
  hotels: [
    { name: 'Hôtel Central', reservations: 234, revenue: 15600, occupancy: 92, rating: 4.8 },
    { name: 'Résidence du Port', reservations: 189, revenue: 12800, occupancy: 88, rating: 4.6 },
    { name: 'Château des Alpes', reservations: 156, revenue: 11200, occupancy: 85, rating: 4.7 }
  ],
  
  clients: [
    { nom: 'Marie Dupont', type: 'Particulier', reservations: 12, totalSpent: 4800 },
    { nom: 'TechCorp', type: 'Entreprise', reservations: 25, totalSpent: 15000 },
    { nom: 'Aide Sociale Plus', type: 'Association', reservations: 45, totalSpent: 18000 }
  ]
}; 