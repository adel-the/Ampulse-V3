export const getModernTemplate = (type: string): string => {
  switch (type) {
    case 'facture':
      return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #f97316;
            color: white;
            padding: 20px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: 1px;
        }
        .content {
            padding: 30px;
        }
        .sender-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #f97316;
        }
        .sender-info h3 {
            margin: 0 0 15px 0;
            color: #f97316;
            font-size: 16px;
            font-weight: 600;
        }
        .sender-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 14px;
        }
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .invoice-info, .client-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        .invoice-info h3, .client-info h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
            font-weight: 600;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .info-label {
            font-weight: 600;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .services-table th {
            background: #f97316;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }
        .services-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            font-size: 14px;
        }
        .services-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        .totals-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .totals-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
            font-weight: 600;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .total-row.final {
            font-weight: 600;
            font-size: 16px;
            color: #f97316;
            border-top: 2px solid #f97316;
            padding-top: 8px;
            margin-top: 8px;
        }
        .payment-info {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
        }
        .payment-info h3 {
            margin: 0 0 15px 0;
            color: #28a745;
            font-size: 16px;
            font-weight: 600;
        }
        .legal-mentions {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
            font-size: 12px;
            color: #856404;
        }
        .page-number {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FACTURE</h1>
        </div>
        
        <div class="content">
            <!-- En-tête expéditeur -->
            <div class="sender-info">
                <h3>Expéditeur (NOUVELLE ADRESSE)</h3>
                <div class="sender-details">
                    <div><strong>Voyages Services Plus</strong></div>
                    <div>Tour Liberty 17 place des Reflets</div>
                    <div>92400 Courbevoie</div>
                    <div>reservation@vesta-operateursolidaire.fr</div>
                    <div>SIRET: [SIRET de l'entreprise]</div>
                    <div>TVA Intracommunautaire: [Numéro TVA VSP]</div>
                </div>
            </div>

            <!-- Informations facture et client -->
            <div class="invoice-details">
                <div class="invoice-info">
                    <h3>Informations Facture</h3>
                    <div class="info-row">
                        <span class="info-label">N° Facture:</span>
                        <span class="info-value">{{numero_facture}}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date de facture:</span>
                        <span class="info-value">{{date_facture}}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date d'échéance:</span>
                        <span class="info-value">{{date_echeance}}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Référence client:</span>
                        <span class="info-value">{{reference_client}}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Période de facturation:</span>
                        <span class="info-value">{{periode_facturation}}</span>
                    </div>
                </div>

                <div class="client-info">
                    <h3>Informations Destinataire</h3>
                    <div class="info-row">
                        <span class="info-label">Nom destinataire:</span>
                        <span class="info-value">{{nom_destinataire}}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">N° de marché:</span>
                        <span class="info-value">{{numero_marche}}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">TVA Intracommunautaire:</span>
                        <span class="info-value">{{tva_destinataire}}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Service:</span>
                        <span class="info-value">{{service_destinataire}}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Adresse:</span>
                        <span class="info-value">{{adresse_destinataire}}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">{{email_destinataire}}</span>
                    </div>
                </div>
            </div>

            <!-- Tableau des prestations -->
            <h3>Détail des Prestations</h3>
            <table class="services-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Période</th>
                        <th>Nombre de nuits</th>
                        <th>Prix unitaire HT</th>
                        <th>Total HT</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{description_prestation}}</td>
                        <td>{{periode_prestation}}</td>
                        <td>{{nombre_nuits_prestation}}</td>
                        <td>{{prix_unitaire_prestation}} €</td>
                        <td>{{total_ht_prestation}} €</td>
                    </tr>
                </tbody>
            </table>

            <!-- Totaux -->
            <div class="totals-section">
                <h3>Totaux</h3>
                <div class="total-row">
                    <span>Sous-total HT:</span>
                    <span>{{sous_total_ht}} €</span>
                </div>
                <div class="total-row">
                    <span>TVA (20%):</span>
                    <span>{{tva}} €</span>
                </div>
                <div class="total-row final">
                    <span>TOTAL TTC:</span>
                    <span>{{total_ttc}} €</span>
                </div>
            </div>

            <!-- Informations de paiement -->
            <div class="payment-info">
                <h3>Informations de Paiement</h3>
                <div class="info-row">
                    <span class="info-label">Mode de paiement:</span>
                    <span class="info-value">{{mode_paiement}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">IBAN:</span>
                    <span class="info-value">{{iban}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">BIC:</span>
                    <span class="info-value">{{bic}}</span>
                </div>
            </div>

            <!-- Mentions légales -->
            <div class="legal-mentions">
                <strong>Conditions de paiement:</strong> Paiement à 30 jours<br>
                <strong>Pénalités de retard:</strong> En cas de retard de paiement, pénalités de 3 fois le taux légal<br>
                <strong>Mentions obligatoires:</strong> TVA non applicable - art. 293B du CGI
            </div>

            <div class="page-number">
                Page 1/1
            </div>
        </div>
    </div>
</body>
</html>`;

    case 'bon_reservation':
      return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
            letter-spacing: 2px;
        }
        .header .subtitle {
            margin-top: 10px;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
        }
        .section h2 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
            font-weight: 600;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .info-label {
            font-weight: 600;
            color: #666;
            min-width: 120px;
        }
        .info-value {
            color: #333;
            font-weight: 500;
        }
        .highlight-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .highlight-box h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .qr-code {
            width: 100px;
            height: 100px;
            background: #333;
            margin: 20px auto;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BON DE RÉSERVATION</h1>
            <div class="subtitle">Voyages Services Plus - Hébergement Social</div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📋 Informations Générales</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">N° Réservation:</span>
                        <span class="info-value">{{numero_reservation}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Date:</span>
                        <span class="info-value">{{date_generation}}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>👤 Prescripteur</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Nom:</span>
                        <span class="info-value">{{nom_prescripteur}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Organisme:</span>
                        <span class="info-value">{{organisme_prescripteur}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Téléphone:</span>
                        <span class="info-value">{{telephone_prescripteur}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-value">{{email_prescripteur}}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🏨 Hébergement</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Établissement:</span>
                        <span class="info-value">{{nom_hotel}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Chambre:</span>
                        <span class="info-value">{{numero_chambre}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Type:</span>
                        <span class="info-value">{{type_chambre}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Prix/nuit:</span>
                        <span class="info-value">{{prix_nuit}} €</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📅 Période de Séjour</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Arrivée:</span>
                        <span class="info-value">{{date_arrivee}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Départ:</span>
                        <span class="info-value">{{date_depart}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Durée:</span>
                        <span class="info-value">{{nombre_nuits}} nuits</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total:</span>
                        <span class="info-value">{{total_ttc}} €</span>
                    </div>
                </div>
            </div>

            <div class="highlight-box">
                <h3>✅ Réservation Confirmée</h3>
                <p>Cette réservation a été validée et confirmée par Voyages Services Plus.</p>
            </div>
        </div>

        <div class="footer">
            <div class="qr-code">QR CODE</div>
            <p>Document généré automatiquement par le système SoliReserve</p>
            <p>Voyages Services Plus - Tour Liberty 17 place des Reflets, 92400 Courbevoie</p>
        </div>
    </div>
</body>
</html>`;

    case 'prolongation_reservation':
      return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
            letter-spacing: 2px;
        }
        .header .subtitle {
            margin-top: 10px;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 4px solid #ff9a9e;
        }
        .section h2 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
            font-weight: 600;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .info-label {
            font-weight: 600;
            color: #666;
            min-width: 120px;
        }
        .info-value {
            color: #333;
            font-weight: 500;
        }
        .highlight-box {
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .highlight-box h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .qr-code {
            width: 100px;
            height: 100px;
            background: #333;
            margin: 20px auto;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PROLONGATION DE RÉSERVATION</h1>
            <div class="subtitle">Voyages Services Plus - Hébergement Social</div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📋 Informations de Prolongation</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">N° Prolongation:</span>
                        <span class="info-value">{{numero_prolongation}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">N° Réservation:</span>
                        <span class="info-value">{{numero_bon_initial}}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📅 Périodes</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Arrivée initiale:</span>
                        <span class="info-value">{{date_arrivee_initial}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Départ initial:</span>
                        <span class="info-value">{{date_depart_initial}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Nouveau départ:</span>
                        <span class="info-value">{{nouvelle_date_depart}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Nuits suppl.:</span>
                        <span class="info-value">{{nuits_supplementaires}}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>💰 Informations Financières</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Total supplément:</span>
                        <span class="info-value">{{total_supplement}} €</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Prise en charge:</span>
                        <span class="info-value">{{prise_charge}} €</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Reste à charge:</span>
                        <span class="info-value">{{reste_charge}} €</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📝 Motif de Prolongation</h2>
                <div class="info-item">
                    <span class="info-value">{{motif_prolongation}}</span>
                </div>
            </div>

            <div class="highlight-box">
                <h3>✅ Prolongation Validée</h3>
                <p>Cette prolongation a été validée et confirmée par Voyages Services Plus.</p>
            </div>
        </div>

        <div class="footer">
            <div class="qr-code">QR CODE</div>
            <p>Document généré automatiquement par le système SoliReserve</p>
            <p>Voyages Services Plus - Tour Liberty 17 place des Reflets, 92400 Courbevoie</p>
        </div>
    </div>
</body>
</html>`;

    case 'fin_prise_charge':
      return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
            letter-spacing: 2px;
        }
        .header .subtitle {
            margin-top: 10px;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 4px solid #ff6b6b;
        }
        .section h2 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
            font-weight: 600;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .info-label {
            font-weight: 600;
            color: #666;
            min-width: 120px;
        }
        .info-value {
            color: #333;
            font-weight: 500;
        }
        .highlight-box {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .highlight-box h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .qr-code {
            width: 100px;
            height: 100px;
            background: #333;
            margin: 20px auto;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FIN DE PRISE EN CHARGE</h1>
            <div class="subtitle">Voyages Services Plus - Hébergement Social</div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📋 Informations de Fin de Prise en Charge</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">N° Réservation:</span>
                        <span class="info-value">{{numero_reservation}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Date de fin:</span>
                        <span class="info-value">{{date_fin_prise_charge}}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>👥 Occupants</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Chef de famille:</span>
                        <span class="info-value">{{chef_famille}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Occupant 1:</span>
                        <span class="info-value">{{occupant_1}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Occupant 2:</span>
                        <span class="info-value">{{occupant_2}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Nombre total:</span>
                        <span class="info-value">{{nombre_personnes}}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🏨 Hébergement</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Établissement:</span>
                        <span class="info-value">{{nom_hotel}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Chambre:</span>
                        <span class="info-value">{{numero_chambre}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Type:</span>
                        <span class="info-value">{{type_chambre}}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>⚠️ Instructions de Libération</h2>
                <div class="highlight-box">
                    <h3>Les occupants devront libérer leur chambre avant midi le {{date_limite_liberation}}</h3>
                </div>
            </div>

            <div class="section">
                <h2>📝 Informations Complémentaires</h2>
                <div class="info-item">
                    <span class="info-value">{{informations_complementaires}}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="qr-code">QR CODE</div>
            <p>Document généré automatiquement par le système SoliReserve</p>
            <p>Voyages Services Plus - Tour Liberty 17 place des Reflets, 92400 Courbevoie</p>
        </div>
    </div>
</body>
</html>`;

    default:
      return '';
  }
}; 