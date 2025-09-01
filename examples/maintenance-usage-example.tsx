/**
 * Exemple d'utilisation des hooks de maintenance
 * Ce fichier montre comment utiliser les hooks créés pour gérer les tâches de maintenance
 */

import React, { useState } from 'react'
import { useMaintenance, useMaintenanceForRoom, useMaintenanceForHotel } from '@/hooks/useMaintenance'
import { MaintenanceTask } from '@/lib/supabase'

// ===================================================
// Exemple 1: Composant de liste des tâches de maintenance
// ===================================================

interface MaintenanceListProps {
  hotelId?: number
  roomId?: number
}

export function MaintenanceList({ hotelId, roomId }: MaintenanceListProps) {
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceTask['statut']>()
  const [selectedPriority, setSelectedPriority] = useState<MaintenanceTask['priorite']>()

  const {
    tasks,
    loading,
    error,
    stats,
    creerTache,
    terminerTache,
    commencerTache,
    annulerTache,
    isTaskOverdue,
    isTaskDueSoon,
    getTaskPriorityColor,
    getTaskStatusColor
  } = useMaintenance(hotelId, roomId, {
    statut: selectedStatus,
    priorite: selectedPriority
  })

  if (loading) return <div>Chargement des tâches...</div>
  if (error) return <div>Erreur: {error}</div>

  return (
    <div className="maintenance-list">
      <div className="maintenance-header">
        <h2>Tâches de Maintenance</h2>
        
        {/* Statistiques */}
        <div className="maintenance-stats">
          <div className="stat-card">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">En attente</span>
            <span className="stat-value">{stats.enAttente}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">En cours</span>
            <span className="stat-value">{stats.enCours}</span>
          </div>
          <div className="stat-card urgent">
            <span className="stat-label">En retard</span>
            <span className="stat-value">{stats.tachesEnRetard}</span>
          </div>
        </div>

        {/* Filtres */}
        <div className="maintenance-filters">
          <select 
            value={selectedStatus || ''} 
            onChange={(e) => setSelectedStatus(e.target.value as MaintenanceTask['statut'] || undefined)}
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </select>

          <select 
            value={selectedPriority || ''} 
            onChange={(e) => setSelectedPriority(e.target.value as MaintenanceTask['priorite'] || undefined)}
          >
            <option value="">Toutes les priorités</option>
            <option value="faible">Faible</option>
            <option value="moyenne">Moyenne</option>
            <option value="haute">Haute</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
      </div>

      {/* Liste des tâches */}
      <div className="maintenance-tasks">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className={`task-card ${isTaskOverdue(task) ? 'overdue' : ''} ${isTaskDueSoon(task) ? 'due-soon' : ''}`}
          >
            <div className="task-header">
              <h3>{task.titre}</h3>
              <div className="task-badges">
                <span className={`priority-badge priority-${getTaskPriorityColor(task.priorite)}`}>
                  {task.priorite}
                </span>
                <span className={`status-badge status-${getTaskStatusColor(task.statut)}`}>
                  {task.statut}
                </span>
              </div>
            </div>

            <p className="task-description">{task.description}</p>

            <div className="task-details">
              <div>Responsable: {task.responsable || 'Non assigné'}</div>
              {task.date_echeance && (
                <div>
                  Échéance: {new Date(task.date_echeance).toLocaleDateString()}
                  {isTaskOverdue(task) && <span className="overdue-indicator"> (En retard!)</span>}
                </div>
              )}
            </div>

            {task.notes && (
              <div className="task-notes">
                <strong>Notes:</strong> {task.notes}
              </div>
            )}

            {/* Actions */}
            <div className="task-actions">
              {task.statut === 'en_attente' && (
                <button onClick={() => commencerTache(task.id)}>
                  Commencer
                </button>
              )}
              {task.statut === 'en_cours' && (
                <button onClick={() => terminerTache(task.id)}>
                  Terminer
                </button>
              )}
              {task.statut !== 'terminee' && (
                <button onClick={() => annulerTache(task.id, 'Annulée par l\'utilisateur')}>
                  Annuler
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===================================================
// Exemple 2: Composant pour créer une nouvelle tâche
// ===================================================

interface CreateMaintenanceTaskProps {
  roomId: number
  hotelId?: number
  onTaskCreated?: (task: MaintenanceTask) => void
}

export function CreateMaintenanceTask({ roomId, hotelId, onTaskCreated }: CreateMaintenanceTaskProps) {
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [priorite, setPriorite] = useState<MaintenanceTask['priorite']>('moyenne')
  const [responsable, setResponsable] = useState('')
  const [dateEcheance, setDateEcheance] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { creerTache } = useMaintenance(hotelId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titre.trim()) return

    try {
      setSubmitting(true)
      const result = await creerTache({
        titre: titre.trim(),
        description: description.trim() || undefined,
        priorite,
        responsable: responsable.trim() || undefined,
        date_echeance: dateEcheance || undefined,
        notes: notes.trim() || undefined,
        room_id: roomId
      })

      if (result.success && result.data) {
        onTaskCreated?.(result.data)
        // Reset form
        setTitre('')
        setDescription('')
        setPriorite('moyenne')
        setResponsable('')
        setDateEcheance('')
        setNotes('')
      }
    } catch (error) {
      console.error('Erreur lors de la création de la tâche:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-maintenance-task">
      <h3>Créer une nouvelle tâche de maintenance</h3>

      <div className="form-group">
        <label htmlFor="titre">Titre *</label>
        <input
          type="text"
          id="titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
          placeholder="Ex: Réparer robinet chambre 101"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Détails sur le problème à résoudre"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="priorite">Priorité</label>
          <select
            id="priorite"
            value={priorite}
            onChange={(e) => setPriorite(e.target.value as MaintenanceTask['priorite'])}
          >
            <option value="faible">Faible</option>
            <option value="moyenne">Moyenne</option>
            <option value="haute">Haute</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="responsable">Responsable</label>
          <input
            type="text"
            id="responsable"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Nom du responsable"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="dateEcheance">Date d'échéance</label>
        <input
          type="date"
          id="dateEcheance"
          value={dateEcheance}
          onChange={(e) => setDateEcheance(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes additionnelles"
        />
      </div>

      <button type="submit" disabled={submitting || !titre.trim()}>
        {submitting ? 'Création...' : 'Créer la tâche'}
      </button>
    </form>
  )
}

// ===================================================
// Exemple 3: Dashboard de maintenance pour un hôtel
// ===================================================

interface MaintenanceDashboardProps {
  hotelId: number
}

export function MaintenanceDashboard({ hotelId }: MaintenanceDashboardProps) {
  const { 
    stats, 
    getTachesEnRetard, 
    getTachesProchesEcheance, 
    getTachesByPriorite,
    loading 
  } = useMaintenanceForHotel(hotelId)

  if (loading) return <div>Chargement du tableau de bord...</div>

  const tachesEnRetard = getTachesEnRetard()
  const tachesProchesEcheance = getTachesProchesEcheance(7)
  const tachesUrgentes = getTachesByPriorite('urgente')

  return (
    <div className="maintenance-dashboard">
      <h2>Tableau de bord Maintenance</h2>

      {/* Vue d'ensemble */}
      <div className="dashboard-overview">
        <div className="overview-card">
          <h3>Statistiques générales</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total des tâches</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">En cours</span>
              <span className="stat-value">{stats.enCours}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Terminées</span>
              <span className="stat-value">{stats.terminees}</span>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>Répartition par priorité</h3>
          <div className="priority-breakdown">
            <div className="priority-item urgent">
              <span>Urgente</span>
              <span>{stats.parPriorite.urgente}</span>
            </div>
            <div className="priority-item high">
              <span>Haute</span>
              <span>{stats.parPriorite.haute}</span>
            </div>
            <div className="priority-item medium">
              <span>Moyenne</span>
              <span>{stats.parPriorite.moyenne}</span>
            </div>
            <div className="priority-item low">
              <span>Faible</span>
              <span>{stats.parPriorite.faible}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      <div className="dashboard-alerts">
        {tachesEnRetard.length > 0 && (
          <div className="alert alert-error">
            <h4>⚠️ Tâches en retard ({tachesEnRetard.length})</h4>
            <ul>
              {tachesEnRetard.slice(0, 5).map(task => (
                <li key={task.id}>
                  {task.titre} - Échéance: {new Date(task.date_echeance!).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tachesUrgentes.length > 0 && (
          <div className="alert alert-urgent">
            <h4>🚨 Tâches urgentes ({tachesUrgentes.length})</h4>
            <ul>
              {tachesUrgentes.slice(0, 5).map(task => (
                <li key={task.id}>
                  {task.titre} - Statut: {task.statut}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tachesProchesEcheance.length > 0 && (
          <div className="alert alert-warning">
            <h4>📅 Tâches à échéance proche ({tachesProchesEcheance.length})</h4>
            <ul>
              {tachesProchesEcheance.slice(0, 5).map(task => (
                <li key={task.id}>
                  {task.titre} - Échéance: {new Date(task.date_echeance!).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ===================================================
// Exemple 4: Hook simple pour une chambre spécifique
// ===================================================

export function RoomMaintenanceWidget({ roomId }: { roomId: number }) {
  const { tasks, creerTache, stats } = useMaintenanceForRoom(roomId)

  const activeTasks = tasks.filter(t => t.statut === 'en_attente' || t.statut === 'en_cours')

  return (
    <div className="room-maintenance-widget">
      <h4>Maintenance de la chambre</h4>
      
      <div className="quick-stats">
        <span>Tâches actives: {activeTasks.length}</span>
        <span>En retard: {stats.tachesEnRetard}</span>
      </div>

      {activeTasks.length > 0 && (
        <div className="active-tasks-list">
          {activeTasks.map(task => (
            <div key={task.id} className="mini-task-card">
              <span className={`priority-dot priority-${task.priorite}`}></span>
              <span className="task-title">{task.titre}</span>
              <span className="task-status">{task.statut}</span>
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={() => {
          // Exemple de création rapide
          creerTache({
            titre: 'Maintenance rapide',
            priorite: 'moyenne',
            room_id: roomId
          })
        }}
        className="quick-create-btn"
      >
        + Ajouter tâche
      </button>
    </div>
  )
}

// ===================================================
// CSS Styles (à ajouter dans votre fichier CSS)
// ===================================================

const styles = `
.maintenance-list {
  padding: 20px;
}

.maintenance-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.stat-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-card.urgent {
  background: #fee;
  color: #c33;
}

.task-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  background: white;
}

.task-card.overdue {
  border-left: 4px solid #e74c3c;
}

.task-card.due-soon {
  border-left: 4px solid #f39c12;
}

.priority-badge.priority-red { background: #e74c3c; color: white; }
.priority-badge.priority-orange { background: #f39c12; color: white; }
.priority-badge.priority-yellow { background: #f1c40f; color: black; }
.priority-badge.priority-green { background: #27ae60; color: white; }

.status-badge.status-gray { background: #95a5a6; }
.status-badge.status-blue { background: #3498db; }
.status-badge.status-green { background: #27ae60; }
.status-badge.status-red { background: #e74c3c; }

.task-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.task-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
`